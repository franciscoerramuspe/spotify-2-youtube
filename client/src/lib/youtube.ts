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
 * Test YouTube API quota availability with a simple search
 * WARNING: This consumes 100 quota units even if just testing!
 */
export async function testYouTubeQuota(accessToken: string): Promise<{ available: boolean; error?: string }> {
  const youtube = google.youtube('v3');
  const auth = getOAuth2Client(accessToken);

  try {
    console.log(`[QUOTA] Testing YouTube quota - This will consume 100 units`);
    // Simple test search with minimal quota usage
    const response = await youtube.search.list({
      auth,
      part: ['id'],
      q: 'test',
      type: ['video'],
      maxResults: 1
    });

    console.log(`[QUOTA] Test search successful - 100 units consumed`);
    return { available: true };
  } catch (error: any) {
    console.log(`[QUOTA] Test search failed - Still consumed 100 units! Error:`, error?.message);
    if (error?.status === 403 && error?.message?.includes('quota')) {
      return { available: false, error: 'YouTube API quota exceeded' };
    }
    return { available: false, error: error?.message || 'Unknown YouTube API error' };
  }
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
    console.log(`[QUOTA] Searching YouTube for: "${query}" - Will consume 100 units`);
    const response = await youtube.search.list({
      auth,
      part: ['id'],
      q: query,
      type: ['video'],
      maxResults: 1
    });

    const videoId = response.data.items?.[0]?.id?.videoId || null;
    console.log(`[QUOTA] Search completed - 100 units consumed. Result: ${videoId ? 'Found' : 'Not found'}`);
    return videoId;
  } catch (error: any) {
    console.log(`[QUOTA] Search failed for "${query}" - Still consumed 100 units! Error:`, error?.message);
    
    // Handle quota exceeded error gracefully
    if (error?.status === 403 && error?.message?.includes('quota')) {
      console.warn(`[QUOTA] YouTube quota exceeded for query: "${query}"`);
      return null; // Return null instead of throwing to continue processing other tracks
    }
    
    console.error('YouTube search error:', error);
    throw error;
  }
}

// Add delay function for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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