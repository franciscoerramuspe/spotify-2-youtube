// client/src/lib/youtube.ts

import { google, Auth } from 'googleapis';

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  // Add other fields if needed, like snippet.title
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  // Add other response fields if needed
}

interface YouTubePlaylist {
  id: string;
  // Add other fields if needed
}

function getOAuth2Client(accessToken: string): Auth.OAuth2Client {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Finds a YouTube video matching the search query.
 * Note: This is a basic implementation. More sophisticated matching
 * might involve checking duration or other metadata.
 */
export async function findYouTubeVideo(
  accessToken: string,
  query: string // Simplified to just take the search query string
): Promise<string | null> {
  const youtube = google.youtube('v3');
  const auth = getOAuth2Client(accessToken);

  try {
    const response = await youtube.search.list({
      auth,
      part: ['id'],
      q: query,
      type: ['video'],
      maxResults: 1
    });

    return response.data.items?.[0]?.id?.videoId || null;
  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
}

/**
 * Creates a new private YouTube playlist.
 */
export async function createYouTubePlaylist(
  accessToken: string,
  title: string
): Promise<string> {
  const youtube = google.youtube('v3');
  const auth = getOAuth2Client(accessToken);

  try {
    const response = await youtube.playlists.insert({
      auth,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description: 'Created by Spotify to YouTube Migrator'
        },
        status: {
          privacyStatus: 'private'
        }
      }
    });

    return response.data.id || '';
  } catch (error) {
    console.error('YouTube playlist creation error:', error);
    throw error;
  }
}

/**
 * Adds videos to a YouTube playlist.
 * Handles potential rate limits by adding videos sequentially (basic). 
 * For large playlists, batching and proper error handling/retries are recommended.
 */
export async function addVideosToPlaylist(
  accessToken: string,
  playlistId: string,
  videoIds: string[]
): Promise<void> { // Return void as success is implied if no error is thrown
  const youtube = google.youtube('v3');
  const auth = getOAuth2Client(accessToken);

  try {
    for (const videoId of videoIds) {
      await youtube.playlistItems.insert({
        auth,
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('YouTube playlist item insertion error:', error);
    throw error;
  }
}