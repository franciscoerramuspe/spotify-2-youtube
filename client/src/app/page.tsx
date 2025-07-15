"use client"

import { Check } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Home() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionUpdateAttempted = useRef(false)

  // More direct state, derived from session for clarity in rendering
  const spotifyDirectlyConnected = status === "authenticated" && !!session?.spotifyAccessToken;
  const googleDirectlyConnected = status === "authenticated" && !!session?.googleAccessToken;

  // More robust session update logic
  useEffect(() => {
    const hasOauthParams = searchParams.has("code") || searchParams.has("state") || searchParams.has("oauth_token");

    // Try to update if:
    // 1. Authenticated and it's the first time this effect runs with "authenticated" (initial load after login)
    // 2. Or, if OAuth redirect parameters are present in the URL (just came back from provider)
    if (status === "authenticated" && (!sessionUpdateAttempted.current || hasOauthParams)) {
      updateSession(); // Force a session refetch
      sessionUpdateAttempted.current = true; // Mark that we've attempted an update for this auth state
    } else if (status === "unauthenticated") {
      sessionUpdateAttempted.current = false; // Reset if user logs out
    }
  }, [status, searchParams, updateSession]); // Rerun if status or URL params change

  // Effect to update localStorage based on the session
  useEffect(() => {
    if (status === "authenticated") {
      localStorage.setItem("spotifyConnected", !!session?.spotifyAccessToken ? "true" : "false");
      localStorage.setItem("youtubeConnected", !!session?.googleAccessToken ? "true" : "false");
    } else if (status === "unauthenticated") {
      localStorage.setItem("spotifyConnected", "false");
      localStorage.setItem("youtubeConnected", "false");
    }
  }, [session, status]);

  const isLoading = status === "loading";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative">
      {/* Background elements - Adjusted for better mobile appearance */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[5%] left-[5%] w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-green-500 blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-[40%] right-[5%] w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-red-500 blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-[10%] left-[15%] w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-blue-500 blur-[100px] sm:blur-[150px]" />
        </div>
      </div>

      {/* Content - Improved padding for mobile */}
      <div className="container mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center min-h-screen relative z-10">
        {/* Logo and Title - Responsive adjustments */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            {/* Spotify Logo - Responsive sizing */}
            <div className="flex items-center justify-center w-14 sm:w-20 h-14 sm:h-20 mr-3">
              <img src="/spotify0.png" alt="Spotify Logo" className="w-12 sm:w-16 h-12 sm:h-16 object-contain" />
            </div>

            {/* Custom longer arrow */}
            <div className="flex items-center">
              <svg
                width="60"
                height="24"
                viewBox="0 0 60 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400"
              >
                <path
                  d="M5 12H55M55 12L48 5M55 12L48 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* YouTube Logo - Made bigger */}
            <div className="flex items-center justify-center w-20 sm:w-38 h-20 sm:h-38 -ml-4">
              <img src="/ytt.png" alt="YouTube Logo" className="w-24 sm:w-40 h-24 sm:h-40 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-red-500 tracking-tight px-2">
            Spotify to YouTube
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Seamlessly convert your favorite Spotify playlists to YouTube collections with just a few clicks.
          </p>
        </div>

        {/* Connection Cards - Mobile-first approach */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-3xl px-2">
          {/* Spotify Card */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-900/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-green-500/20 group hover:border-green-500/50 transition-all duration-300 min-h-[180px] sm:min-h-[210px] flex flex-col">
            {/* Spotify Card Logo and Title */}
            <div className="flex items-center mb-3 sm:mb-4 h-14 sm:h-20">
              <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 mr-4">
                <img src="/spotify0.png" alt="Spotify" className="w-8 sm:w-10 h-8 sm:h-10 object-contain" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-green-400">Spotify</h2>
            </div>
            <p className="text-gray-300 mb-4 sm:mb-6 flex-grow text-sm sm:text-base">
              Connect your Spotify account to access your playlists and favorite tracks.
            </p>
            {isLoading ? (
              <div className="h-[40px] sm:h-[48px] bg-gray-700/50 rounded-lg sm:rounded-xl animate-pulse"></div>
            ) : spotifyDirectlyConnected ? (
              <div className="inline-flex items-center justify-center w-full bg-green-600/80 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium cursor-default text-sm sm:text-base">
                <Check className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Connected
              </div>
            ) : (
              <a
                href="/api/auth/signin?provider=spotify"
                className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-500 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium transition-colors duration-300 group-hover:shadow-lg group-hover:shadow-green-500/20 text-sm sm:text-base"
              >
                Connect Spotify
              </a>
            )}
          </div>

          {/* YouTube Card */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-900/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-red-500/20 group hover:border-red-500/50 transition-all duration-300 min-h-[180px] sm:min-h-[210px] flex flex-col">
            {/* YouTube Card Logo and Title */}
            <div className="flex items-center mb-3 sm:mb-4 h-14 sm:h-20">
              <div className="flex items-center justify-center w-14 sm:w-20 h-14 sm:h-20 mr-2">
                <img src="/ytt.png" alt="YouTube" className="w-30 sm:w-38 h-30 sm:h-38 object-contain" />
              </div>
              <h2 className="-ml-2 text-xl sm:text-2xl font-semibold text-red-400">YouTube</h2>
            </div>
            <p className="text-gray-300 mb-4 sm:mb-6 flex-grow text-sm sm:text-base">
              Connect your YouTube account to create and manage your video playlists.
            </p>
             {isLoading ? (
              <div className="h-[40px] sm:h-[48px] bg-gray-700/50 rounded-lg sm:rounded-xl animate-pulse"></div>
            ) : googleDirectlyConnected ? (
              <div className="inline-flex items-center justify-center w-full bg-red-600/80 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium cursor-default text-sm sm:text-base">
                <Check className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Connected
               </div>
            ) : (
              <a
                href="/api/auth/signin?provider=google"
                className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-500 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium transition-colors duration-300 group-hover:shadow-lg group-hover:shadow-red-500/20 text-sm sm:text-base"
              >
                Connect YouTube
              </a>
            )}
          </div>
        </div>

        {/* Next Button - Responsive sizing */}
        <div className="mt-8 sm:mt-12 w-full max-w-3xl px-2">
           <button
            disabled={!spotifyDirectlyConnected || !googleDirectlyConnected || isLoading}
            onClick={() => { 
              router.push("/select-playlists")
             }}
            className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-base sm:text-lg flex items-center justify-center
              ${
                (!spotifyDirectlyConnected || !googleDirectlyConnected || isLoading)
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30"
              }`}
          >
            Next: Select Playlists
          </button>
        </div>

        {/* Features - Responsive layout */}
        <div className="mt-10 sm:mt-16 text-center px-2">
          <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">Simple. Fast. Reliable.</h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm">
              Playlist Conversion
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm">
              Smart Matching
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm">
              Sync Favorites
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm">
              Preserve Order
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// Custom longer arrow component
function LongerArrow({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h30M35 12l-7-7M35 12l-7 7" />
    </svg>
  )
}
