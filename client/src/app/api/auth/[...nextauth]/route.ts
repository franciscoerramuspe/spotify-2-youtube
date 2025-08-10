import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import {
  PROVIDERS,
  OAUTH_SCOPES,
  API_URLS,
  SESSION_STRATEGY,
  TOKEN_REFRESH_BUFFER_SECONDS,
  SESSION_DURATION,
  GRANT_TYPES,
  HTTP_METHODS,
  HTTP_HEADERS,
  CONTENT_TYPES,
  AUTH_ERRORS,
  LOG_PREFIXES,
  TOKEN_FIELD_NAMES,
} from "@/lib/constants";

// Initialize Prisma Client
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: OAUTH_SCOPES.SPOTIFY,
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: OAUTH_SCOPES.GOOGLE,
        },
      },
    }),
  ],

  session: {
    strategy: SESSION_STRATEGY,
    maxAge: SESSION_DURATION.THIRTY_DAYS,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Handle new sign-in or account linking
      if (account && user) {
        // When linking a new account, we need to load existing tokens from the database
        // because PrismaAdapter doesn't preserve them in the JWT token
        let existingAccounts: Array<{
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: number | null;
        }> = [];
        try {
          existingAccounts = await prisma.account.findMany({
            where: { userId: user.id },
            select: { provider: true, access_token: true, refresh_token: true, expires_at: true }
          });
        } catch (error) {
          console.error(`${LOG_PREFIXES.JWT_ACCOUNT} Error loading existing accounts:`, error);
        }

        // Start with the base token and add tokens from all linked accounts
        const newToken = { 
          ...token,
          userId: user.id,
          error: undefined, // Clear previous errors
        }; 

        // Add the new account's tokens
        if (account.provider === PROVIDERS.SPOTIFY) {
          newToken.spotifyAccessToken = account.access_token;
          newToken.spotifyRefreshToken = account.refresh_token;
          newToken.spotifyExpiresAt = account.expires_at;
        } else if (account.provider === PROVIDERS.GOOGLE) {
          newToken.googleAccessToken = account.access_token;
          newToken.googleRefreshToken = account.refresh_token;
          newToken.googleExpiresAt = account.expires_at;
        }

        // Add tokens from existing linked accounts (to preserve other providers)
        for (const existingAccount of existingAccounts) {
          if (existingAccount.provider === PROVIDERS.SPOTIFY && existingAccount.provider !== account.provider) {
            newToken.spotifyAccessToken = existingAccount.access_token || undefined;
            newToken.spotifyRefreshToken = existingAccount.refresh_token || undefined;
            newToken.spotifyExpiresAt = existingAccount.expires_at || undefined;
          } else if (existingAccount.provider === PROVIDERS.GOOGLE && existingAccount.provider !== account.provider) {
            newToken.googleAccessToken = existingAccount.access_token || undefined;
            newToken.googleRefreshToken = existingAccount.refresh_token || undefined;
            newToken.googleExpiresAt = existingAccount.expires_at || undefined;
          }
        }

        return newToken;
      }

      // If it's not a new account action, it's a subsequent request. Check for expiry.
      const nowInSeconds = Date.now() / 1000;

      // Spotify Refresh Check
      if (token.spotifyAccessToken && token.spotifyExpiresAt && nowInSeconds >= token.spotifyExpiresAt - TOKEN_REFRESH_BUFFER_SECONDS) {
        if (token.spotifyRefreshToken) {
          const refreshedToken = await refreshSpotifyAccessToken(token);
          return refreshedToken;
        } else {
          token.spotifyAccessToken = undefined;
          token.spotifyExpiresAt = undefined;
          token.error = AUTH_ERRORS.SPOTIFY_NO_REFRESH_TOKEN;
        }
      }

      // Google Refresh Check
      if (token.googleAccessToken && token.googleExpiresAt && nowInSeconds >= token.googleExpiresAt - TOKEN_REFRESH_BUFFER_SECONDS) {
        if (token.googleRefreshToken) {
          const refreshedToken = await refreshGoogleAccessToken(token);
          return refreshedToken;
        } else {
          token.googleAccessToken = undefined;
          token.googleExpiresAt = undefined;
          token.error = AUTH_ERRORS.GOOGLE_NO_REFRESH_TOKEN;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      session.userId = String(token.userId || '');
      session.error = token.error;

      session.spotifyAccessToken = token.spotifyAccessToken;
      session.googleAccessToken = token.googleAccessToken;

      if (!session.user) session.user = { id: '', name: null, email: null, image: null, spotifyToken: false, googleToken: false };
      session.user.id = String(token.userId || ''); 
      session.user.spotifyToken = !!token.spotifyAccessToken;
      session.user.googleToken = !!token.googleAccessToken;

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Helper function for Spotify token refresh
async function refreshSpotifyAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(API_URLS.SPOTIFY_TOKEN, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.FORM_URLENCODED,
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: GRANT_TYPES.REFRESH_TOKEN,
        refresh_token: token.spotifyRefreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to refresh Spotify token: ${refreshedTokens.error_description || 'Unknown error'}`);
    }

    return {
      ...token,
      [TOKEN_FIELD_NAMES.SPOTIFY.ACCESS_TOKEN]: refreshedTokens.access_token,
      [TOKEN_FIELD_NAMES.SPOTIFY.EXPIRES_AT]: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      [TOKEN_FIELD_NAMES.SPOTIFY.REFRESH_TOKEN]: refreshedTokens.refresh_token ?? token.spotifyRefreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error(`${LOG_PREFIXES.SPOTIFY_REFRESH} Error:`, error);
    return {
      ...token,
      [TOKEN_FIELD_NAMES.SPOTIFY.ACCESS_TOKEN]: undefined,
      [TOKEN_FIELD_NAMES.SPOTIFY.EXPIRES_AT]: undefined,
      error: AUTH_ERRORS.SPOTIFY_REFRESH_ACCESS_TOKEN,
    };
  }
}

// Helper function for Google token refresh
async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(API_URLS.GOOGLE_TOKEN, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.FORM_URLENCODED,
      },
      body: new URLSearchParams({
        grant_type: GRANT_TYPES.REFRESH_TOKEN,
        refresh_token: token.googleRefreshToken!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to refresh Google token: ${refreshedTokens.error_description || 'Unknown error'}`);
    }

    return {
      ...token,
      [TOKEN_FIELD_NAMES.GOOGLE.ACCESS_TOKEN]: refreshedTokens.access_token,
      [TOKEN_FIELD_NAMES.GOOGLE.EXPIRES_AT]: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      [TOKEN_FIELD_NAMES.GOOGLE.REFRESH_TOKEN]: refreshedTokens.refresh_token ?? token.googleRefreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error(`${LOG_PREFIXES.GOOGLE_REFRESH} Error:`, error);
    return {
      ...token,
      [TOKEN_FIELD_NAMES.GOOGLE.ACCESS_TOKEN]: undefined,
      [TOKEN_FIELD_NAMES.GOOGLE.EXPIRES_AT]: undefined,
      error: AUTH_ERRORS.GOOGLE_REFRESH_ACCESS_TOKEN,
    };
  }
}
