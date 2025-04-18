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
  playlistId: string
): Promise<TrackInfo[]> {
  const tracks: TrackInfo[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(name,duration_ms,artists(name))),next&limit=50`; // Added fields query param for efficiency
  const headers = { Authorization: `Bearer ${accessToken}` };

  console.log(`Fetching tracks for playlist: ${playlistId}`);
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
      url = data.next; // Spotify gives you the next-page URL or null
      if (url) {
        console.log(`  - Fetching next page: ${url}`);
      }
    } catch (error) {
      console.error("Error during Spotify track fetch loop:", error);
      throw error; // Re-throw after logging
    }
  }
  console.log(`Finished fetching tracks for playlist ${playlistId}. Total: ${tracks.length}`);
  return tracks;
} 