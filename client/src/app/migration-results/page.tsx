"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Youtube, ArrowRight, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function MigrationResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get URL parameters
  const youtubePlaylistId = searchParams.get("youtubePlaylistId")
  const unmatched = Number.parseInt(searchParams.get("unmatched") || "0")
  const total = Number.parseInt(searchParams.get("total") || "0")

  // Calculate successful tracks
  const successful = total - unmatched
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

  // Animation states
  const [showStats, setShowStats] = useState(false)
  const [showActions, setShowActions] = useState(false)

  // Trigger animations after component mounts
  useEffect(() => {
    const statsTimer = setTimeout(() => setShowStats(true), 600)
    const actionsTimer = setTimeout(() => setShowActions(true), 1200)

    return () => {
      clearTimeout(statsTimer)
      clearTimeout(actionsTimer)
    }
  }, [])

  // Redirect if no playlist ID is provided
  useEffect(() => {
    if (!youtubePlaylistId) {
      const timer = setTimeout(() => router.push("/"), 3000)
      return () => clearTimeout(timer)
    }
  }, [youtubePlaylistId, router])

  // Handle missing playlist ID
  if (!youtubePlaylistId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Missing Playlist Information</h1>
          <p className="text-gray-300 mb-6">
            We couldn't find information about your migrated playlist. Redirecting you to the home page...
          </p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full animate-[progress_3s_ease-in-out]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[5%] left-[5%] w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-green-500 blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-[40%] right-[5%] w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-red-500 blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-[10%] left-[15%] w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-blue-500 blur-[100px] sm:blur-[150px]" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen relative z-10">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-green-500">
            Migration Complete!
          </h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Your Spotify playlists have been successfully migrated to YouTube.
          </p>
        </div>

        {/* Stats Card */}
        <div
          className={`bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] max-w-2xl w-full mb-8 transform transition-all duration-700 ${
            showStats ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-red-500/10 rounded-full mr-3">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold">YouTube Playlist Created</h2>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Success Rate</span>
                <span>{successRate}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${successRate}%` }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{total}</div>
                <div className="text-sm text-gray-400">Total Tracks</div>
              </div>

              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{successful}</div>
                <div className="text-sm text-gray-400">Successfully Added</div>
              </div>

              <div className={`${unmatched > 0 ? "bg-red-500/10" : "bg-white/5"} rounded-xl p-4 text-center`}>
                <div className={`text-3xl font-bold ${unmatched > 0 ? "text-red-500" : "text-white"} mb-1`}>
                  {unmatched}
                </div>
                <div className="text-sm text-gray-400">Not Found</div>
              </div>
            </div>

            {/* YouTube Link */}
            <a
              href={`https://www.youtube.com/playlist?list=${youtubePlaylistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-0.5"
            >
              <Youtube className="mr-2 h-5 w-5" />
              View Your YouTube Playlist
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Unmatched Tracks Info */}
          {unmatched > 0 && (
            <div className="border-t border-white/10 p-6 sm:p-8">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-medium">Some Tracks Couldn't Be Found</h3>
              </div>
              <p className="text-gray-400 mb-4">
                {unmatched} {unmatched === 1 ? "track" : "tracks"} from your Spotify{" "}
                {unmatched === 1 ? "playlist" : "playlists"} couldn't be found on YouTube. This could be due to:
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li>Different track names or artists between platforms</li>
                <li>Region-restricted content</li>
                <li>Content not available on YouTube</li>
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 w-full max-w-md transform transition-all duration-700 ${
            showActions ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Link
            href="/select-playlists"
            className="flex-1 flex items-center justify-center bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Migrate More Playlists
          </Link>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-white/5 transform hover:-translate-y-0.5"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
