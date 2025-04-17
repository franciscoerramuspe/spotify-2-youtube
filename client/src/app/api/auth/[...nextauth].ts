import NextAuth, { type NextAuthOptions, DefaultSession } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";

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
        url: "https://accounts.spotify.com/authorize",
        params: { scope: "playlist-read-private playlist-read-collaborative" }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        if (account.provider === "spotify") {
          token.spotifyAccessToken = account.access_token;
          token.spotifyTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          console.log("Spotify token stored in JWT");
        }
        if (account.provider === "google") {
          token.googleAccessToken = account.access_token;
          token.googleTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          console.log("Google token stored in JWT");
        }
        return token;
      }
      return token;
    },
    async session({ session, token }) {
      session.spotifyAccessToken = token.spotifyAccessToken;
      session.googleAccessToken = token.googleAccessToken;
      console.log("Session callback executed, adding tokens to session object");
      return session;
    }
  }
};

export default NextAuth(authOptions);