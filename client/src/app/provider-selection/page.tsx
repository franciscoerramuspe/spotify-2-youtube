"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProviderCarousel from '@/components/ProviderCarousel';
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from '@/lib/providers';
import { Provider } from '@/types/providers';

export default function ProviderSelection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sourceProvider, setSourceProvider] = useState<string>('spotify');
  const [destinationProvider, setDestinationProvider] = useState<string>('youtube');
  const [step, setStep] = useState<'source' | 'destination'>('source');

  // Update providers with real connection status
  const providersWithStatus: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }));

  const handleSourceSelection = (providerId: string) => {
    setSourceProvider(providerId);
    setStep('destination');
  };

  const handleDestinationSelection = (providerId: string) => {
    setDestinationProvider(providerId);
  };

  const handleProceed = () => {
    // Store selected providers and navigate to next step
    localStorage.setItem('selectedSourceProvider', sourceProvider);
    localStorage.setItem('selectedDestinationProvider', destinationProvider);
    router.push('/select-playlists');
  };

  const canProceed = () => {
    const source = providersWithStatus.find(p => p.id === sourceProvider);
    const destination = providersWithStatus.find(p => p.id === destinationProvider);
    
    return source?.status === 'connected' && 
           destination?.status === 'connected' &&
           sourceProvider !== destinationProvider;
  };

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
            Select Your Providers
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose your source and destination music providers
          </p>

          {/* Progress Indicator */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className={`px-4 py-2 rounded-full ${step === 'source' ? 'bg-blue-600' : 'bg-green-600'}`}>
              1. Source Provider
            </div>
            <div className="w-8 h-0.5 bg-gray-600"></div>
            <div className={`px-4 py-2 rounded-full ${step === 'destination' ? 'bg-blue-600' : 'bg-gray-600'}`}>
              2. Destination Provider
            </div>
          </div>
        </div>

        {/* Source Provider Selection */}
        {step === 'source' && (
          <div className="mb-12">
            <ProviderCarousel
              label="Select Source Provider (Import From)"
              providers={providersWithStatus}
              selectedProviderId={sourceProvider}
              onSelectionChange={handleSourceSelection}
              filters={{ capability: 'import' }}
              showStatusIndicators={true}
              allowDisconnectedSelection={false}
            />
          </div>
        )}

        {/* Destination Provider Selection */}
        {step === 'destination' && (
          <div className="mb-12">
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
              allowDisconnectedSelection={false}
            />
            
            {/* Back Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => setStep('source')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition-colors duration-300 mr-4"
              >
                ← Back to Source
              </button>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {step === 'destination' && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-center">Migration Summary</h3>
              <div className="flex items-center justify-center space-x-8">
                {(() => {
                  const source = providersWithStatus.find(p => p.id === sourceProvider);
                  const destination = providersWithStatus.find(p => p.id === destinationProvider);
                  
                  return (
                    <>
                      <div className="text-center">
                        <img src={source?.icon} alt={source?.displayName} className="w-16 h-16 mx-auto mb-2" />
                        <p className="font-medium">{source?.displayName}</p>
                        <p className="text-sm text-gray-400">Source</p>
                      </div>
                      
                      <div className="text-4xl text-gray-400">→</div>
                      
                      <div className="text-center">
                        <img src={destination?.icon} alt={destination?.displayName} className="w-16 h-16 mx-auto mb-2" />
                        <p className="font-medium">{destination?.displayName}</p>
                        <p className="text-sm text-gray-400">Destination</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Proceed Button */}
        {step === 'destination' && (
          <div className="text-center">
            <button
              onClick={handleProceed}
              disabled={!canProceed()}
              className={`px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 ${
                canProceed()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canProceed() ? 'Continue to Playlist Selection' : 'Connect Both Providers to Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}