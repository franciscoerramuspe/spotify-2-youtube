// src/app/api/migrate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ensure this path is correct
import { fetchSpotifyTracks } from "@/lib/spotify";
import { findYouTubeVideo, createYouTubePlaylist, addVideosToPlaylist, testYouTubeQuota } from "@/lib/youtube";

// Interface for a simplified track object for processing
interface SimpleTrack {
  name: string;
  artist: string;
  duration_ms?: number; // Optional, but helpful for matching
}

export async function POST(request: NextRequest) {
  console.log("POST /api/migrate: Received request");
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("POST /api/migrate: Invalid JSON body", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 1. Parse & validate payload
  const { spotifyPlaylistIds, targetPlaylistName, trackLimit, limitMode } = requestBody;
  if (!Array.isArray(spotifyPlaylistIds) || spotifyPlaylistIds.length === 0 || !targetPlaylistName || typeof targetPlaylistName !== 'string') {
    console.error("POST /api/migrate: Missing or invalid fields", { spotifyPlaylistIds, targetPlaylistName });
    return NextResponse.json({ error: "Missing or invalid fields: spotifyPlaylistIds (array) and targetPlaylistName (string) are required." }, { status: 400 });
  }

  // Validate track limit if using "latest" mode
  if (limitMode === "latest" && (!trackLimit || typeof trackLimit !== 'number' || trackLimit <= 0)) {
    console.error("POST /api/migrate: Invalid track limit for latest mode", { trackLimit, limitMode });
    return NextResponse.json({ error: "When using 'latest' mode, trackLimit must be a positive number." }, { status: 400 });
  }

  // 2. Authenticate session and get tokens
  const session = await getServerSession(authOptions);
  // Correctly access tokens based on our authOptions structure
  const spotifyToken = session?.spotifyAccessToken;
  const youtubeToken = session?.googleAccessToken; // Assuming Google provider gives YouTube access

  if (!spotifyToken || !youtubeToken) {
    console.error("POST /api/migrate: Not authenticated or missing tokens", { hasSpotify: !!spotifyToken, hasYoutube: !!youtubeToken });
    return NextResponse.json({ error: "Authentication required: Both Spotify and YouTube must be connected." }, { status: 401 });
  }

  console.log(`POST /api/migrate: Processing ${spotifyPlaylistIds.length} playlists for target: ${targetPlaylistName} ${limitMode === "latest" ? `(latest ${trackLimit} tracks per playlist)` : "(all tracks)"}`);

  try {
    // --- Aggregation Phase --- 
    let allTracks: SimpleTrack[] = [];
    console.log("POST /api/migrate: Fetching tracks from Spotify...");
    
    // Set up fetch options based on user selection
    const fetchOptions = limitMode === "latest" ? {
      limit: trackLimit,
      latestFirst: true
    } : undefined;

    for (const playlistId of spotifyPlaylistIds) {
      try {
        const tracks = await fetchSpotifyTracks(spotifyToken, playlistId, fetchOptions);
        console.log(`  - Fetched ${tracks.length} tracks from playlist ${playlistId}${limitMode === "latest" ? ` (latest ${trackLimit})` : ""}`);
        allTracks = allTracks.concat(tracks);
      } catch (error) {
        console.error(`POST /api/migrate: Failed to fetch tracks for playlist ${playlistId}`, error);
        // Option: Continue with other playlists or fail the whole request?
        // For now, let's continue but maybe collect errors.
      }
    }
    console.log(`POST /api/migrate: Total tracks fetched from Spotify: ${allTracks.length}`);

    if (allTracks.length === 0) {
       console.warn("POST /api/migrate: No tracks found in selected playlists.");
       // Decide how to handle this - maybe create an empty YT playlist or return an error?
       // Let's return a specific message for now.
       return NextResponse.json({ error: "No tracks found in the selected Spotify playlists." }, { status: 400 });
    }

    // --- YouTube Quota Check (Temporarily Disabled to Avoid Extra Quota Usage) ---
    console.log("POST /api/migrate: Skipping quota pre-check to conserve quota units");
    // Commenting out quota check as it consumes 100 units even when quota is already exceeded
    // const quotaCheck = await testYouTubeQuota(youtubeToken);
    // if (!quotaCheck.available) {
    //   console.error("POST /api/migrate: YouTube quota check failed:", quotaCheck.error);
    //   return NextResponse.json({ 
    //     error: `YouTube API quota exceeded. ${quotaCheck.error}. Please try again tomorrow or contact support.`,
    //     quotaExceeded: true,
    //     quotaExceededTracks: allTracks.length
    //   }, { status: 429 });
    // }
    console.log("POST /api/migrate: Proceeding with search (quota check disabled)");

    // --- YouTube Matching Phase ---
    console.log("POST /api/migrate: Matching tracks on YouTube...");
    const matchedVideoIds: string[] = [];
    const unmatchedTracks: string[] = [];
    const quotaExceededTracks: string[] = [];
    
    // Rate limiting: Process tracks with delays to avoid hitting quota too fast
    console.log(`POST /api/migrate: Processing ${allTracks.length} tracks with rate limiting...`);
    
    for (let i = 0; i < allTracks.length; i++) {
      const track = allTracks[i];
      const query = `${track.name} ${track.artist}`;
      
      try {
        console.log(`  - [${i + 1}/${allTracks.length}] Searching: ${query}`);
        const videoId = await findYouTubeVideo(youtubeToken, query);
        
        if (videoId) {
          matchedVideoIds.push(videoId);
          console.log(`    ✓ Found: ${videoId}`);
        } else {
          console.log(`    ✗ No match found for: ${query}`);
          unmatchedTracks.push(`${track.name} - ${track.artist}`);
        }
        
        // Add delay between requests to respect rate limits (1 request per second)
        if (i < allTracks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 second delay
        }
        
      } catch (error: any) {
        // Check if it's a quota error
        if (error?.status === 403 && error?.message?.includes('quota')) {
          console.error(`POST /api/migrate: YouTube quota exceeded at track ${i + 1}`);
          quotaExceededTracks.push(`${track.name} - ${track.artist}`);
          
          // Add remaining tracks to quota exceeded list
          for (let j = i + 1; j < allTracks.length; j++) {
            const remainingTrack = allTracks[j];
            quotaExceededTracks.push(`${remainingTrack.name} - ${remainingTrack.artist}`);
          }
          
          console.log(`POST /api/migrate: Stopping search due to quota. Processed ${i + 1}/${allTracks.length} tracks`);
          break; // Stop processing when quota is exceeded
        } else {
          console.error(`POST /api/migrate: Error searching YouTube for track "${query}"`, error);
          unmatchedTracks.push(`${track.name} - ${track.artist} (Search Error)`);
        }
      }
    }
    console.log(`POST /api/migrate: YouTube matching complete. Found: ${matchedVideoIds.length}, Unmatched: ${unmatchedTracks.length}, Quota Exceeded: ${quotaExceededTracks.length}`);

    if (matchedVideoIds.length === 0) {
      console.warn("POST /api/migrate: No YouTube videos found for any tracks.");
      
      // If it's due to quota, provide specific message
      if (quotaExceededTracks.length > 0) {
        return NextResponse.json({ 
          error: "YouTube API quota exceeded. Please try again tomorrow or reduce the number of tracks.", 
          quotaExceeded: true,
          quotaExceededTracks: quotaExceededTracks.length 
        }, { status: 429 }); // 429 = Too Many Requests
      }
      
      return NextResponse.json({ error: "Could not find any matching YouTube videos for the tracks in the selected playlists." }, { status: 400 });
    }

    // --- YouTube Playlist Creation & Population Phase ---
    console.log("POST /api/migrate: Creating YouTube playlist...");
    const newYouTubePlaylistId = await createYouTubePlaylist(youtubeToken, targetPlaylistName.trim());
    console.log(`POST /api/migrate: Created YouTube playlist ID: ${newYouTubePlaylistId}`);

    console.log("POST /api/migrate: Adding videos to YouTube playlist...");
    // Add videos in batches (YouTube API often limits additions per request)
    await addVideosToPlaylist(youtubeToken, newYouTubePlaylistId, matchedVideoIds);
    console.log(`POST /api/migrate: Added ${matchedVideoIds.length} videos to playlist ${newYouTubePlaylistId}`);

    // --- Respond --- 
    console.log("POST /api/migrate: Migration process completed successfully.");
    return NextResponse.json({
      youtubePlaylistId: newYouTubePlaylistId,
      unmatchedTracks: unmatchedTracks,
      quotaExceededTracks: quotaExceededTracks,
      totalTracksProcessed: allTracks.length,
      totalVideosAdded: matchedVideoIds.length,
      quotaExceeded: quotaExceededTracks.length > 0,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred during migration.";
    console.error("POST /api/migrate: Migration failed", error);
    return NextResponse.json({ error: `Migration Failed: ${message}` }, { status: 500 });
  }
} 