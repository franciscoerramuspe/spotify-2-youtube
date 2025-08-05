"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ProviderCarousel from '@/components/ProviderCarousel';
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from '@/lib/providers';
import { Provider } from '@/types/providers';

export default function ProviderDemo() {
  const { data: session } = useSession();
  const [selectedProviderId, setSelectedProviderId] = useState<string>('spotify');
  const [demoScenario, setDemoScenario] = useState<'all' | 'source' | 'destination'>('all');

  // Update providers with real connection status
  const providersWithStatus: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }));

  const getFilteredProviders = () => {
    switch (demoScenario) {
      case 'source':
        return {
          providers: providersWithStatus,
          filters: { capability: 'import' as const },
          label: 'Select Source Provider',
        };
      case 'destination':
        return {
          providers: providersWithStatus,
          filters: { 
            capability: 'export' as const,
            exclude: [selectedProviderId] // Exclude selected source
          },
          label: 'Select Destination Provider',
        };
      default:
        return {
          providers: providersWithStatus,
          filters: undefined,
          label: 'Select Any Provider',
        };
    }
  };

  const { providers, filters, label } = getFilteredProviders();

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
            Provider Carousel Demo
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Scalable N-Provider carousel component demonstration
          </p>

          {/* Demo Scenario Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { key: 'all', label: 'All Providers' },
              { key: 'source', label: 'Import Capable Only' },
              { key: 'destination', label: 'Export Capable Only' },
            ].map(({ key, label: buttonLabel }) => (
              <button
                key={key}
                onClick={() => setDemoScenario(key as 'all' | 'source' | 'destination')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  demoScenario === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {buttonLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Carousel */}
        <div className="mb-12">
          <ProviderCarousel
            label={label}
            providers={providers}
            selectedProviderId={selectedProviderId}
            onSelectionChange={setSelectedProviderId}
            filters={filters}
            showStatusIndicators={true}
            allowDisconnectedSelection={true}
          />
        </div>

        {/* Selection Info */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold mb-4">Selected Provider Info</h3>
            {selectedProviderId ? (
              <div className="space-y-2">
                {(() => {
                  const selectedProvider = providers.find(p => p.id === selectedProviderId);
                  if (!selectedProvider) return <p>Provider not found</p>;
                  
                  return (
                    <>
                      <p><strong>ID:</strong> {selectedProvider.id}</p>
                      <p><strong>Name:</strong> {selectedProvider.displayName}</p>
                      <p><strong>Status:</strong> {selectedProvider.status}</p>
                      <p><strong>Capabilities:</strong> {
                        [
                          selectedProvider.capabilities.import && 'Import',
                          selectedProvider.capabilities.export && 'Export'
                        ].filter(Boolean).join(', ')
                      }</p>
                      <p><strong>Colors:</strong> {selectedProvider.colors.primary}</p>
                    </>
                  );
                })()}
              </div>
            ) : (
              <p>No provider selected</p>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-8">Carousel Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Infinite Navigation', desc: 'Seamless looping with any number of providers' },
              { title: 'Dynamic Theming', desc: 'Each provider brings its own brand colors' },
              { title: 'Responsive Design', desc: 'Works perfectly on all screen sizes' },
              { title: 'Status Indicators', desc: 'Shows connection status for each provider' },
              { title: 'Smart Filtering', desc: 'Filter by capabilities, status, or exclusions' },
              { title: 'Smooth Animations', desc: 'Framer Motion powered transitions' },
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}