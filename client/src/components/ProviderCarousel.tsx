"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider, ProviderCarouselProps } from '@/types/providers';
import { filterProviders, getProviderById } from '@/lib/providers';
import { getProviderStyles } from '@/lib/theme';

export default function ProviderCarousel({
  label = "Select Provider",
  providers,
  selectedProviderId,
  onSelectionChange,
  filters,
  showStatusIndicators = true,
  allowDisconnectedSelection = false,
}: ProviderCarouselProps) {
  // Filter providers based on criteria
  const filteredProviders = useMemo(() => 
    filterProviders(providers, filters), 
    [providers, filters]
  );

  // Find current index based on selected provider
  const getCurrentIndex = () => {
    if (!selectedProviderId) return 0;
    const index = filteredProviders.findIndex(p => p.id === selectedProviderId);
    return index >= 0 ? index : 0;
  };

  const [currentIndex, setCurrentIndex] = useState(getCurrentIndex);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const prevIndexRef = useRef(currentIndex);

  // Update index when selectedProviderId changes
  useEffect(() => {
    const newIndex = getCurrentIndex();
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      prevIndexRef.current = newIndex;
    }
  }, [selectedProviderId, filteredProviders]);

  // Handle empty providers
  if (filteredProviders.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-400">No providers available</p>
      </div>
    );
  }

  // Navigation helpers with infinite looping
  const getPreviousIndex = (index: number) => 
    (index - 1 + filteredProviders.length) % filteredProviders.length;
  
  const getNextIndex = (index: number) => 
    (index + 1) % filteredProviders.length;

  const navigatePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = getPreviousIndex(currentIndex);
    setDirection('right'); // Moving to previous = slide right
    setCurrentIndex(newIndex);
    prevIndexRef.current = newIndex;
    // Don't auto-select when navigating, only update visual state
  };

  const navigateNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = getNextIndex(currentIndex);
    setDirection('left'); // Moving to next = slide left
    setCurrentIndex(newIndex);
    prevIndexRef.current = newIndex;
    // Don't auto-select when navigating, only update visual state
  };

  const handleProviderClick = (providerId: string) => {
    const provider = getProviderById(providerId, filteredProviders);
    if (!provider) return;

    // Check if selection is allowed
    if (!allowDisconnectedSelection && provider.status !== 'connected') {
      return;
    }

    onSelectionChange(providerId);
  };

  // Separate method for selecting the currently displayed provider
  const selectCurrentProvider = () => {
    const currentProvider = filteredProviders[currentIndex];
    if (currentProvider) {
      handleProviderClick(currentProvider.id);
    }
  };

  // Get providers for display (previous, current, next)
  const getDisplayProviders = () => {
    if (filteredProviders.length === 1) {
      return { previous: null, current: filteredProviders[0], next: null };
    }

    if (filteredProviders.length === 2) {
      const other = filteredProviders[currentIndex === 0 ? 1 : 0];
      return {
        previous: null,
        current: filteredProviders[currentIndex],
        next: other,
      };
    }

    return {
      previous: filteredProviders[getPreviousIndex(currentIndex)],
      current: filteredProviders[currentIndex],
      next: filteredProviders[getNextIndex(currentIndex)],
    };
  };

  const { previous, current, next } = getDisplayProviders();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Label */}
      {label && (
        <h2 className="text-2xl font-semibold text-center mb-8 text-white">
          {label}
        </h2>
      )}

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {filteredProviders.length > 1 && (
          <>
            <button
              onClick={navigatePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/10"
              aria-label="Previous provider"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={navigateNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/10"
              aria-label="Next provider"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}

        {/* Provider Cards Container */}
        <div className="flex items-center justify-center px-16 py-8 overflow-hidden">
          <motion.div
            key={`${currentIndex}-${direction}`}
            className="flex items-center justify-center space-x-8"
            initial={direction ? { 
              x: direction === 'left' ? 300 : -300,
              opacity: 0.8 
            } : false}
            animate={{ 
              x: 0,
              opacity: 1 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
          >
              {/* Previous Provider */}
              {previous && filteredProviders.length > 1 && (
                <ProviderCard
                  provider={previous}
                  isSelected={false}
                  onClick={() => {
                    setDirection('right');
                    const newIndex = getPreviousIndex(currentIndex);
                    setCurrentIndex(newIndex);
                    prevIndexRef.current = newIndex;
                    handleProviderClick(previous.id);
                  }}
                  showStatusIndicators={showStatusIndicators}
                  allowDisconnectedSelection={allowDisconnectedSelection}
                  variant="side"
                />
              )}

              {/* Current Provider */}
              <div className="relative">
                <ProviderCard
                  provider={current}
                  isSelected={selectedProviderId === current.id}
                  onClick={() => handleProviderClick(current.id)}
                  showStatusIndicators={showStatusIndicators}
                  allowDisconnectedSelection={allowDisconnectedSelection}
                  variant="center"
                />
              </div>

              {/* Next Provider */}
              {next && filteredProviders.length > 1 && (
                <ProviderCard
                  provider={next}
                  isSelected={false}
                  onClick={() => {
                    setDirection('left');
                    const newIndex = getNextIndex(currentIndex);
                    setCurrentIndex(newIndex);
                    prevIndexRef.current = newIndex;
                    handleProviderClick(next.id);
                  }}
                  showStatusIndicators={showStatusIndicators}
                  allowDisconnectedSelection={allowDisconnectedSelection}
                  variant="side"
                />
              )}
            </motion.div>
        </div>

        {/* Provider Count Indicator */}
        {filteredProviders.length > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {filteredProviders.map((_, index) => {
              const styles = getProviderStyles(current);
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (index !== currentIndex) {
                      // Determine direction for dot navigation
                      setDirection(index > currentIndex ? 'left' : 'right');
                      setCurrentIndex(index);
                      prevIndexRef.current = index;
                      onSelectionChange(filteredProviders[index].id);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? styles.dot
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to ${filteredProviders[index].displayName}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: Provider;
  isSelected: boolean;
  onClick: () => void;
  showStatusIndicators: boolean;
  allowDisconnectedSelection: boolean;
  variant: 'center' | 'side';
}

function ProviderCard({
  provider,
  isSelected,
  onClick,
  showStatusIndicators,
  allowDisconnectedSelection,
  variant,
}: ProviderCardProps) {
  const isClickable = allowDisconnectedSelection || provider.status === 'connected';
  const isCenter = variant === 'center';
  const styles = getProviderStyles(provider);

  // Get card styles based on variant and clickability
  const getCardStyles = () => {
    let cardClass = isCenter ? styles.centerCard : styles.sideCard;
    if (!isClickable) {
      cardClass += ` ${styles.disabledCard}`;
    }
    return cardClass;
  };

  return (
    <motion.div
      className={getCardStyles()}
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: isCenter ? 1.02 : 1.05 } : {}}
      whileTap={isClickable ? { scale: isCenter ? 0.98 : 1.02 } : {}}
    >
      {/* Status Indicator */}
      {showStatusIndicators && (
        <div className="absolute top-4 right-4 z-10">
          {provider.status === 'connected' ? (
            <div className={`flex items-center space-x-1 ${styles.connectedBadge} px-2 py-1 rounded-full text-xs`}>
              <Check className="h-3 w-3" />
              <span>Connected</span>
            </div>
          ) : (
            <div className={`flex items-center space-x-1 ${styles.availableBadge} px-2 py-1 rounded-full text-xs`}>
              <span>Available</span>
            </div>
          )}
        </div>
      )}

      {/* Provider Content */}
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        {/* Provider Icon */}
        <div className={`mb-6 ${isCenter ? 'w-24 h-24' : 'w-16 h-16'}`}>
          <img
            src={provider.icon}
            alt={`${provider.displayName} logo`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Provider Name */}
        <h3 className={`font-semibold ${styles.title} mb-3 ${
          isCenter ? 'text-2xl' : 'text-xl'
        }`}>
          {provider.displayName}
        </h3>

        {/* Capabilities */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {provider.capabilities.import && (
            <span className={`px-2 py-1 ${styles.capability} rounded-full text-xs`}>
              Import
            </span>
          )}
          {provider.capabilities.export && (
            <span className={`px-2 py-1 ${styles.capability} rounded-full text-xs`}>
              Export
            </span>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className={`w-3 h-3 ${styles.indicator} rounded-full`} />
        )}
      </div>
    </motion.div>
  );
}