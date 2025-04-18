// src/app/select-playlists/page.tsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react'; // Icons

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
}

export default function SelectPlaylistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state for Select All checkbox - Move useMemo before any conditional returns
  const allSelected = useMemo(() => {
    return playlists.length > 0 && selectedPlaylistIds.size === playlists.length;
  }, [playlists, selectedPlaylistIds]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (status === 'authenticated' && session?.spotifyAccessToken) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/spotify/playlists', {
            headers: {
              Authorization: `Bearer ${session.spotifyAccessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch playlists');
          }

          const data = await response.json();
          // Ensure we're getting an array of playlists
          const playlistsArray = Array.isArray(data.playlists) ? data.playlists : [];
          setPlaylists(playlistsArray);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setPlaylists([]); // Reset playlists on error
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlaylists();
  }, [session?.spotifyAccessToken, status]);

  // Handle selecting/deselecting a single playlist
  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(playlistId)) {
        newSelected.delete(playlistId);
      } else {
        newSelected.add(playlistId);
      }
      return newSelected;
    });
  };

  // Handle Select All / Deselect All
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPlaylistIds(new Set<string>()); // Deselect all
    } else {
      // Ensure playlists is an array before mapping
      const allIds = Array.isArray(playlists) 
        ? new Set<string>(playlists.map(p => p.id))
        : new Set<string>();
      setSelectedPlaylistIds(allIds);
    }
  };

  // Handle Continue button click
  const handleContinue = () => {
    const selectedIds = Array.from(selectedPlaylistIds);
    if (selectedIds.length === 0) {
      return;
    }
    const queryString = `playlists=${selectedIds.join(',')}`;
    router.push(`/migrate-config?${queryString}`);
  };

  // Show loading state only during initial auth check
  const isAuthLoading = status === 'loading';
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="ml-4 text-xl">Checking authentication...</span>
      </div>
    );
  }

  // Show playlist loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="ml-4 text-xl">Loading playlists...</span>
      </div>
    );
  }

  // Conditional Rendering
  if (status === 'authenticated' && !session?.spotifyAccessToken) {
     return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Spotify Not Connected</h1>
        <p className="text-gray-400 mb-6 text-center">Please connect your Spotify account on the homepage first.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-300"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Playlists</h1>
        <p className="text-red-400 mb-6 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple refresh action
          className="bg-red-600 hover:bg-red-500 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-700">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-blue-400">Select Spotify Playlists</h1>

        {playlists.length === 0 ? (
          <p className="text-center text-gray-400">You don't have any Spotify playlists.</p>
        ) : (
          <>
            {/* Select All Row */}
            <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
              <label htmlFor="selectAll" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="selectAll"
                  className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 accent-blue-500 mr-3"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <span className="text-lg font-medium">Select All ({selectedPlaylistIds.size} / {playlists.length})</span>
              </label>
            </div>

            {/* Playlist List */}
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${selectedPlaylistIds.has(playlist.id) ? 'bg-blue-900/50 hover:bg-blue-900/70' : 'bg-gray-700/30 hover:bg-gray-700/60'}`}
                  onClick={() => handleSelectPlaylist(playlist.id)}
                >
                  <div className="flex items-center flex-grow mr-4 min-w-0">
                     <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 accent-blue-500 mr-4 flex-shrink-0"
                      checked={selectedPlaylistIds.has(playlist.id)}
                      readOnly // Checkbox state controlled by div click
                      tabIndex={-1} // Prevent focus
                    />
                    <span className="font-medium truncate" title={playlist.name}>{playlist.name}</span>
                  </div>
                  <span className="text-sm text-gray-400 flex-shrink-0">{playlist.trackCount} tracks</span>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleContinue}
                disabled={selectedPlaylistIds.size === 0}
                className={`py-3 px-8 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center ${selectedPlaylistIds.size === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-lg hover:shadow-purple-500/30'}`}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Basic CSS for custom scrollbar (optional, place in globals.css or similar)
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #2d3748; // gray-700
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4a5568; // gray-600
  border-radius: 10px;
  border: 2px solid #2d3748; // gray-700
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #718096; // gray-500
}
*/ 