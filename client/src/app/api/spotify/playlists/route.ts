import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { NextResponse } from 'next/server';

interface SpotifyPlaylist { // Interface for the expected Spotify API response structure
  id: string;
  name: string;
  tracks: {
    total: number;
    href: string;
  };
  next: string | null; // For pagination
  items: SpotifyPlaylist[]; // Adjust based on actual Spotify API structure for paginated lists
}

// Helper function to fetch all playlists using pagination
async function getAllSpotifyPlaylists(accessToken: string): Promise<Array<{ id: string; name: string; trackCount: number }>> {
  let playlists: Array<{ id: string; name: string; trackCount: number }> = [];
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50"; // Initialize as string | null

  try {
    while (url) { // Loop continues as long as url is not null
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Spotify API Error:", response.status, errorData);
        throw new Error(`Spotify API Error: ${response.status} - ${errorData?.error?.message || 'Failed to fetch playlists'}`);
      }

      const data: SpotifyPlaylist = await response.json();

      const formattedPlaylists = data.items.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks.total,
      }));
      playlists = playlists.concat(formattedPlaylists);

      url = data.next; // Get the URL for the next page
    }
    return playlists;
  } catch (error) {
    console.error("Error fetching Spotify playlists:", error);
    // Re-throw the error to be caught by the main handler
    throw error instanceof Error ? error : new Error('An unknown error occurred while fetching playlists');
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.spotifyAccessToken) {
    console.log("GET /api/spotify/playlists: No Spotify access token found in session");
    return NextResponse.json({ error: 'Spotify not connected or session invalid' }, { status: 401 });
  }

  try {
    console.log("GET /api/spotify/playlists: Fetching playlists...");
    const playlists = await getAllSpotifyPlaylists(session.spotifyAccessToken);
    console.log(`GET /api/spotify/playlists: Successfully fetched ${playlists.length} playlists.`);
    return NextResponse.json({ playlists });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load playlists';
    console.error("GET /api/spotify/playlists Error:", message);
    return NextResponse.json({ error: `Internal Server Error: ${message}` }, { status: 500 });
  }
} 