import { Provider } from '@/types/providers';

export const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'spotify',
    name: 'spotify',
    displayName: 'Spotify',
    icon: '/spotify0.png',
    colors: {
      primary: '#1DB954',
      tailwind: {
        primary: 'green',
      },
    },
    status: 'available',
    capabilities: {
      import: true,
      export: true,
    },
    authProvider: 'spotify',
  },
  {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube Music',
    icon: '/ytt.png',
    colors: {
      primary: '#FF0000',
      tailwind: {
        primary: 'red',
      },
    },
    status: 'available',
    capabilities: {
      import: true,
      export: true,
    },
    authProvider: 'google',
  },
  {
    id: 'apple-music',
    name: 'apple-music',
    displayName: 'Apple Music',
    icon: '/apple-music.png',
    colors: {
      primary: '#FA2D48',
      secondary: '#FF6B82',
      tailwind: {
        primary: 'pink',
        secondary: 'rose',
      },
    },
    status: 'available',
    capabilities: {
      import: true,
      export: true,
    },
  },
];

export function getProviderById(providerId: string, providers: Provider[] = DEFAULT_PROVIDERS): Provider | undefined {
  return providers.find(provider => provider.id === providerId);
}

export function filterProviders(
  providers: Provider[],
  filters?: {
    capability?: 'import' | 'export';
    status?: 'connected' | 'available';
    exclude?: string[];
  }
): Provider[] {
  if (!filters) return providers;

  return providers.filter(provider => {
    // Filter by capability
    if (filters.capability && !provider.capabilities[filters.capability]) {
      return false;
    }

    // Filter by status
    if (filters.status && provider.status !== filters.status) {
      return false;
    }

    // Exclude specific providers
    if (filters.exclude && filters.exclude.includes(provider.id)) {
      return false;
    }

    return true;
  });
}

export function updateProviderStatus(
  providers: Provider[],
  providerId: string,
  status: Provider['status']
): Provider[] {
  return providers.map(provider =>
    provider.id === providerId
      ? { ...provider, status }
      : provider
  );
}

// Helper to get provider connection status from session
export function getProviderConnectionStatus(
  providerId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
): Provider['status'] {
  switch (providerId) {
    case 'spotify':
      return session?.spotifyAccessToken ? 'connected' : 'available';
    case 'youtube':
      return session?.googleAccessToken ? 'connected' : 'available';
    case 'apple-music':
      // Apple Music would need its own auth implementation
      return 'available';
    default:
      return 'available';
  }
}