"use client";

import { useSearchParams } from 'next/navigation';
import { DEFAULT_PROVIDERS } from '@/lib/providers';

export default function DebugPage() {
  const searchParams = useSearchParams();
  
  const sourceParam = searchParams.get('source');
  const destinationParam = searchParams.get('destination');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Debug URL Parameters</h1>
      
      <div className="space-y-4 mb-8">
        <p><strong>Source Param:</strong> {sourceParam || 'null'}</p>
        <p><strong>Destination Param:</strong> {destinationParam || 'null'}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Providers:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEFAULT_PROVIDERS.map(provider => (
            <div key={provider.id} className="border border-gray-600 rounded p-4">
              <h3 className="font-semibold">{provider.displayName}</h3>
              <p className="text-sm text-gray-400">ID: {provider.id}</p>
              <p className="text-sm">
                Import: {provider.capabilities.import ? '✅' : '❌'} | 
                Export: {provider.capabilities.export ? '✅' : '❌'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test URLs:</h2>
        <div className="space-y-2">
          <a href="/debug" className="block text-blue-400 hover:text-blue-300">
            /debug (no params)
          </a>
          <a href="/debug?source=spotify" className="block text-blue-400 hover:text-blue-300">
            /debug?source=spotify
          </a>
          <a href="/debug?source=spotify&destination=youtube" className="block text-blue-400 hover:text-blue-300">
            /debug?source=spotify&destination=youtube
          </a>
          <a href="/debug?source=apple-music&destination=youtube" className="block text-blue-400 hover:text-blue-300">
            /debug?source=apple-music&destination=youtube
          </a>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Validation Results:</h2>
        <div className="space-y-2">
          <p>
            <strong>Source Valid:</strong> {
              sourceParam && DEFAULT_PROVIDERS.find(p => p.id === sourceParam && p.capabilities.import) 
                ? '✅ Valid' 
                : '❌ Invalid or missing'
            }
          </p>
          <p>
            <strong>Destination Valid:</strong> {
              destinationParam && DEFAULT_PROVIDERS.find(p => p.id === destinationParam && p.capabilities.export && p.id !== sourceParam) 
                ? '✅ Valid' 
                : '❌ Invalid or missing'
            }
          </p>
        </div>
      </div>
    </div>
  );
}