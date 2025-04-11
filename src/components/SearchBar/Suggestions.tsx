import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Suggestion } from '../../services/mapbox';

interface SuggestionsProps {
  isLoading: boolean;
  suggestions: Suggestion[];
  searchTerm: string;
  onSelect: (suggestion: Suggestion) => void;
  onUseCurrentLocation?: () => void;
}

export const Suggestions = ({ isLoading, suggestions, searchTerm, onSelect, onUseCurrentLocation }: SuggestionsProps) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        <p className="mt-2 text-sm">Loading suggestions...</p>
      </div>
    );
  }

  if (suggestions.length > 0 || onUseCurrentLocation) {
    return (
      <div className="py-1">
        {onUseCurrentLocation && (
          <button
            onClick={onUseCurrentLocation}
            className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 text-white transition-all flex items-center gap-3 group border-b border-zinc-800/50"
          >
            <MapPin className="h-4 w-4 text-green-400 group-hover:text-green-300 transition-colors flex-shrink-0" />
            <span className="line-clamp-1 text-sm sm:text-base group-hover:text-green-300 transition-colors">
              Use my current location
            </span>
          </button>
        )}
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 text-white transition-all flex items-center gap-3 group"
          >
            <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            <span className="line-clamp-1 text-sm sm:text-base group-hover:text-blue-400 transition-colors">
              {suggestion.place_name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (searchTerm.length >= 2) {
    return (
      <div className="p-4 text-center text-zinc-400">
        <p>No locations found</p>
      </div>
    );
  }

  return null;
};
