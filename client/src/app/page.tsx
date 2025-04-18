// src/app/page.tsx

"use client";

import { ArrowRight, Check } from "lucide-react"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const { data: session, status } = useSession();
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const router = useRouter();

  // Add debug logging
  useEffect(() => {
    console.log('Session Data:', {
      status,
      spotifyToken: session?.spotifyAccessToken ? 'Present' : 'Missing',
      googleToken: session?.googleAccessToken ? 'Present' : 'Missing',
      session
    });
  }, [session, status]);

  useEffect(() => {
    // Load initial states from localStorage
    const storedSpotify = localStorage.getItem('spotifyConnected') === 'true';
    const storedYoutube = localStorage.getItem('youtubeConnected') === 'true';
    
    setIsSpotifyConnected(storedSpotify);
    setIsYouTubeConnected(storedYoutube);
  }, []); // Run once on mount

  useEffect(() => {
    if (session?.spotifyAccessToken) {
      setIsSpotifyConnected(true);
      localStorage.setItem('spotifyConnected', 'true');
    }
    
    if (session?.googleAccessToken) {
      setIsYouTubeConnected(true);
      localStorage.setItem('youtubeConnected', 'true');
    }
  }, [session?.spotifyAccessToken, session?.googleAccessToken]);

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-green-500 blur-[120px]" />
          <div className="absolute top-[40%] right-[10%] w-72 h-72 rounded-full bg-red-500 blur-[150px]" />
          <div className="absolute bottom-[15%] left-[25%] w-80 h-80 rounded-full bg-blue-500 blur-[150px]" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center h-screen relative z-10">
        {/* Logo and Title */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            {/* Spotify Logo */}
            <div className="flex items-center justify-center w-20 h-20 mr-4">
              <img src="/spotify0.png" alt="Spotify Logo" className="w-16 h-16 object-contain" />
            </div>

            <ArrowRight className="mx-3 text-gray-400" size={28} />

            {/* YouTube Logo - Made bigger */}
            <div className="flex items-center justify-center w-20 h-20 ml-4">
              <img src="/yt-white.png" alt="YouTube Logo" className="w-32 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-red-500 tracking-tight">
            Spotify to YouTube
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Seamlessly convert your favorite Spotify playlists to YouTube collections with just a few clicks.
          </p>
        </div>

        {/* Connection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Spotify Card */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-900/10 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20 group hover:border-green-500/50 transition-all duration-300 min-h-[210px] flex flex-col">
            <div className="flex items-center mb-4">
              {/* Spotify Card Logo */}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <img src="/spotify0.png" alt="Spotify" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-2xl font-semibold text-green-400">Spotify</h2>
            </div>
            <p className="text-gray-300 mb-6 flex-grow">
              Connect your Spotify account to access your playlists and favorite tracks.
            </p>
            {isLoading ? (
              <div className="h-[48px] bg-gray-700/50 rounded-xl animate-pulse"></div>
            ) : isSpotifyConnected ? (
              <div className="inline-flex items-center justify-center w-full bg-green-600/80 text-white py-3 px-6 rounded-xl font-medium cursor-default">
                <Check className="mr-2 h-5 w-5" /> Connected
              </div>
            ) : (
              <a
                href="/api/auth/signin?provider=spotify"
                className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-500 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-300 group-hover:shadow-lg group-hover:shadow-green-500/20"
              >
                Connect Spotify
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            )}
          </div>

          {/* YouTube Card */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-900/10 backdrop-blur-sm p-6 rounded-2xl border border-red-500/20 group hover:border-red-500/50 transition-all duration-300 min-h-[210px] flex flex-col">
            <div className="flex items-center mb-4">
              {/* YouTube Card Logo - Made bigger */}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <img src="/yt-white.png" alt="YouTube" className="w-24 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-semibold text-red-400">YouTube</h2>
            </div>
            <p className="text-gray-300 mb-6 flex-grow">
              Connect your YouTube account to create and manage your video playlists.
            </p>
             {isLoading ? (
              <div className="h-[48px] bg-gray-700/50 rounded-xl animate-pulse"></div>
            ) : isYouTubeConnected ? (
               <div className="inline-flex items-center justify-center w-full bg-red-600/80 text-white py-3 px-6 rounded-xl font-medium cursor-default">
                 <Check className="mr-2 h-5 w-5" /> Connected
               </div>
            ) : (
              <a
                href="/api/auth/signin?provider=google"
                className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-300 group-hover:shadow-lg group-hover:shadow-red-500/20"
              >
                Connect YouTube
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-12 w-full max-w-3xl">
           <button
            disabled={!isSpotifyConnected || !isYouTubeConnected || isLoading}
            onClick={() => { 
              router.push('/select-playlists');
             }}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 text-lg flex items-center justify-center
              ${(!isSpotifyConnected || !isYouTubeConnected || isLoading)
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
              }`}
          >
            Next: Select Playlists
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-medium text-gray-300 mb-2">Simple. Fast. Reliable.</h3>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Playlist Conversion</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Smart Matching</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Sync Favorites</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Preserve Order</div>
          </div>
        </div>
      </div>
    </div>
  )
}
