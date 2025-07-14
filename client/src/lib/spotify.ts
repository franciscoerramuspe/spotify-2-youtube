// client/src/lib/spotify.ts
export interface TrackInfo {
  name: string;
  artist: string;
  duration_ms?: number; // Made optional as it might not always be present or used
}

interface SpotifyTrackItem {
  track: {
    name: string;
    artists: { name: string }[];
    duration_ms: number;
    // Add other relevant fields if needed
  } | null; // Handle cases where track might be null (e.g., local files)
}

interface SpotifyPlaylistTracksResponse {
  items: SpotifyTrackItem[];
  next: string | null;
  // Add other response fields if needed
}

export async function fetchSpotifyTracks(
  accessToken: string,
  playlistId: string,
  options?: {
    limit?: number; // Max number of tracks to fetch
    latestFirst?: boolean; // Whether to get newest tracks first
  }
): Promise<TrackInfo[]> {
  const tracks: TrackInfo[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(name,duration_ms,artists(name))),next&limit=50`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  console.log(`Fetching tracks for playlist: ${playlistId} ${options?.limit ? `(limit: ${options.limit})` : '(all tracks)'} ${options?.latestFirst ? '(newest first)' : ''}`);
  
  // If we need latest first with a limit, we might need to fetch more strategically
  // For now, let's fetch all and then process
  while (url) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Spotify fetch failed for ${url}: ${res.status}`, errorBody);
        throw new Error(`Spotify fetch failed: ${res.status}`);
      }
      const data: SpotifyPlaylistTracksResponse = await res.json();

      for (const item of data.items) {
        const t = item.track;
        // Ensure track and artist info exist
        if (t && t.name && t.artists && t.artists.length > 0 && t.artists[0].name) {
          tracks.push({
            name: t.name,
            artist: t.artists[0].name, // Using only the primary artist
            duration_ms: t.duration_ms,
          });
        } else {
            console.log(`  - Skipping track item due to missing data: ${JSON.stringify(item)}`);
        }
      }
      
      // If we have a limit and we're getting latest first, we might be able to optimize
      // But for now, let's fetch all and process at the end
      url = data.next;
      if (url) {
        console.log(`  - Fetching next page: ${url}`);
      }
    } catch (error) {
      console.error("Error during Spotify track fetch loop:", error);
      throw error;
    }
  }

  // Process the tracks based on options
  let processedTracks = tracks;
  
  // If latestFirst is true, reverse the array (Spotify returns oldest first by default)
  if (options?.latestFirst) {
    processedTracks = [...tracks].reverse();
    console.log(`  - Reversed track order (newest first)`);
  }
  
  // If limit is specified, take only the first N tracks
  if (options?.limit && options.limit > 0) {
    processedTracks = processedTracks.slice(0, options.limit);
    console.log(`  - Limited to ${options.limit} tracks`);
  }

  console.log(`Finished fetching tracks for playlist ${playlistId}. Total fetched: ${tracks.length}, Final result: ${processedTracks.length}`);
  return processedTracks;
} 