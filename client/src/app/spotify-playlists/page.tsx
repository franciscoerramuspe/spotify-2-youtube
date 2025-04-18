// src/app/spotify-playlists/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"

// Define the type for the playlist data we expect from our API route
interface Playlist {
  id: string
  name: string
  imageUrl?: string
  owner: string
  trackCount: number
}

// Simple CSS styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "16px",
    color: "#1DB954", // Spotify green
  },
  userInfo: {
    fontSize: "16px",
    marginBottom: "20px",
  },
  button: {
    backgroundColor: "#1DB954",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "20px",
  },
  signOutButton: {
    backgroundColor: "#333",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "14px",
    cursor: "pointer",
  },
  loadingMessage: {
    textAlign: "center" as const,
    padding: "40px 0",
    fontSize: "18px",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  playlistsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },
  playlistCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  playlistImage: {
    position: "relative",
    height: "180px",
    backgroundColor: "#f0f0f0",
  },
  playlistInfo: {
    padding: "15px",
  },
  playlistName: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  },
  playlistMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#666",
  },
  trackCount: {
    backgroundColor: "#f0f0f0",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "12px",
  },
}

export default function SpotifyPlaylistsPage() {
  const { data: session, status } = useSession()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch playlists only if the user is authenticated
    if (session?.accessToken) {
      setIsLoading(true)
      setError(null)
      fetch("/api/spotify/playlists") // Call our API route
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              throw new Error(err.error || `HTTP error! status: ${res.status}`)
            })
          }
          return res.json()
        })
        .then((data) => {
          setPlaylists(data.playlists || []) // Ensure playlists is always an array
        })
        .catch((e) => {
          console.error("Failed to fetch playlists:", e)
          setError(e.message || "An unknown error occurred.")
          setPlaylists([]) // Clear playlists on error
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [session]) // Re-run effect when session changes

  if (status === "loading") {
    return <div style={styles.loadingMessage}>Loading session...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Spotify Playlists</h1>

        {session && (
          <div style={styles.userInfo}>
            <p>Signed in as {session.user?.name || session.user?.email}</p>
            <button style={styles.signOutButton} onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        )}
      </div>

      {!session ? (
        <div>
          <p style={{ marginBottom: "20px" }}>Please sign in with Spotify to view your playlists.</p>
          <button style={styles.button} onClick={() => signIn("spotify")}>
            Sign in with Spotify
          </button>
        </div>
      ) : (
        <div>
          {isLoading && <div style={styles.loadingMessage}>Loading playlists...</div>}

          {error && <div style={styles.errorMessage}>Error loading playlists: {error}</div>}

          {!isLoading && !error && playlists.length === 0 && (
            <p>No playlists found or you haven't granted permission.</p>
          )}

          {!isLoading && !error && playlists.length > 0 && (
            <div style={styles.playlistsGrid}>
              {playlists.map((playlist) => (
                <div key={playlist.id} style={styles.playlistCard}>
                  <div style={styles.playlistImage}>
                    {playlist.imageUrl ? (
                      <Image
                        src={playlist.imageUrl || "/placeholder.svg"}
                        alt={`${playlist.name} cover`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          backgroundColor: "#ddd",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>
                  <div style={styles.playlistInfo}>
                    <h3 style={styles.playlistName}>{playlist.name}</h3>
                    <div style={styles.playlistMeta}>
                      <span>by {playlist.owner}</span>
                      <span style={styles.trackCount}>{playlist.trackCount} tracks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
