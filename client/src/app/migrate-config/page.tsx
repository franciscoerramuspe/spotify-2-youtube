"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, X, ArrowLeft, Sparkles } from 'lucide-react'; // Icons

interface PlaylistMetadata {
  id: string;
  name: string;
  trackCount: number;
}

function MigrateConfigContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [allPlaylists, setAllPlaylists] = useState<PlaylistMetadata[]>([]); // All user playlists for filtering
  const [selectedMetadata, setSelectedMetadata] = useState<PlaylistMetadata[]>([]);
  const [targetPlaylistName, setTargetPlaylistName] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get initial selected IDs from URL
  const initialPlaylistIds = useMemo(() => {
    const playlistsParam = searchParams.get('playlists');
    return playlistsParam ? playlistsParam.split(',') : [];
  }, [searchParams]);

  // Fetch all playlists to get metadata for selected ones
  useEffect(() => {
    if (status === 'authenticated' && session?.spotifyAccessToken && initialPlaylistIds.length > 0) {
      setIsLoadingMetadata(true);
      setError(null);
      fetch('/api/spotify/playlists') // Fetch all playlists
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (!data.playlists) {
            throw new Error('Invalid playlist data format received.');
          }
          setAllPlaylists(data.playlists);
          // Filter fetched playlists to get metadata for selected IDs
          const filteredMetadata = data.playlists.filter((p: PlaylistMetadata) => initialPlaylistIds.includes(p.id));
          setSelectedMetadata(filteredMetadata);
        })
        .catch((err) => {
          console.error("Failed to fetch playlist metadata:", err);
          setError(err.message || "Couldn't load playlist details. Try going back.");
        })
        .finally(() => {
          setIsLoadingMetadata(false);
        });
    } else if (status === 'authenticated' && initialPlaylistIds.length === 0) {
      // No IDs provided, maybe redirect back or show error
      setError("No playlists selected. Please go back and select playlists.");
      setIsLoadingMetadata(false);
    } else if (status === 'unauthenticated') {
      router.push('/'); // Redirect if not logged in
    }
  }, [status, session?.spotifyAccessToken, initialPlaylistIds, router]);

  // Handle removing a playlist from the selection
  const handleRemovePlaylist = (idToRemove: string) => {
    setSelectedMetadata((prev) => prev.filter((p) => p.id !== idToRemove));
    // Also update the URL potentially, or just manage state locally
    // For simplicity, we just update local state here.
  };

  // Handle Migration button click
  const handleMigrate = async () => {
    if (!targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating) {
      return;
    }
    setIsMigrating(true);
    setError(null);
    console.log(`Starting migration for playlists: ${selectedMetadata.map(p => p.id).join(', ')} into new YT playlist: ${targetPlaylistName.trim()}`);

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyPlaylistIds: selectedMetadata.map(p => p.id),
          targetPlaylistName: targetPlaylistName.trim(),
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Migration failed with status: ${response.status}`);
      }

      console.log("Migration successful:", result);
      // Navigate to a results page (replace with your actual route)
      // Pass necessary info like new playlist ID and unmatched tracks
      router.push(`/migration-results?youtubePlaylistId=${result.youtubePlaylistId}&unmatched=${result.unmatchedTracks?.length || 0}`);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred during migration.";
      console.error("Migration Error:", err);
      setError(`Migration failed: ${message}`);
      setIsMigrating(false); // Re-enable button on failure
    }
    // No finally block to set isMigrating to false, as we navigate away on success
  };

  // Loading state for auth or initial metadata fetch
  if (status === 'loading' || isLoadingMetadata) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="ml-4 text-xl">Loading configuration...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-red-400 mb-6">{error}</p>
        <button
          onClick={() => router.back()} // Go back
          className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-300 flex items-center"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
        </button>
      </div>
    );
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-700">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center"
          aria-label="Go back"
        >
          <ArrowLeft className="mr-1 h-5 w-5" /> Back
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-blue-400">Configure Migration</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel: Summary */}
          <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Selected Spotify Playlists ({selectedMetadata.length})</h2>
            {selectedMetadata.length === 0 ? (
              <p className="text-gray-400 italic">No playlists selected or loaded.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {selectedMetadata.map((playlist) => (
                  <li key={playlist.id} className="flex justify-between items-center bg-gray-600/40 p-2 rounded">
                    <span className="truncate mr-2" title={playlist.name}>{playlist.name} ({playlist.trackCount})</span>
                    <button
                      onClick={() => handleRemovePlaylist(playlist.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full flex-shrink-0"
                      aria-label={`Remove ${playlist.name}`}
                      disabled={isMigrating}
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right Panel: Configuration */}
          <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-4">New YouTube Playlist</h2>
              <label htmlFor="ytPlaylistName" className="block text-sm font-medium text-gray-300 mb-1">Playlist Name</label>
              <input
                type="text"
                id="ytPlaylistName"
                value={targetPlaylistName}
                onChange={(e) => setTargetPlaylistName(e.target.value)}
                placeholder="e.g., My Spotify Imports"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                required
                disabled={isMigrating}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={handleMigrate}
                disabled={!targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center
                  ${(!targetPlaylistName.trim() || selectedMetadata.length === 0 || isMigrating)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-400 hover:to-blue-500 text-white shadow-lg hover:shadow-blue-500/30'}`}
              >
                {isMigrating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Migrating...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Start Migration</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component in Suspense for useSearchParams
export default function MigrateConfigPage() {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <span className="ml-4 text-xl">Loading...</span>
        </div>
      }>
        <MigrateConfigContent />
      </Suspense>
    );
  } 