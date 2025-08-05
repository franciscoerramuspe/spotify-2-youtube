"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Music, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from '@/lib/providers';
import { Provider } from '@/types/providers';
import { getProviderStyles } from '@/lib/theme';

interface MigrationResult {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  totalTracks?: number;
  processedTracks?: number;
  matchedTracks?: number;
  playlistUrl?: string;
}

export default function MigratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sourceProviderId = searchParams.get('source') || 'spotify';
  const destinationProviderId = searchParams.get('destination') || 'youtube';

  const [migrationResult, setMigrationResult] = useState<MigrationResult>({
    status: 'pending',
    progress: 0,
    message: 'Ready to start migration'
  });

  // Update providers with real connection status
  const providersWithStatus: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }));

  const sourceProvider = providersWithStatus.find(p => p.id === sourceProviderId);
  const destinationProvider = providersWithStatus.find(p => p.id === destinationProviderId);

  // Check if both providers are connected
  const bothConnected = sourceProvider?.status === 'connected' && destinationProvider?.status === 'connected';

  // Redirect to connection if needed
  useEffect(() => {
    if (status === 'authenticated' && !bothConnected) {
      router.push(`/connect?source=${sourceProviderId}&destination=${destinationProviderId}`);
    }
  }, [status, bothConnected, router, sourceProviderId, destinationProviderId]);

  const startMigration = async () => {
    if (!bothConnected) return;

    setMigrationResult({
      status: 'running',
      progress: 0,
      message: 'Starting migration...'
    });

    try {
      // For now, simulate the migration process
      // In real implementation, this would call your migration API
      
      // Simulate progress updates
      const steps = [
        { progress: 10, message: 'Fetching playlists from source...' },
        { progress: 30, message: 'Analyzing track metadata...' },
        { progress: 50, message: 'Searching for matches on destination...' },
        { progress: 70, message: 'Creating destination playlist...' },
        { progress: 90, message: 'Adding tracks to playlist...' },
        { progress: 100, message: 'Migration completed successfully!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMigrationResult(prev => ({
          ...prev,
          progress: step.progress,
          message: step.message
        }));
      }

      // Final result
      setMigrationResult({
        status: 'completed',
        progress: 100,
        message: 'Migration completed successfully!',
        totalTracks: 25,
        processedTracks: 25,
        matchedTracks: 23,
        playlistUrl: 'https://music.youtube.com/playlist?list=example'
      });

    } catch (error) {
      setMigrationResult({
        status: 'failed',
        progress: 0,
        message: 'Migration failed. Please try again.'
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!sourceProvider || !destinationProvider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Invalid Provider Configuration</h1>
          <p className="text-gray-300 mb-6">The selected providers are not valid.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors duration-300"
          >
            Return to Provider Selection
          </button>
        </div>
      </div>
    );
  }

  const sourceStyles = getProviderStyles(sourceProvider);
  const destinationStyles = getProviderStyles(destinationProvider);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[5%] left-[5%] w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-green-500 blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-[40%] right-[5%] w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-red-500 blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-[10%] left-[15%] w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-pink-500 blur-[100px] sm:blur-[150px]" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-400 to-red-500">
            Playlist Migration
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Migrating your music from {sourceProvider.displayName} to {destinationProvider.displayName}
          </p>

          {/* Migration Flow Visualization */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className={`w-20 h-20 ${sourceStyles.centerCard.split(' ')[0]} rounded-2xl flex items-center justify-center mb-3`}>
                <img src={sourceProvider.icon} alt={sourceProvider.displayName} className="w-12 h-12" />
              </div>
              <p className="font-medium">{sourceProvider.displayName}</p>
              <p className="text-sm text-gray-400">Source</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-2">
                <Music className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-4xl text-gray-400 animate-pulse">→</div>
            </div>
            
            <div className="text-center">
              <div className={`w-20 h-20 ${destinationStyles.centerCard.split(' ')[0]} rounded-2xl flex items-center justify-center mb-3`}>
                <img src={destinationProvider.icon} alt={destinationProvider.displayName} className="w-12 h-12" />
              </div>
              <p className="font-medium">{destinationProvider.displayName}</p>
              <p className="text-sm text-gray-400">Destination</p>
            </div>
          </div>
        </div>

        {/* Migration Status */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            {/* Status Icon */}
            <div className="text-center mb-6">
              {migrationResult.status === 'pending' && (
                <Clock className="h-16 w-16 text-blue-500 mx-auto" />
              )}
              {migrationResult.status === 'running' && (
                <div className="h-16 w-16 mx-auto">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
                </div>
              )}
              {migrationResult.status === 'completed' && (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              )}
              {migrationResult.status === 'failed' && (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )}
            </div>

            {/* Status Message */}
            <h2 className="text-2xl font-semibold text-center mb-4">
              {migrationResult.status === 'pending' && 'Ready to Migrate'}
              {migrationResult.status === 'running' && 'Migration in Progress'}
              {migrationResult.status === 'completed' && 'Migration Complete!'}
              {migrationResult.status === 'failed' && 'Migration Failed'}
            </h2>

            <p className="text-center text-gray-300 mb-6">{migrationResult.message}</p>

            {/* Progress Bar */}
            {(migrationResult.status === 'running' || migrationResult.status === 'completed') && (
              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${migrationResult.progress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">
                  {migrationResult.progress}% Complete
                </p>
              </div>
            )}

            {/* Migration Stats */}
            {migrationResult.status === 'completed' && migrationResult.totalTracks && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{migrationResult.totalTracks}</div>
                  <div className="text-sm text-gray-400">Total Tracks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{migrationResult.matchedTracks}</div>
                  <div className="text-sm text-gray-400">Matched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {migrationResult.totalTracks - (migrationResult.matchedTracks || 0)}
                  </div>
                  <div className="text-sm text-gray-400">Not Found</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              {migrationResult.status === 'pending' && (
                <button
                  onClick={startMigration}
                  disabled={!bothConnected}
                  className={`px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 ${
                    bothConnected
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Start Migration
                </button>
              )}

              {migrationResult.status === 'completed' && migrationResult.playlistUrl && (
                <div className="space-y-4">
                  <a
                    href={migrationResult.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium text-lg transition-colors duration-300"
                  >
                    View Playlist on {destinationProvider.displayName}
                  </a>
                  <div>
                    <button
                      onClick={() => router.push('/')}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors duration-300"
                    >
                      Start New Migration
                    </button>
                  </div>
                </div>
              )}

              {migrationResult.status === 'failed' && (
                <div className="space-y-4">
                  <button
                    onClick={startMigration}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-lg transition-colors duration-300"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/?source=${sourceProviderId}&destination=${destinationProviderId}`)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Provider Selection</span>
          </button>
        </div>
      </div>
    </div>
  );
}