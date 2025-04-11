import React from 'react';
import { Filter } from '../types';
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@nextui-org/react";
import { UNIFIED_CATEGORIES } from '@/services/events';

interface FilterPanelProps {
  filters: Filter; // Use the imported Filter type directly
  onFilterChange: (key: keyof Filter, value: string | number | string[] | undefined) => void; // Use keyof Filter and allow undefined for clearing filters
}

const FilterPanel = ({ filters, onFilterChange }: FilterPanelProps) => {

  return (
    <div className="p-4 space-y-6 bg-black/50 backdrop-blur-md rounded-lg">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Category</label>
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange('category', value)}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20">
              <SelectValue placeholder="All Events" className="text-white" />
            </SelectTrigger>
            <SelectContent className="bg-background text-white">
              {Object.entries(UNIFIED_CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Date Range</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['Today', 'Tomorrow', 'This Weekend', 'This Week', 'This Month'].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={filters.dateRange === range.toLowerCase() ? "shadow" : "light"}
                color={filters.dateRange === range.toLowerCase() ? "primary" : "default"}
                className="text-sm font-medium text-white"
                onClick={() => onFilterChange('dateRange', range.toLowerCase())}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Price Range</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['Free', 'Under $25', '$25-$50', '$50-$100', '$100+'].map((range) => (
              <Button
                key={range}
                size="sm"
                variant={filters.priceRange === range.toLowerCase() ? "shadow" : "light"}
                color={filters.priceRange === range.toLowerCase() ? "primary" : "default"}
                className="text-sm font-medium text-white"
                onClick={() => onFilterChange('priceRange', range.toLowerCase())}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Distance: {filters.distance} miles
          </label>
          <Slider
            defaultValue={[filters.distance]}
            value={[filters.distance]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => onFilterChange('distance', value[0])}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-sm text-white/70">
            <span>1 mile</span>
            <span>50 miles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
