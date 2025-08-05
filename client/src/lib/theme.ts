import { Provider } from '@/types/providers';

export const PROVIDER_THEME_CLASSES = {
  spotify: {
    card: {
      center: 'bg-gradient-to-br from-green-900/40 to-green-900/10 border-green-500/20 hover:border-green-500/50',
      side: 'bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-500/10 hover:border-green-500/30',
    },
    text: 'text-green-400',
    badge: 'bg-green-600/80 text-white',
    capability: 'bg-green-600/20 text-green-300',
    indicator: 'bg-green-500',
    dot: 'bg-green-500',
  },
  youtube: {
    card: {
      center: 'bg-gradient-to-br from-red-900/40 to-red-900/10 border-red-500/20 hover:border-red-500/50',
      side: 'bg-gradient-to-br from-red-900/20 to-red-900/5 border-red-500/10 hover:border-red-500/30',
    },
    text: 'text-red-400',
    badge: 'bg-red-600/80 text-white',
    capability: 'bg-red-600/20 text-red-300',
    indicator: 'bg-red-500',
    dot: 'bg-red-500',
  },
  'apple-music': {
    card: {
      center: 'bg-gradient-to-br from-pink-900/40 to-pink-900/10 border-pink-500/20 hover:border-pink-500/50',
      side: 'bg-gradient-to-br from-pink-900/20 to-pink-900/5 border-pink-500/10 hover:border-pink-500/30',
    },
    text: 'text-pink-400',
    badge: 'bg-pink-600/80 text-white',
    capability: 'bg-pink-600/20 text-pink-300',
    indicator: 'bg-pink-500',
    dot: 'bg-pink-500',
  },
  // Template for future providers
  default: {
    card: {
      center: 'bg-gradient-to-br from-gray-900/40 to-gray-900/10 border-gray-500/20 hover:border-gray-500/50',
      side: 'bg-gradient-to-br from-gray-900/20 to-gray-900/5 border-gray-500/10 hover:border-gray-500/30',
    },
    text: 'text-gray-400',
    badge: 'bg-gray-600/80 text-white',
    capability: 'bg-gray-600/20 text-gray-300',
    indicator: 'bg-gray-500',
    dot: 'bg-gray-500',
  },
} as const;

export function getProviderTheme(providerId: string) {
  return PROVIDER_THEME_CLASSES[providerId as keyof typeof PROVIDER_THEME_CLASSES] || PROVIDER_THEME_CLASSES.default;
}

export function getProviderStyles(provider: Provider) {
  const theme = getProviderTheme(provider.id);
  
  return {
    // Card styles
    centerCard: `relative transition-all duration-300 rounded-2xl border backdrop-blur-sm w-80 h-96 cursor-pointer ${theme.card.center}`,
    sideCard: `relative transition-all duration-300 rounded-2xl border backdrop-blur-sm w-64 h-80 cursor-pointer opacity-60 blur-[1px] hover:opacity-75 ${theme.card.side}`,
    disabledCard: 'cursor-not-allowed opacity-75',
    
    // Text styles
    title: theme.text,
    
    // Badge styles
    connectedBadge: theme.badge,
    availableBadge: 'bg-gray-600/80 text-white',
    
    // Capability badges
    capability: theme.capability,
    
    // Selection indicator
    indicator: theme.indicator,
    
    // Dot indicator
    dot: theme.dot,
  };
}