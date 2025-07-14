// src/types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    userId?: string;
    spotifyAccessToken?: string;
    googleAccessToken?: string;
    error?: string;
    user: {
      id: string;
      /** True if a Spotify token is present */
      spotifyToken: boolean;
      /** True if a Google/YouTube token is present */
      googleToken: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    spotifyToken?: boolean;
    googleToken?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    userId?: string;
    spotifyAccessToken?: string;
    spotifyTokenExpires?: number;
    googleAccessToken?: string;
    googleTokenExpires?: number;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    error?: string;
  }
}
