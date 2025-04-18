import NextAuth, { type NextAuthOptions, DefaultSession, Account as NextAuthAccount } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

// Extend JWT and Session types
declare module "next-auth/jwt" {
  interface JWT {
    spotifyAccessToken?: string;
    spotifyTokenExpires?: number;
    googleAccessToken?: string;
    googleTokenExpires?: number;
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    spotifyAccessToken?: string;
    googleAccessToken?: string;
    user: {
      /** True if a Spotify token is present */
      spotifyToken: boolean;
      /** True if a Google/YouTube token is present */
      googleToken: boolean;
    } & DefaultSession["user"];
  }
}

// Initialize Prisma Client
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Persist users & link multiple OAuth accounts via Prisma
  adapter: PrismaAdapter(prisma),

  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "playlist-read-private playlist-read-collaborative",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, account, user }) {
      const now = Date.now();
      let tokenToReturn: JWT = { ...token };

      // On initial sign in or when linking a new account
      if (account && user) {
        console.log(`[NextAuth JWT Callback] Account received for provider: ${account.provider} for user ID: ${user.id}`);

        // Update token with the new account's details
        if (account.provider === "spotify") {
          tokenToReturn.spotifyAccessToken = account.access_token;
          tokenToReturn.spotifyTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          console.log(`[NextAuth JWT Callback] Spotify token added/updated. Expires at: ${tokenToReturn.spotifyTokenExpires ? new Date(tokenToReturn.spotifyTokenExpires).toISOString() : 'N/A'}`);
        } else if (account.provider === "google") {
          tokenToReturn.googleAccessToken = account.access_token;
          tokenToReturn.googleTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          console.log(`[NextAuth JWT Callback] Google token added/updated. Expires at: ${tokenToReturn.googleTokenExpires ? new Date(tokenToReturn.googleTokenExpires).toISOString() : 'N/A'}`);
        }

        // --- Crucial Step: Load ALL linked accounts to ensure other tokens are present ---
        // The Prisma Adapter links accounts, so we query them via the user ID.
        console.log(`[NextAuth JWT Callback] Fetching all linked accounts for user ID: ${user.id}`);
        const linkedAccounts = await prisma.account.findMany({
          where: { userId: user.id },
        });

        console.log(`[NextAuth JWT Callback] Found ${linkedAccounts.length} linked accounts.`);

        for (const linkedAccount of linkedAccounts) {
          // If we don't already have a valid token for this provider from the current sign-in, add it from the DB
          if (linkedAccount.provider === "spotify" && !tokenToReturn.spotifyAccessToken && linkedAccount.access_token) {
            if (!linkedAccount.expires_at || linkedAccount.expires_at * 1000 > now) {
              tokenToReturn.spotifyAccessToken = linkedAccount.access_token;
              tokenToReturn.spotifyTokenExpires = linkedAccount.expires_at ? linkedAccount.expires_at * 1000 : undefined;
              console.log('[NextAuth JWT Callback] Added existing valid Spotify token from DB.');
            } else {
               console.log('[NextAuth JWT Callback] Found expired Spotify token in DB, skipping.');
            }
          } else if (linkedAccount.provider === "google" && !tokenToReturn.googleAccessToken && linkedAccount.access_token) {
             if (!linkedAccount.expires_at || linkedAccount.expires_at * 1000 > now) {
               tokenToReturn.googleAccessToken = linkedAccount.access_token;
               tokenToReturn.googleTokenExpires = linkedAccount.expires_at ? linkedAccount.expires_at * 1000 : undefined;
               console.log('[NextAuth JWT Callback] Added existing valid Google token from DB.');
            } else {
               console.log('[NextAuth JWT Callback] Found expired Google token in DB, skipping.');
            }
          }
        }
         // Add user id to token
         tokenToReturn.sub = user.id;

      } else if (token.sub) {
         // On subsequent requests (not sign-in), refresh tokens if they are expired.
         // Note: Refresh logic is not implemented here yet, but this structure allows for it.
         // You might need to check expiry and use refresh_token if available.
         console.log('[NextAuth JWT Callback] Non-signin request, checking token validity.');
         if (tokenToReturn.spotifyTokenExpires && tokenToReturn.spotifyTokenExpires < now) {
             console.log('[NextAuth JWT Callback] Spotify token expired.');
             // TODO: Add refresh logic if needed
             tokenToReturn.spotifyAccessToken = undefined;
             tokenToReturn.spotifyTokenExpires = undefined;
         }
         if (tokenToReturn.googleTokenExpires && tokenToReturn.googleTokenExpires < now) {
             console.log('[NextAuth JWT Callback] Google token expired.');
             // TODO: Add refresh logic if needed
             tokenToReturn.googleAccessToken = undefined;
             tokenToReturn.googleTokenExpires = undefined;
         }
      }


      // Log the final state being returned
      console.log('[NextAuth JWT Callback] Final token state being returned:', {
        userId: tokenToReturn.sub,
        hasSpotifyToken: !!tokenToReturn.spotifyAccessToken,
        hasGoogleToken: !!tokenToReturn.googleAccessToken,
        spotifyExpires: tokenToReturn.spotifyTokenExpires ? new Date(tokenToReturn.spotifyTokenExpires).toISOString() : 'N/A',
        googleExpires: tokenToReturn.googleTokenExpires ? new Date(tokenToReturn.googleTokenExpires).toISOString() : 'N/A'
      });

      return tokenToReturn;
    },

    async session({ session, token }) {
      // Expose the tokens and user ID in the session object
      // Ensure the session object matches the structure defined in the declaration
      session.spotifyAccessToken = token.spotifyAccessToken;
      session.googleAccessToken = token.googleAccessToken;
      // Ensure user object exists before assigning properties
      if (session.user) {
          session.user.spotifyToken = !!token.spotifyAccessToken;
          session.user.googleToken = !!token.googleAccessToken;
          // The user ID should already be part of session.user if the adapter works correctly
      } else {
         // Handle case where session.user might be undefined, though unlikely with adapter
         console.error("[NextAuth Session Callback] session.user is undefined. Reconstructing minimal user object.");
         // Reconstruct based on the declared Session['user'] type extension
         session.user = {
             // id: token.sub || '', // Removed: ID should come from adapter/default session
             name: undefined,
             email: undefined,
             image: undefined,
             spotifyToken: !!token.spotifyAccessToken,
             googleToken: !!token.googleAccessToken,
         };
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
