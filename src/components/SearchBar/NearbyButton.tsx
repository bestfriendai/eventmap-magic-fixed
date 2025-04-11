import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface NearbyButtonProps {
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const NearbyButton = ({ isActive, isLoading, onClick }: NearbyButtonProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4 border-l border-zinc-800/50 pl-2 sm:pl-4">
      <button 
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg transition-all ${
          isActive 
            ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10' 
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
        <span className="text-xs sm:text-sm hidden sm:inline">
          {isLoading ? 'Locating...' : 'Nearby'}
        </span>
      </button>
    </div>
  );
};