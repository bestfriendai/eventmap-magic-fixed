import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
// Remove unused import
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchLocations, Suggestion } from '../../services/mapbox';
import useDebounce from '../../hooks/useDebounce';
import { SearchInput } from './SearchInput';
import { NearbyButton } from './NearbyButton';
import { Suggestions } from './Suggestions';

interface SearchBarProps {
  onLocationChange?: (location: { latitude: number; longitude: number } | null) => void;
  onSearch: (term: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onLocationChange, onSearch, isLoading }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { location, loading: locationLoading, getLocation } = useGeolocation();
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || isNearbyActive) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchLocations(debouncedSearchTerm);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location && !location.error && isNearbyActive) {
      const serializedLocation = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      onLocationChange?.(serializedLocation);
      setSearchTerm('Current Location');
    }
  }, [location, onLocationChange, isNearbyActive]);

  const handleNearbyClick = () => {
    if (isNearbyActive) {
      setIsNearbyActive(false);
      onLocationChange?.(null);
      setSearchTerm('');
      return;
    }

    setIsNearbyActive(true);
    getLocation();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const serializedLocation = {
      latitude: suggestion.center[1],
      longitude: suggestion.center[0]
    };
    
    setSearchTerm(suggestion.place_name);
    setShowSuggestions(false);
    onLocationChange?.(serializedLocation);
    onSearch(suggestion.place_name);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const firstSuggestion = suggestions[0];
      handleSuggestionClick(firstSuggestion);
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationChange?.(null);
    setIsNearbyActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsNearbyActive(false);
    if (value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 && !isNearbyActive) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="flex-1 bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-800/50 transition-all duration-300 hover:border-zinc-700/50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:rounded-3xl">
        <div className="flex items-center">
          <SearchInput
            searchTerm={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onClear={clearSearch}
            onSubmit={handleSearchSubmit}
          />
          <NearbyButton
            isActive={isNearbyActive}
            isLoading={locationLoading}
            onClick={handleNearbyClick}
          />
        </div>

        {showSuggestions && !isNearbyActive && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-black/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl z-50">
            <Suggestions
              isLoading={isLoadingSuggestions}
              suggestions={suggestions}
              searchTerm={searchTerm}
              onSelect={handleSuggestionClick}
              onUseCurrentLocation={handleNearbyClick}
            />
          </div>
        )}
      </div>
      <button 
        onClick={handleSearchSubmit}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-8 h-12 sm:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:active:scale-100"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
        ) : (
          <Search className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>
    </div>
  );
}
