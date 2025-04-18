// src/app/api/migrate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ensure this path is correct
import { fetchSpotifyTracks } from "@/lib/spotify";
import { findYouTubeVideo, createYouTubePlaylist, addVideosToPlaylist } from "@/lib/youtube";

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
  const { spotifyPlaylistIds, targetPlaylistName } = requestBody;
  if (!Array.isArray(spotifyPlaylistIds) || spotifyPlaylistIds.length === 0 || !targetPlaylistName || typeof targetPlaylistName !== 'string') {
    console.error("POST /api/migrate: Missing or invalid fields", { spotifyPlaylistIds, targetPlaylistName });
    return NextResponse.json({ error: "Missing or invalid fields: spotifyPlaylistIds (array) and targetPlaylistName (string) are required." }, { status: 400 });
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

  console.log(`POST /api/migrate: Processing ${spotifyPlaylistIds.length} playlists for target: ${targetPlaylistName}`);

  try {
    // --- Aggregation Phase --- 
    let allTracks: SimpleTrack[] = [];
    console.log("POST /api/migrate: Fetching tracks from Spotify...");
    for (const playlistId of spotifyPlaylistIds) {
      try {
        const tracks = await fetchSpotifyTracks(spotifyToken, playlistId);
        console.log(`  - Fetched ${tracks.length} tracks from playlist ${playlistId}`);
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

    // --- YouTube Matching Phase ---
    console.log("POST /api/migrate: Matching tracks on YouTube...");
    const matchedVideoIds: string[] = [];
    const unmatchedTracks: string[] = [];
    // Consider running these searches in parallel for performance
    for (const track of allTracks) {
      const query = `${track.name} ${track.artist}`;
      try {
        const videoId = await findYouTubeVideo(youtubeToken, query); // Pass simple query
        if (videoId) {
          matchedVideoIds.push(videoId);
        } else {
          console.log(`  - No match found for: ${query}`);
          unmatchedTracks.push(`${track.name} - ${track.artist}`);
        }
      } catch (error) {
         console.error(`POST /api/migrate: Error searching YouTube for track "${query}"`, error);
         unmatchedTracks.push(`${track.name} - ${track.artist} (Search Error)`);
      }
    }
    console.log(`POST /api/migrate: YouTube matching complete. Found: ${matchedVideoIds.length}, Unmatched: ${unmatchedTracks.length}`);

    if (matchedVideoIds.length === 0) {
      console.warn("POST /api/migrate: No YouTube videos found for any tracks.");
      // Decide how to handle - return error? Create empty playlist?
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
      totalTracksProcessed: allTracks.length,
      totalVideosAdded: matchedVideoIds.length,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred during migration.";
    console.error("POST /api/migrate: Migration failed", error);
    return NextResponse.json({ error: `Migration Failed: ${message}` }, { status: 500 });
  }
} 