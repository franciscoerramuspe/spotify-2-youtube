import NextAuth, { type NextAuthOptions, DefaultSession } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";

// Extend JWT and Session types (Ensure these match your needs)
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
    error?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: "playlist-read-private playlist-read-collaborative" },
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
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) { // Check if account exists (sign in or linking)
        if (account.provider === "spotify") {
          token.spotifyAccessToken = account.access_token;
          token.spotifyTokenExpires = account.expires_at ? Date.now() + account.expires_at * 1000 : undefined;
          console.log("Spotify token stored/updated in JWT");
        }
        if (account.provider === "google") {
          token.googleAccessToken = account.access_token;
          token.googleTokenExpires = account.expires_at ? Date.now() + account.expires_at * 1000 : undefined;
          console.log("Google token stored/updated in JWT");
        }
      }
      // TODO: Handle token refresh
      return token;
    },
    async session({ session, token }) {
      session.spotifyAccessToken = token.spotifyAccessToken;
      session.googleAccessToken = token.googleAccessToken;
      // session.error = token.error // If you add error handling
      console.log("Session callback executed");
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure NEXTAUTH_SECRET is set
  // debug: process.env.NODE_ENV === 'development',
};

// Export handlers for GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 