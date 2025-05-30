"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, X, ArrowLeft, Sparkles, CheckCircle, Music2, Youtube } from "lucide-react" // Icons

interface PlaylistMetadata {
  id: string
  name: string
  trackCount: number
}

function MigrateConfigContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [allPlaylists, setAllPlaylists] = useState<PlaylistMetadata[]>([]) // All user playlists for filtering
  const [selectedMetadata, setSelectedMetadata] = useState<PlaylistMetadata[]>([])
  const [targetPlaylistName, setTargetPlaylistName] = useState<string>("")
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [migrationStatus, setMigrationStatus] = useState("") // Status message

  // Get initial selected IDs from URL
  const initialPlaylistIds = useMemo(() => {
    const playlistsParam = searchParams.get("playlists")
    return playlistsParam ? playlistsParam.split(",") : []
  }, [searchParams])

  // Fetch all playlists to get metadata for selected ones
  useEffect(() => {
    if (status === "authenticated" && session?.spotifyAccessToken && initialPlaylistIds.length > 0) {
      setIsLoadingMetadata(true)
      setError(null)
      fetch("/api/spotify/playlists") // Fetch all playlists
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          if (!data.playlists) {
            throw new Error("Invalid playlist data format received.")
          }
          setAllPlaylists(data.playlists)
          // Filter fetched playlists to get metadata for selected IDs
          const filteredMetadata = data.playlists.filter((p: PlaylistMetadata) => initialPlaylistIds.includes(p.id))
          setSelectedMetadata(filteredMetadata)
        })
        .catch((err) => {
          console.error("Failed to fetch playlist metadata:", err)
          setError(err.message || "Couldn't load playlist details. Try going back.")
        })
        .finally(() => {
          setIsLoadingMetadata(false)
        })
    } else if (status === "authenticated" && initialPlaylistIds.length === 0) {
      // No IDs provided, maybe redirect back or show error
      setError("No playlists selected. Please go back and select playlists.")
      setIsLoadingMetadata(false)
    } else if (status === "unauthenticated") {
      router.push("/") // Redirect if not logged in
    }
  }, [status, session?.spotifyAccessToken, initialPlaylistIds, router])

  // Handle removing a playlist from the selection
  const handleRemovePlaylist = (idToRemove: string) => {
    setSelectedMetadata((prev) => prev.filter((p) => p.id !== idToRemove))
    // Also update the URL potentially, or just manage state locally
    // For simplicity, we just update local state here.
  }

  // Handle Migration button click
  const handleMigrate = async () => {
    if (!targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating) {
      return
    }
    setIsMigrating(true)
    setError(null)
    setMigrationStatus("Processing migration, please wait...") // Set a generic status

    console.log(
      `Starting migration for playlists: ${selectedMetadata.map((p) => p.id).join(", ")} into new YT playlist: ${targetPlaylistName.trim()}`,
    )

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyPlaylistIds: selectedMetadata.map((p) => p.id),
          targetPlaylistName: targetPlaylistName.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Migration failed with status: ${response.status}`)
      }

      console.log("Migration successful:", result)
      setMigrationStatus("Migration Complete!")

      // Navigate to results page after a short delay to show completion
      setTimeout(() => {
        router.push(
          `/migration-results?youtubePlaylistId=${result.youtubePlaylistId}&unmatched=${result.unmatchedTracks?.length || 0}&total=${result.totalTracksProcessed || 0}`,
        )
      }, 1000) // Delay for 1 second
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred during migration."
      console.error("Migration Error:", err)
      setError(`Migration failed: ${message}`)
      setIsMigrating(false) // Re-enable button on failure
      setMigrationStatus("") // Clear status on error
    }
    // We don't set isMigrating = false on success because we navigate away
  }

  // Loading state for auth or initial metadata fetch
  if (status === "loading" || isLoadingMetadata) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white flex items-center justify-center">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-[#1DB954]/20 rounded-full blur-xl animate-pulse"></div>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center space-y-6 relative shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10">
            <Loader2 className="h-16 w-16 animate-spin text-[#1DB954]" />
            <span className="text-2xl font-medium text-white">Loading configuration...</span>
            <p className="text-gray-400 text-center max-w-xs">Preparing your playlist migration settings</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
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
              <h1 className="text-3xl font-bold">Error</h1>
              <p className="text-red-400 text-lg">{error}</p>
              <button
                onClick={() => router.back()} // Go back
                className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:shadow-[0_6px_16px_rgba(255,255,255,0.2)] transform hover:-translate-y-1 flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white p-6 md:p-10 relative">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#1DB954] blur-[120px]" />
          <div className="absolute top-[40%] right-[10%] w-72 h-72 rounded-full bg-red-500 blur-[150px]" />
          <div className="absolute bottom-[15%] left-[25%] w-80 h-80 rounded-full bg-blue-500 blur-[150px]" />
        </div>
      </div>

      {/* Overlay and Loading Indicator - Shown during migration */}
      {isMigrating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col items-center">
              {migrationStatus === "Migration Complete!" ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#1DB954] to-blue-500 flex items-center justify-center mb-6 animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-t-[#1DB954] border-r-blue-500 border-b-blue-500 border-l-[#1DB954] animate-spin mb-6"></div>
              )}
              <h2 className="text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] to-blue-500">
                {migrationStatus || "Processing..."}
              </h2>
              {/* Show redirect message only when status is complete */}
              {migrationStatus === "Migration Complete!" && (
                <div className="mt-4 flex items-center text-white bg-[#1DB954]/20 py-2 px-4 rounded-full">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <span>Redirecting to results...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className={`max-w-4xl mx-auto relative z-10 ${isMigrating ? "filter blur-sm pointer-events-none" : ""}`}>
        {/* Back button (disabled during migration) */}
        <button
          onClick={() => !isMigrating && router.back()}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go back"
          disabled={isMigrating}
        >
          <ArrowLeft className="mr-1 h-5 w-5" /> Back
        </button>

        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-14 h-14 mr-4">
              <div className="absolute inset-0 bg-[#1DB954]/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.42.12-.78-.18-.9-.54-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                    fill="#1DB954"
                  />
                </svg>
              </div>
            </div>
            <ArrowRight className="mx-3 text-gray-400" size={28} />
            <div className="relative w-14 h-14 ml-4">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Youtube className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1DB954] via-white to-red-500 text-transparent bg-clip-text">
            Configure Migration
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Review your selected playlists and set up your new YouTube playlist
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left Panel: Summary (Ensure buttons inside are disabled) */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/10">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-[#1DB954]/10 rounded-full mr-3">
                  <Music2 className="h-5 w-5 text-[#1DB954]" />
                </div>
                <h2 className="text-xl font-semibold">
                  Selected Playlists <span className="text-[#1DB954]">({selectedMetadata.length})</span>
                </h2>
              </div>

              {selectedMetadata.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Music2 className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 italic">No playlists selected or loaded.</p>
                </div>
              ) : (
                <div
                  className="space-y-3 max-h-[300px] overflow-y-auto pr-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#1DB954 rgba(255,255,255,0.1)",
                  }}
                >
                  {selectedMetadata.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`group flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-all duration-300 ${
                        isMigrating ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-8 h-8 bg-[#1DB954]/20 rounded-full flex-shrink-0 flex items-center justify-center">
                          <Music2 className="h-4 w-4 text-[#1DB954]" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium truncate" title={playlist.name}>
                            {playlist.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                            {playlist.trackCount} tracks
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePlaylist(playlist.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-full flex-shrink-0 disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10"
                        aria-label={`Remove ${playlist.name}`}
                        disabled={isMigrating} // Disable remove button during migration
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Configuration (Inputs and button disabled) */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-red-500/10 rounded-full mr-3">
                    <Youtube className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold">New YouTube Playlist</h2>
                </div>

                <label htmlFor="ytPlaylistName" className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ytPlaylistName"
                    value={targetPlaylistName}
                    onChange={(e) => setTargetPlaylistName(e.target.value)}
                    placeholder="e.g., My Spotify Favorites"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    required
                    disabled={isMigrating} // Disable input during migration
                  />
                  {targetPlaylistName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>

                <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Migration Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Playlists:</span>
                      <span className="font-medium">{selectedMetadata.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Tracks:</span>
                      <span className="font-medium">
                        {selectedMetadata.reduce((sum, playlist) => sum + playlist.trackCount, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Time:</span>
                      <span className="font-medium">
                        ~{Math.ceil(selectedMetadata.reduce((sum, p) => sum + p.trackCount, 0) / 10)} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleMigrate}
                  disabled={!targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating} // Disable button during migration
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center
                  ${
                    !targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating
                      ? "bg-white/10 text-gray-400 cursor-not-allowed" // Keep disabled style if migrating
                      : "bg-gradient-to-r from-[#1DB954] to-red-500 hover:from-[#1ED760] hover:to-red-400 text-white shadow-lg hover:shadow-[#1DB954]/20 transform hover:-translate-y-1"
                  }`}
                >
                  {isMigrating ? (
                    // Show only loader when migrating (progress shown in overlay)
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" /> Start Migration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap the component in Suspense for useSearchParams
export default function MigrateConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#121212] via-black to-[#121212] text-white flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-[#1DB954]/20 rounded-full blur-xl animate-pulse"></div>
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col items-center space-y-6 relative shadow-[0_0_40px_rgba(0,0,0,0.6)] z-10">
              <Loader2 className="h-16 w-16 animate-spin text-[#1DB954]" />
              <span className="text-2xl font-medium text-white">Loading...</span>
            </div>
          </div>
        </div>
      }
    >
      <MigrateConfigContent />
    </Suspense>
  )
}

function ArrowRight({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
