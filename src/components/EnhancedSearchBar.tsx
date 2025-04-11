import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X, History, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { searchLocations, Suggestion } from '../services/mapbox';
import useDebounce from '../hooks/useDebounce';
import { toast } from 'sonner';
import { EnhancedInput } from './ui/enhanced-input';
import { EnhancedButton } from './ui/enhanced-button';
import { EnhancedBadge } from './ui/enhanced-badge';
import { Card } from './ui/enhanced-card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedSearchBarProps {
  onLocationChange?: (location: { latitude: number; longitude: number } | null) => void;
  onSearch?: (term: string) => void;
  isLoading?: boolean;
  className?: string;
}

// Popular cities for quick selection
const POPULAR_LOCATIONS = [
  { name: 'New York', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
  { name: 'Los Angeles', coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { name: 'Chicago', coordinates: { latitude: 41.8781, longitude: -87.6298 } },
  { name: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 } },
  { name: 'Miami', coordinates: { latitude: 25.7617, longitude: -80.1918 } },
  { name: 'Austin', coordinates: { latitude: 30.2672, longitude: -97.7431 } },
  { name: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
  { name: 'Denver', coordinates: { latitude: 39.7392, longitude: -104.9903 } }
];

// Maximum number of recent searches to store
const MAX_RECENT_SEARCHES = 5;

export default function EnhancedSearchBar({ 
  onLocationChange, 
  onSearch, 
  isLoading,
  className
}: EnhancedSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { location, loading: locationLoading, permissionDenied, getLocation } = useGeolocation();
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const [showPopularLocations, setShowPopularLocations] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Suggestion[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentLocationSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
        localStorage.removeItem('recentLocationSearches');
      }
    }
  }, []);

  // Save recent searches to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recentLocationSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Fetch location suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch suggestions if we have at least 2 characters and not using nearby
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || isNearbyActive) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        // Fetch location suggestions from Mapbox
        const results = await searchLocations(debouncedSearchTerm);

        // Log the results for debugging
        console.log(`Found ${results.length} location suggestions for "${debouncedSearchTerm}"`);

        // Update the suggestions state and show the dropdown
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm, isNearbyActive]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowPopularLocations(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle geolocation changes
  useEffect(() => {
    if (location && isNearbyActive) {
      // If we have a location and nearby search is active, call the onLocationChange callback
      onLocationChange?.(location);
      
      // Update search term to show current location
      setSearchTerm('Current Location');
      
      // Reset the nearby active state
      setIsNearbyActive(false);
    }
  }, [location, isNearbyActive, onLocationChange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      // Call the onSearch callback if provided
      onSearch?.(searchTerm);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Update the search term with the selected location name
    setSearchTerm(suggestion.place_name);
    
    // Hide the suggestions dropdown
    setShowSuggestions(false);
    setShowPopularLocations(false);
    
    // Call the onLocationChange callback with the selected coordinates
    if (suggestion.center && suggestion.center.length >= 2) {
      const [longitude, latitude] = suggestion.center;
      onLocationChange?.({ latitude, longitude });
      
      // Add to recent searches
      addToRecentSearches(suggestion);
    }
  };

  const handlePopularLocationClick = (location: typeof POPULAR_LOCATIONS[0]) => {
    // Update the search term with the selected location name
    setSearchTerm(location.name);
    
    // Hide the suggestions dropdown
    setShowSuggestions(false);
    setShowPopularLocations(false);
    
    // Call the onLocationChange callback with the selected coordinates
    onLocationChange?.(location.coordinates);
    
    // Add to recent searches
    addToRecentSearches({
      id: `popular-${location.name.toLowerCase().replace(/\s+/g, '-')}`,
      place_name: location.name,
      center: [location.coordinates.longitude, location.coordinates.latitude],
      place_type: ['place']
    });
  };

  const handleNearbyClick = () => {
    // Set nearby active state to true
    setIsNearbyActive(true);
    
    // Request the user's location
    getLocation();
    
    // Hide the suggestions dropdown
    setShowSuggestions(false);
    setShowPopularLocations(false);
  };

  const handleClearSearch = () => {
    // Clear the search term
    setSearchTerm('');
    
    // Hide the suggestions dropdown
    setShowSuggestions(false);
    setShowPopularLocations(false);
    
    // Call the onLocationChange callback with null to reset the location
    onLocationChange?.(null);
  };

  const addToRecentSearches = (suggestion: Suggestion) => {
    setRecentSearches(prev => {
      // Remove the suggestion if it already exists
      const filtered = prev.filter(item => item.id !== suggestion.id);
      
      // Add the new suggestion to the beginning of the array
      const updated = [suggestion, ...filtered];
      
      // Limit the number of recent searches
      return updated.slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentLocationSearches');
  };

  const togglePopularLocations = () => {
    setShowPopularLocations(prev => !prev);
    setShowSuggestions(false);
  };

  return (
    <div 
      ref={searchContainerRef} 
      className={cn(
        "relative z-50 w-full max-w-2xl mx-auto",
        className
      )}
    >
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <EnhancedInput
            type="text"
            placeholder="Search for a location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            icon={<Search className="h-4 w-4" />}
            clearable={!!searchTerm}
            onClear={handleClearSearch}
            className="w-full"
            variant="glass"
            rounded="full"
            aria-label="Search location"
          />
          
          <EnhancedButton
            type="button"
            variant="glass"
            size="icon"
            rounded="full"
            onClick={handleNearbyClick}
            disabled={locationLoading}
            title="Use my current location"
            className="flex-shrink-0"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </EnhancedButton>
          
          <EnhancedButton
            type="button"
            variant="glass"
            size="icon"
            rounded="full"
            onClick={togglePopularLocations}
            title={showPopularLocations ? "Hide popular locations" : "Show popular locations"}
            className="flex-shrink-0"
          >
            {showPopularLocations ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </EnhancedButton>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {(showSuggestions || showPopularLocations) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute w-full mt-2 z-50"
          >
            <Card variant="glass" className="max-h-80 overflow-y-auto p-2">
              {/* Loading indicator */}
              {isLoadingSuggestions && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Searching locations...</span>
                </div>
              )}
              
              {/* Popular Locations */}
              {showPopularLocations && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <h3 className="text-sm font-medium">Popular Cities</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {POPULAR_LOCATIONS.map((location) => (
                      <div
                        key={location.name}
                        className="flex items-center p-2 rounded-md hover:bg-primary/10 cursor-pointer transition-colors"
                        onClick={() => handlePopularLocationClick(location)}
                      >
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">{location.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && showSuggestions && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <h3 className="text-sm font-medium">Recent Searches</h3>
                    <button
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center p-2 rounded-md hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <History className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{search.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Location Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div>
                  <div className="px-2 py-1">
                    <h3 className="text-sm font-medium">Suggestions</h3>
                  </div>
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center p-2 rounded-md hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{suggestion.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {showSuggestions && !isLoadingSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <Compass className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">No locations found</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term or use one of the popular cities
                  </p>
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={togglePopularLocations}
                  >
                    Show Popular Cities
                  </EnhancedButton>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Permission Denied Warning */}
      {permissionDenied && (
        <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
          <p className="font-medium text-destructive">Location access denied</p>
          <p className="text-xs mt-1">
            Please enable location access in your browser settings to use the nearby search feature.
          </p>
        </div>
      )}
    </div>
  );
}
