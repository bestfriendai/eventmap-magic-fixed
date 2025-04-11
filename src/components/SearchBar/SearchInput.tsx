import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  searchTerm: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onClear: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SearchInput = ({ searchTerm, onChange, onFocus, onClear, onSubmit }: SearchInputProps) => {
  return (
    <form onSubmit={onSubmit} className="flex items-center px-3 sm:px-6 h-12 sm:h-16">
      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" />
      <input
        type="text"
        placeholder="Search for location..."
        value={searchTerm}
        onChange={onChange}
        onFocus={onFocus}
        className="flex-1 bg-transparent border-none text-white px-2 sm:px-4 py-2 placeholder-zinc-500 focus:outline-none text-base sm:text-lg transition-colors"
        autoComplete="off"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={onClear}
          className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800/50 transition-all"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </form>
  );
};