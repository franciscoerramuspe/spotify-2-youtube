import { render, screen, fireEvent } from '@testing-library/react';
import ProviderCarousel from '../ProviderCarousel';
import { Provider } from '@/types/providers';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockProviders: Provider[] = [
  {
    id: 'spotify',
    name: 'spotify',
    displayName: 'Spotify',
    icon: '/spotify0.png',
    colors: {
      primary: '#1DB954',
      tailwind: { primary: 'green' },
    },
    status: 'connected',
    capabilities: { import: true, export: false },
  },
  {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube Music',
    icon: '/ytt.png',
    colors: {
      primary: '#FF0000',
      tailwind: { primary: 'red' },
    },
    status: 'connected',
    capabilities: { import: false, export: true },
  },
  {
    id: 'apple-music',
    name: 'apple-music',
    displayName: 'Apple Music',
    icon: '/apple-music.png',
    colors: {
      primary: '#FA2D48',
      tailwind: { primary: 'pink' },
    },
    status: 'available',
    capabilities: { import: true, export: true },
  },
];

describe('ProviderCarousel', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    mockOnSelectionChange.mockClear();
  });

  it('renders providers correctly', () => {
    render(
      <ProviderCarousel
        providers={mockProviders}
        selectedProviderId="spotify"
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByText('YouTube Music')).toBeInTheDocument();
  });

  it('filters providers by capability', () => {
    render(
      <ProviderCarousel
        providers={mockProviders}
        selectedProviderId="spotify"
        onSelectionChange={mockOnSelectionChange}
        filters={{ capability: 'import' }}
      />
    );

    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByText('Apple Music')).toBeInTheDocument();
    expect(screen.queryByText('YouTube Music')).not.toBeInTheDocument();
  });

  it('excludes specified providers', () => {
    render(
      <ProviderCarousel
        providers={mockProviders}
        selectedProviderId="youtube"
        onSelectionChange={mockOnSelectionChange}
        filters={{ exclude: ['spotify'] }}
      />
    );

    expect(screen.queryByText('Spotify')).not.toBeInTheDocument();
    expect(screen.getByText('YouTube Music')).toBeInTheDocument();
    expect(screen.getByText('Apple Music')).toBeInTheDocument();
  });

  it('handles empty provider list', () => {
    render(
      <ProviderCarousel
        providers={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('No providers available')).toBeInTheDocument();
  });

  it('navigates between providers', () => {
    render(
      <ProviderCarousel
        providers={mockProviders}
        selectedProviderId="spotify"
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const nextButton = screen.getByLabelText('Next provider');
    fireEvent.click(nextButton);

    expect(mockOnSelectionChange).toHaveBeenCalledWith('youtube');
  });

  it('shows status indicators when enabled', () => {
    render(
      <ProviderCarousel
        providers={mockProviders}
        selectedProviderId="spotify"
        onSelectionChange={mockOnSelectionChange}
        showStatusIndicators={true}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
});