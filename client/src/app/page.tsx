"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import ProviderCarousel from "@/components/ProviderCarousel"
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from "@/lib/providers"
import { Provider } from "@/types/providers"

export default function Home() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionUpdateAttempted = useRef(false)

  // Get initial state from URL params or defaults
  const getInitialSourceProvider = () => {
    const urlSource = searchParams.get('source');
    const validProvider = DEFAULT_PROVIDERS.find(p => p.id === urlSource && p.capabilities.import);
    return validProvider ? urlSource! : 'spotify';
  };

  const getInitialDestinationProvider = () => {
    const urlDestination = searchParams.get('destination');
    const urlSource = searchParams.get('source');
    const validProvider = DEFAULT_PROVIDERS.find(p => 
      p.id === urlDestination && 
      p.capabilities.export && 
      p.id !== urlSource
    );
    return validProvider ? urlDestination! : 'youtube';
  };

  const getInitialStep = () => {
    const urlSource = searchParams.get('source');
    const urlDestination = searchParams.get('destination');
    
    if (urlSource && urlDestination && urlSource !== urlDestination) {
      return 'complete';
    } else if (urlSource) {
      return 'destination';
    }
    return 'source';
  };

  // Provider selection state - initialized from URL
  const [sourceProvider, setSourceProvider] = useState<string>(getInitialSourceProvider)
  const [destinationProvider, setDestinationProvider] = useState<string>(getInitialDestinationProvider)
  const [selectionStep, setSelectionStep] = useState<'source' | 'destination' | 'complete'>(getInitialStep)

  // Update providers with real connection status
  const providersWithStatus: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }))

  // Legacy compatibility - will be removed when other pages are updated
  // const spotifyDirectlyConnected = status === "authenticated" && !!session?.spotifyAccessToken;
  // const googleDirectlyConnected = status === "authenticated" && !!session?.googleAccessToken;

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

  // Sync state with URL changes (for browser back/forward)
  useEffect(() => {
    const urlSource = searchParams.get('source');
    const urlDestination = searchParams.get('destination');
    
    // Determine the correct step based on URL params
    let newStep: 'source' | 'destination' | 'complete' = 'source';
    if (urlSource && urlDestination && urlSource !== urlDestination) {
      newStep = 'complete';
    } else if (urlSource) {
      newStep = 'destination';
    }
    
    // Validate and update source if needed
    const validSource = DEFAULT_PROVIDERS.find(p => p.id === urlSource && p.capabilities.import);
    if (validSource && urlSource !== sourceProvider) {
      setSourceProvider(urlSource || ''); // Ensure non-null string
    }
    
    // Validate and update destination if needed
    const validDestination = DEFAULT_PROVIDERS.find(p => 
      p.id === urlDestination && 
      p.capabilities.export && 
      p.id !== (urlSource || sourceProvider)
    );
    if (validDestination && urlDestination !== destinationProvider) {
      setDestinationProvider(urlDestination || ''); // Ensure non-null string
    }
    
    // Update step if needed
    if (newStep !== selectionStep) {
      setSelectionStep(newStep);
    }
  }, [searchParams]); // Only depend on searchParams to avoid infinite loops

  const isLoading = status === "loading";

  // URL parameter update helper
  const updateUrlParams = (newSource?: string, newDestination?: string) => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSource) {
      params.set('source', newSource);
    }
    if (newDestination) {
      params.set('destination', newDestination);
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Provider selection handlers with URL updates
  const handleSourceSelection = (providerId: string) => {
    setSourceProvider(providerId);
    setSelectionStep('destination');
    
    // Update URL with source parameter
    updateUrlParams(providerId);
  };

  const handleDestinationSelection = (providerId: string) => {
    setDestinationProvider(providerId);
    setSelectionStep('complete');
    
    // Update URL with both source and destination
    updateUrlParams(sourceProvider, providerId);
  };

  // Check which providers need connection
  const getProvidersNeedingConnection = () => {
    const sourceProviderObj = providersWithStatus.find(p => p.id === sourceProvider);
    const destinationProviderObj = providersWithStatus.find(p => p.id === destinationProvider);
    
    const needsConnection = [];
    if (sourceProviderObj?.status !== 'connected') {
      needsConnection.push(sourceProviderObj);
    }
    if (destinationProviderObj?.status !== 'connected' && destinationProvider !== sourceProvider) {
      needsConnection.push(destinationProviderObj);
    }
    
    return needsConnection.filter(Boolean) as Provider[];
  };

  const providersNeedingConnection = getProvidersNeedingConnection();
  const bothProvidersConnected = providersNeedingConnection.length === 0;

  // Navigation logic
  const handleProceed = () => {
    if (bothProvidersConnected) {
      // Both providers connected, go to migrate page
      router.push(`/migrate?source=${sourceProvider}&destination=${destinationProvider}`);
    } else {
      // Go to connection flow first
      router.push(`/connect?source=${sourceProvider}&destination=${destinationProvider}`);
    }
  };

  const canProceed = () => {
    return selectionStep === 'complete' && sourceProvider && destinationProvider && sourceProvider !== destinationProvider;
  };

  // Handle back navigation with URL updates
  const handleBackToSelection = () => {
    setSelectionStep('destination');
    
    // Update URL to remove destination parameter
    const params = new URLSearchParams(searchParams.toString());
    params.delete('destination');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Handle back to source selection (from destination step)
  const handleBackToSourceSelection = () => {
    setSelectionStep('source');
    
    // Clear URL parameters and reset to initial state
    router.replace('/', { scroll: false });
  };

  // Handle starting fresh (clear all selections)
  const handleStartFresh = () => {
    setSourceProvider('spotify');
    setDestinationProvider('youtube');
    setSelectionStep('source');
    
    // Clear URL parameters
    router.replace('/', { scroll: false });
  };

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
        {/* Logo and Title - Updated for multi-provider */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-400 to-red-500 tracking-tight px-2">
            Music Provider Migration
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-2">
            Seamlessly migrate your playlists between any music streaming platforms with just a few clicks.
          </p>

          {/* Progress Indicator */}
          {selectionStep !== 'source' && (
            <div className="flex justify-center items-center space-x-4 mt-6">
              <div className="px-3 py-1 rounded-full bg-green-600 text-white text-sm">
                ✓ Source: {providersWithStatus.find(p => p.id === sourceProvider)?.displayName}
              </div>
              {selectionStep === 'complete' && (
                <>
                  <div className="w-6 h-0.5 bg-gray-600"></div>
                  <div className="px-3 py-1 rounded-full bg-green-600 text-white text-sm">
                    ✓ Destination: {providersWithStatus.find(p => p.id === destinationProvider)?.displayName}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Provider Selection Carousel */}
        <div className="w-full max-w-6xl mb-8">
          {selectionStep === 'source' && (
            <ProviderCarousel
              label="Select Source Provider (Import From)"
              providers={providersWithStatus}
              selectedProviderId={sourceProvider}
              onSelectionChange={handleSourceSelection}
              filters={{ capability: 'import' }}
              showStatusIndicators={true}
              allowDisconnectedSelection={true}
            />
          )}

          {selectionStep === 'destination' && (
            <>
              <ProviderCarousel
                label="Select Destination Provider (Export To)"
                providers={providersWithStatus}
                selectedProviderId={destinationProvider}
                onSelectionChange={handleDestinationSelection}
                filters={{ 
                  capability: 'export',
                  exclude: [sourceProvider]
                }}
                showStatusIndicators={true}
                allowDisconnectedSelection={true}
              />
              
              {/* Back Button for Destination Selection */}
              <div className="text-center mt-6">
                <button
                  onClick={handleBackToSourceSelection}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition-colors duration-300"
                >
                  ← Back to Source Selection
                </button>
              </div>
            </>
          )}

          {selectionStep === 'complete' && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-8 text-white">Migration Ready!</h2>
              
              {/* Migration Summary */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-2xl mx-auto mb-8">
                <div className="flex items-center justify-center space-x-8">
                  {(() => {
                    const source = providersWithStatus.find(p => p.id === sourceProvider);
                    const destination = providersWithStatus.find(p => p.id === destinationProvider);
                    
                    return (
                      <>
                        <div className="text-center">
                          <img src={source?.icon} alt={source?.displayName} className="w-16 h-16 mx-auto mb-2" />
                          <p className="font-medium">{source?.displayName}</p>
                          <p className="text-sm text-gray-400">
                            {source?.status === 'connected' ? '✓ Connected' : 'Needs Connection'}
                          </p>
                        </div>
                        
                        <div className="text-4xl text-gray-400">→</div>
                        
                        <div className="text-center">
                          <img src={destination?.icon} alt={destination?.displayName} className="w-16 h-16 mx-auto mb-2" />
                          <p className="font-medium">{destination?.displayName}</p>
                          <p className="text-sm text-gray-400">
                            {destination?.status === 'connected' ? '✓ Connected' : 'Needs Connection'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Connection Status */}
                {providersNeedingConnection.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-300 text-sm">
                      <strong>Next:</strong> You'll need to connect {providersNeedingConnection.map(p => p.displayName).join(' and ')} 
                      {providersNeedingConnection.length === 1 ? ' account' : ' accounts'} to proceed.
                    </p>
                  </div>
                )}

                {bothProvidersConnected && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-green-300 text-sm">
                      <strong>Ready!</strong> Both providers are connected. You can proceed directly to playlist selection.
                    </p>
                  </div>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={handleBackToSelection}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition-colors duration-300 mr-4"
              >
                ← Change Providers
              </button>
            </div>
          )}
        </div>

        {/* Next Button - Updated for new flow */}
        {selectionStep === 'complete' && (
          <div className="mt-8 w-full max-w-3xl px-2">
            <button
              disabled={!canProceed() || isLoading}
              onClick={handleProceed}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 text-lg flex items-center justify-center
                ${
                  (!canProceed() || isLoading)
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30"
                }`}
            >
              {bothProvidersConnected 
                ? "Start Migration" 
                : `Connect ${providersNeedingConnection.length === 1 ? 'Provider' : 'Providers'} & Continue`
              }
            </button>
          </div>
        )}

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
