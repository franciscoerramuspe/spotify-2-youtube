// src/types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id?: string;
      /** The user's spotify connection status. */
      spotifyConnected?: boolean;
      /** The user's youtube connection status. */
      youtubeConnected?: boolean;
    } & DefaultSession["user"];
    accessToken?: string; // If you store access tokens directly on session
    error?: string;
  }

  interface User extends DefaultUser {
    spotifyConnected?: boolean;
    youtubeConnected?: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: Session["user"]; // Include the augmented user type
  }
}
