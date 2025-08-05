export interface Provider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  colors: {
    primary: string;
    secondary?: string;
    tailwind: {
      primary: string;
      secondary?: string;
    };
  };
  status: 'connected' | 'available' | 'unavailable';
  capabilities: {
    import: boolean;
    export: boolean;
  };
  authProvider?: string;
  apiQuota?: {
    daily?: number;
    hourly?: number;
    remaining?: number;
  };
}

export interface ProviderCarouselProps {
  label?: string;
  providers: Provider[];
  selectedProviderId?: string;
  onSelectionChange: (providerId: string) => void;
  filters?: {
    capability?: 'import' | 'export';
    status?: 'connected' | 'available';
    exclude?: string[];
  };
  showStatusIndicators?: boolean;
  allowDisconnectedSelection?: boolean;
}