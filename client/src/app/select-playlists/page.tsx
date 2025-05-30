// src/app/select-playlists/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation" // Use next/navigation for App Router
import { Check, Loader2, AlertCircle, ArrowRight, Music2, Search, Home, RefreshCw } from 'lucide-react' // Icons

interface Playlist {
  id: string
  name: string
  trackCount: number
}

export default function SelectPlaylistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Derived state for Select All checkbox - Move useMemo before any conditional returns
  const filteredPlaylists = useMemo(() => {
    return playlists.filter((playlist) => playlist.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [playlists, searchQuery])

  const allSelected = useMemo(() => {
    return filteredPlaylists.length > 0 && selectedPlaylistIds.size === filteredPlaylists.length
  }, [filteredPlaylists, selectedPlaylistIds])

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (status === "authenticated" && session?.spotifyAccessToken) {
        setIsLoading(true)
        try {
          const response = await fetch("/api/spotify/playlists", {
            headers: {
              Authorization: `Bearer ${session.spotifyAccessToken}`,
            },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch playlists")
          }

          const data = await response.json()
          // Ensure we're getting an array of playlists
          const playlistsArray = Array.isArray(data.playlists) ? data.playlists : []
          
          // Remove duplicates based on playlist name
          const uniquePlaylists = playlistsArray.reduce((acc: Playlist[], current: Playlist) => {
            const isDuplicate = acc.find((item) => item.name === current.name)
            if (!isDuplicate) {
              acc.push(current)
            } else {
              // If there's a duplicate, keep the one with more tracks
              const existingIndex = acc.findIndex((item) => item.name === current.name)
              if (current.trackCount > acc[existingIndex].trackCount) {
                acc[existingIndex] = current
              }
            }
            return acc
          }, [])

          // Sort playlists by track count (optional)
          const sortedPlaylists = uniquePlaylists.sort((a, b) => b.trackCount - a.trackCount)
          
          setPlaylists(sortedPlaylists)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred")
          setPlaylists([]) // Reset playlists on error
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchPlaylists()
  }, [session?.spotifyAccessToken, status])

  // Handle selecting/deselecting a single playlist
  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistIds((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(playlistId)) {
        newSelected.delete(playlistId)
      } else {
        newSelected.add(playlistId)
      }
      return newSelected
    })
  }

  // Handle Select All / Deselect All
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPlaylistIds(new Set<string>()) // Deselect all
    } else {
      // Ensure playlists is an array before mapping
      const allIds = Array.isArray(filteredPlaylists)
        ? new Set<string>(filteredPlaylists.map((p) => p.id))
        : new Set<string>()
      setSelectedPlaylistIds(allIds)
    }
  }

  // Handle Continue button click
  const handleContinue = () => {
    const selectedIds = Array.from(selectedPlaylistIds)
    if (selectedIds.length === 0) {
      return
    }
    const queryString = `playlists=${selectedIds.join(",")}`
    router.push(`/migrate-config?${queryString}`)
  }

  // Loading States
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white flex items-center justify-center p-6">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-[#1DB954]/20 rounded-full blur-xl animate-pulse"></div>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center space-y-6 relative shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10">
            <Loader2 className="h-16 w-16 animate-spin text-[#1DB954]" />
            <span className="text-2xl font-medium text-white">
              {status === "loading" ? "Checking authentication..." : "Loading your playlists..."}
            </span>
            <p className="text-gray-400 text-center max-w-xs">
              {status === "loading"
                ? "Verifying your credentials"
                : "Fetching your music collection from Spotify"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error States
  if (status === "authenticated" && !session?.spotifyAccessToken && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white flex items-center justify-center p-6">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-yellow-500/20 rounded-3xl blur-xl"></div>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full relative shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-yellow-500/10 rounded-full">
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              </div>
              <h1 className="text-3xl font-bold">Spotify Not Connected</h1>
              <p className="text-gray-400 text-lg">Please connect your Spotify account on the homepage first to select playlists.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 w-full bg-[#1DB954] hover:bg-[#1ED760] text-black font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(29,185,84,0.3)] hover:shadow-[0_6px_16px_rgba(29,185,84,0.5)] transform hover:-translate-y-1 flex items-center justify-center"
              >
                <Home className="mr-2 h-5 w-5" /> Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white flex items-center justify-center p-6">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-red-500/20 rounded-3xl blur-xl"></div>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full relative shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold">Error Loading Playlists</h1>
              <p className="text-red-400 text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.5)] transform hover:-translate-y-1 flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-5 w-5" /> Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center"
              >
                <Home className="mr-2 h-5 w-5" /> Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white p-6 md:p-10">
      {/* Background music waves */}
      <div className="fixed inset-0 z-0 opacity-10">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-[url('/placeholder.svg?key=dest3')] bg-repeat-x bg-bottom"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6 inline-block">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-[#1DB954] rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.42.12-.78-.18-.9-.54-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1DB954] via-[#1ED760] to-[#1DB954] text-transparent bg-clip-text">
            Select Your Playlists
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Choose the playlists you want to migrate to YouTube. We'll handle the rest.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Search and Select All */}
          <div className="p-6 md:p-8 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 text-white placeholder-gray-400 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 border border-white/5 hover:border-white/10 transition-colors"
                />
              </div>
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-6 rounded-md border-2 border-white/20 bg-white/5 peer-checked:bg-[#1DB954] peer-checked:border-[#1DB954] transition-all duration-200 flex items-center justify-center">
                    {allSelected && <Check className="h-4 w-4 text-black" />}
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  Select All ({selectedPlaylistIds.size} / {filteredPlaylists.length})
                </span>
              </div>
            </div>
          </div>

          {/* Playlist List */}
          <div className="max-h-[60vh] overflow-y-auto p-6 md:p-8 space-y-3" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#1DB954 rgba(255,255,255,0.1)'
          }}>
            {filteredPlaylists.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-lg"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music2 className="h-16 w-16 text-white/20" />
                  </div>
                </div>
                <p className="text-gray-400 text-xl">
                  {searchQuery ? "No playlists match your search" : "No playlists found"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-[#1DB954] hover:text-[#1ED760] transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handleSelectPlaylist(playlist.id)}
                  className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedPlaylistIds.has(playlist.id)
                      ? "bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30"
                      : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center flex-grow space-x-4">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedPlaylistIds.has(playlist.id)}
                        readOnly
                        className="sr-only peer"
                      />
                      <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${
                        selectedPlaylistIds.has(playlist.id)
                          ? "bg-[#1DB954] border-[#1DB954]"
                          : "border-white/20 bg-white/5 group-hover:border-[#1DB954]/50"
                        } transition-all duration-200`}>
                        {selectedPlaylistIds.has(playlist.id) && <Check className="h-4 w-4 text-black" />}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-white group-hover:text-[#1DB954] transition-colors">
                        {playlist.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <svg className="w-3 h-3 mr-1 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        <p className="text-sm text-gray-400">{playlist.trackCount} tracks</p>
                      </div>
                    </div>
                  </div>
                  <div className={`ml-4 h-8 w-8 rounded-full flex items-center justify-center ${
                    selectedPlaylistIds.has(playlist.id)
                      ? "bg-[#1DB954]/20"
                      : "bg-white/10 opacity-0 group-hover:opacity-100"
                    } transition-all duration-200`}>
                    {selectedPlaylistIds.has(playlist.id) ? (
                      <Check className="h-4 w-4 text-[#1DB954]" />
                    ) : (
                      <Plus className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Continue Button */}
          <div className="p-6 md:p-8 border-t border-white/10">
            <div className="flex justify-between items-center">
              <div className="text-gray-400">
                {selectedPlaylistIds.size} {selectedPlaylistIds.size === 1 ? "playlist" : "playlists"} selected
              </div>
              <button
                onClick={handleContinue}
                disabled={selectedPlaylistIds.size === 0}
                className={`py-3 px-8 rounded-full font-semibold text-lg transition-all duration-300 flex items-center ${
                  selectedPlaylistIds.size === 0
                    ? "bg-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-[#1DB954] hover:bg-[#1ED760] text-black shadow-[0_4px_12px_rgba(29,185,84,0.3)] hover:shadow-[0_6px_16px_rgba(29,185,84,0.5)] transform hover:-translate-y-0.5"
                }`}
              >
                <span>Continue</span>
                <ArrowRight
                  className={`ml-2 h-5 w-5 ${selectedPlaylistIds.size === 0 ? "text-gray-500" : "text-black"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
