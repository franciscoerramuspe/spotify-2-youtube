"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ExternalLink } from 'lucide-react';
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from '@/lib/providers';
import { Provider } from '@/types/providers';
import { getProviderStyles } from '@/lib/theme';

export default function ConnectProviders() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sourceProviderId = searchParams.get('source') || 'spotify';
  const destinationProviderId = searchParams.get('destination') || 'youtube';

  const [connectionAttempted, setConnectionAttempted] = useState<Record<string, boolean>>({});

  // Update providers with real connection status
  const providersWithStatus: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }));

  const sourceProvider = providersWithStatus.find(p => p.id === sourceProviderId);
  const destinationProvider = providersWithStatus.find(p => p.id === destinationProviderId);

  // Get providers that need connection
  const providersNeedingConnection = [sourceProvider, destinationProvider]
    .filter(Boolean)
    .filter(p => p!.status !== 'connected') as Provider[];

  // Check if all required providers are connected
  const allConnected = providersNeedingConnection.length === 0;

  // Auto-redirect if all connected
  useEffect(() => {
    if (allConnected && status === 'authenticated') {
      const timer = setTimeout(() => {
        router.push(`/migrate?source=${sourceProviderId}&destination=${destinationProviderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allConnected, status, router, sourceProviderId, destinationProviderId]);

  // Update session after OAuth redirect
  useEffect(() => {
    const hasOauthParams = searchParams.has("code") || searchParams.has("state") || searchParams.has("oauth_token");
    if (status === "authenticated" && hasOauthParams) {
      updateSession();
    }
  }, [status, searchParams, updateSession]);

  const handleConnect = (provider: Provider) => {
    setConnectionAttempted(prev => ({ ...prev, [provider.id]: true }));
    
    // Get the appropriate auth provider
    let authProvider = provider.authProvider;
    if (provider.id === 'youtube') {
      authProvider = 'google';
    }
    
    if (authProvider) {
      window.location.href = `/api/auth/signin/${authProvider}?callbackUrl=${encodeURIComponent(window.location.href)}`;
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
            Connect Your Accounts
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Connect the required providers to begin your playlist migration
          </p>

          {/* Migration Flow Preview */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="text-center">
              <img src={sourceProvider?.icon} alt={sourceProvider?.displayName} className="w-16 h-16 mx-auto mb-2" />
              <p className="font-medium text-sm">{sourceProvider?.displayName}</p>
              <p className="text-xs text-gray-400">Source</p>
            </div>
            
            <div className="text-4xl text-gray-400">→</div>
            
            <div className="text-center">
              <img src={destinationProvider?.icon} alt={destinationProvider?.displayName} className="w-16 h-16 mx-auto mb-2" />
              <p className="font-medium text-sm">{destinationProvider?.displayName}</p>
              <p className="text-xs text-gray-400">Destination</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {allConnected ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-green-400 mb-4">All Set!</h2>
              <p className="text-gray-300 mb-6">
                Both providers are connected. Redirecting to migration page...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[sourceProvider, destinationProvider].filter(Boolean).map((provider) => {
                if (!provider) return null;
                
                const isConnected = provider.status === 'connected';
                const styles = getProviderStyles(provider);
                const wasAttempted = connectionAttempted[provider.id];

                return (
                  <div
                    key={provider.id}
                    className={`${isConnected ? styles.centerCard.replace('cursor-pointer', '') : styles.centerCard} h-80`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isConnected ? (
                        <div className={`flex items-center space-x-1 ${styles.connectedBadge} px-3 py-1 rounded-full text-sm`}>
                          <Check className="h-4 w-4" />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-yellow-600/80 text-white px-3 py-1 rounded-full text-sm">
                          <span>Required</span>
                        </div>
                      )}
                    </div>

                    {/* Provider Content */}
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      {/* Provider Icon */}
                      <div className="w-20 h-20 mb-6">
                        <img
                          src={provider.icon}
                          alt={`${provider.displayName} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Provider Name */}
                      <h3 className={`text-2xl font-semibold ${styles.title} mb-4`}>
                        {provider.displayName}
                      </h3>

                      {/* Connection Button or Status */}
                      {isConnected ? (
                        <div className={`flex items-center space-x-2 ${styles.connectedBadge} px-6 py-3 rounded-xl font-medium`}>
                          <Check className="h-5 w-5" />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(provider)}
                          disabled={wasAttempted}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            wasAttempted
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : `${styles.connectedBadge.replace('/80', '')} hover:shadow-lg`
                          }`}
                        >
                          <ExternalLink className="h-5 w-5" />
                          <span>{wasAttempted ? 'Connecting...' : `Connect ${provider.displayName}`}</span>
                        </button>
                      )}

                      {/* Role Badge */}
                      <div className="mt-4">
                        <span className={`px-3 py-1 ${styles.capability} rounded-full text-xs`}>
                          {provider.id === sourceProviderId ? 'Source Provider' : 'Destination Provider'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="text-center mt-12">
              <button
                onClick={() => router.push(`/?source=${sourceProviderId}&destination=${destinationProviderId}`)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition-colors duration-300"
              >
                ← Back to Provider Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}