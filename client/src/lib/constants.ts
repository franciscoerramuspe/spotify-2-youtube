// client/src/lib/constants.ts

// Provider names
export const PROVIDERS = {
  SPOTIFY: 'spotify',
  GOOGLE: 'google',
} as const;

// OAuth Scopes
export const OAUTH_SCOPES = {
  SPOTIFY: 'playlist-read-private playlist-read-collaborative',
  GOOGLE: 'openid email profile https://www.googleapis.com/auth/youtube',
} as const;

// API URLs
export const API_URLS = {
  SPOTIFY_TOKEN: 'https://accounts.spotify.com/api/token',
  SPOTIFY_PLAYLISTS: 'https://api.spotify.com/v1/playlists',
  GOOGLE_TOKEN: 'https://oauth2.googleapis.com/token',
} as const;

// Session strategy
export const SESSION_STRATEGY = 'jwt' as const;

// Token refresh buffer (in seconds)
export const TOKEN_REFRESH_BUFFER_SECONDS = 60;

// Session duration (in seconds)
export const SESSION_DURATION = {
  THIRTY_DAYS: 30 * 24 * 60 * 60,
} as const;

// Grant types for OAuth
export const GRANT_TYPES = {
  REFRESH_TOKEN: 'refresh_token',
} as const;

// HTTP methods
export const HTTP_METHODS = {
  POST: 'POST',
} as const;

// HTTP headers
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
} as const;

// Content types
export const CONTENT_TYPES = {
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
} as const;

// Auth error messages
export const AUTH_ERRORS = {
  SPOTIFY_NO_REFRESH_TOKEN: 'SpotifyNoRefreshTokenError',
  SPOTIFY_REFRESH_ACCESS_TOKEN: 'SpotifyRefreshAccessTokenError',
  GOOGLE_NO_REFRESH_TOKEN: 'GoogleNoRefreshTokenError',
  GOOGLE_REFRESH_ACCESS_TOKEN: 'GoogleRefreshAccessTokenError',
} as const;

// Log prefixes for debugging
export const LOG_PREFIXES = {
  JWT_ACCOUNT: '[JWT Account]',
  SPOTIFY_REFRESH: '[Spotify Refresh]',
  GOOGLE_REFRESH: '[Google Refresh]',
} as const;

// Token field names for JWT storage
export const TOKEN_FIELD_NAMES = {
  SPOTIFY: {
    ACCESS_TOKEN: 'spotifyAccessToken',
    REFRESH_TOKEN: 'spotifyRefreshToken',
    EXPIRES_AT: 'spotifyExpiresAt',
  },
  GOOGLE: {
    ACCESS_TOKEN: 'googleAccessToken',
    REFRESH_TOKEN: 'googleRefreshToken',
    EXPIRES_AT: 'googleExpiresAt',
  },
} as const; 