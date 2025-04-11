import React, { useState, useMemo, useEffect } from 'react';
import { Event, Filter } from '../types';
import { 
  Filter as FilterIcon, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  CalendarDays,
  Tag,
  Sliders
} from 'lucide-react';
import { EnhancedButton } from './ui/enhanced-button';
import { EnhancedBadge } from './ui/enhanced-badge';
import { EnhancedInput } from './ui/enhanced-input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/enhanced-card';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedEventSidebarProps {
  events: Event[];
  loading: boolean;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  className?: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Events' },
  { value: 'live-music', label: 'Live Music' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'social', label: 'Social' },
  { value: 'educational', label: 'Educational' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'special', label: 'Special Events' }
];

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'weekend', label: 'This Weekend' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'next-month', label: 'Next Month' }
];

const PRICE_RANGES = [
  { value: 'all', label: 'Any Price' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'under-25', label: 'Under $25' },
  { value: 'under-50', label: 'Under $50' },
  { value: 'under-100', label: 'Under $100' },
  { value: 'premium', label: '$100+' }
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date (Soonest)' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'distance', label: 'Distance (Closest)' },
  { value: 'price-low', label: 'Price (Low to High)' },
  { value: 'price-high', label: 'Price (High to Low)' }
];

const EnhancedEventSidebar = ({ 
  events, 
  loading, 
  selectedEvent, 
  onEventSelect,
  className
}: EnhancedEventSidebarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [filters, setFilters] = useState<Filter>({
    category: 'all',
    dateRange: 'all',
    priceRange: 'all',
    distance: 30
  });

  // Reset selected event when events change
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      onEventSelect(events[0]);
    }
  }, [events, selectedEvent, onEventSelect]);

  const handleFilterChange = (key: keyof Filter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.venue.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(event => 
        event.categories.some(cat => cat.toLowerCase().includes(filters.category as string))
      );
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const thisWeekEnd = new Date(now);
      thisWeekEnd.setDate(now.getDate() + (7 - now.getDay()));
      
      const weekend = new Date(now);
      weekend.setDate(now.getDate() + (6 - now.getDay()) % 7);
      const weekendEnd = new Date(weekend);
      weekendEnd.setDate(weekend.getDate() + 1);
      
      const nextWeekStart = new Date(thisWeekEnd);
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        
        switch (filters.dateRange) {
          case 'today':
            return eventDate.getTime() === now.getTime();
          case 'tomorrow':
            return eventDate.getTime() === tomorrow.getTime();
          case 'this-week':
            return eventDate >= now && eventDate <= thisWeekEnd;
          case 'weekend':
            return eventDate >= weekend && eventDate <= weekendEnd;
          case 'next-week':
            return eventDate >= nextWeekStart && eventDate <= nextWeekEnd;
          case 'this-month':
            return eventDate >= now && eventDate <= thisMonthEnd;
          case 'next-month':
            return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
          default:
            return true;
        }
      });
    }

    // Apply price filter
    if (filters.priceRange && filters.priceRange !== 'all') {
      filtered = filtered.filter(event => {
        const price = event.price;
        
        // Handle events with no price information
        if (price === undefined || price === null) {
          return filters.priceRange === 'all';
        }
        
        switch (filters.priceRange) {
          case 'free':
            return price === 0;
          case 'paid':
            return price > 0;
          case 'under-25':
            return price > 0 && price < 25;
          case 'under-50':
            return price > 0 && price < 50;
          case 'under-100':
            return price > 0 && price < 100;
          case 'premium':
            return price >= 100;
          default:
            return true;
        }
      });
    }

    // Apply distance filter
    if (filters.distance) {
      filtered = filtered.filter(event => {
        if (!event.distance) return true;
        return event.distance <= filters.distance;
      });
    }

    // Sort events
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'price-low':
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case 'price-high':
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        default:
          return 0;
      }
    });
  }, [events, filters, sortBy, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Check if it's already in a time format
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }
      
      // Otherwise, try to parse it as a date
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeString;
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 10 ? `${distance.toFixed(1)} mi` : `${Math.round(distance)} mi`;
  };

  const renderEventCard = (event: Event) => {
    const isSelected = selectedEvent?.id === event.id;
    
    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        layout
      >
        <Card 
          variant={isSelected ? "gradient" : "default"}
          hover="lift"
          className={cn(
            "cursor-pointer transition-all duration-200 overflow-hidden",
            isSelected ? "border-primary" : "border-border"
          )}
          onClick={() => onEventSelect(event)}
        >
          <div className="flex">
            {/* Event image or icon */}
            <div className="w-24 h-24 bg-muted flex items-center justify-center relative overflow-hidden">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                  {event.categories && event.categories[0] ? (
                    getCategoryIcon(event.categories[0])
                  ) : (
                    '📅'
                  )}
                </div>
              )}
            </div>
            
            {/* Event details */}
            <div className="flex-1 p-3">
              <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
              
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{formatDate(event.date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{formatTime(event.time)}</span>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{event.venue}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  {event.price !== undefined && event.price !== null ? (
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{event.price === 0 ? 'Free' : `$${event.price}`}</span>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  {event.distance && (
                    <EnhancedBadge variant="secondary" size="sm">
                      {formatDistance(event.distance)}
                    </EnhancedBadge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderSkeletonCard = (index: number) => (
    <Card key={`skeleton-${index}`} className="overflow-hidden">
      <div className="flex">
        <Skeleton className="w-24 h-24" />
        <div className="flex-1 p-3">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </Card>
  );

  const getCategoryIcon = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('music')) return '🎵';
    if (lowerCategory.includes('comedy')) return '😄';
    if (lowerCategory.includes('sport')) return '⚽';
    if (lowerCategory.includes('art')) return '🎨';
    if (lowerCategory.includes('theatre') || lowerCategory.includes('theater')) return '🎭';
    if (lowerCategory.includes('food') || lowerCategory.includes('drink')) return '🍽️';
    if (lowerCategory.includes('cultural')) return '🏛️';
    if (lowerCategory.includes('social') || lowerCategory.includes('community')) return '👥';
    if (lowerCategory.includes('education')) return '📚';
    if (lowerCategory.includes('outdoor')) return '🌲';
    if (lowerCategory.includes('festival')) return '🎪';
    if (lowerCategory.includes('film') || lowerCategory.includes('movie')) return '🎬';
    
    return '✨'; // Default icon
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Events</h2>
          <div className="flex items-center gap-2">
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              leftIcon={<FilterIcon className="h-4 w-4" />}
            >
              Filter
            </EnhancedButton>
          </div>
        </div>
        
        <EnhancedInput
          placeholder="Search events..."
          icon={<Search className="h-4 w-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearable
          onClear={() => setSearchQuery('')}
          className="w-full"
        />
      </div>
      
      {/* Filters Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-4 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <Tag className="w-4 h-4 mr-2" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <EnhancedBadge
                      key={category.value}
                      variant={filters.category === category.value ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('category', category.value)}
                    >
                      {category.label}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {DATE_RANGES.map(range => (
                    <EnhancedBadge
                      key={range.value}
                      variant={filters.dateRange === range.value ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('dateRange', range.value)}
                    >
                      {range.label}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>
              
              {/* Price Range Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Price
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map(range => (
                    <EnhancedBadge
                      key={range.value}
                      variant={filters.priceRange === range.value ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('priceRange', range.value)}
                    >
                      {range.label}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>
              
              {/* Distance Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Distance (miles)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium w-8 text-center">
                    {filters.distance}
                  </span>
                </div>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map(option => (
                    <EnhancedBadge
                      key={option.value}
                      variant={sortBy === option.value ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSortBy(option.value)}
                    >
                      {option.label}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>
              
              {/* Reset Filters */}
              <div className="flex justify-end">
                <EnhancedButton
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      category: 'all',
                      dateRange: 'all',
                      priceRange: 'all',
                      distance: 30
                    });
                    setSortBy('date');
                  }}
                >
                  Reset Filters
                </EnhancedButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => renderSkeletonCard(index))
        ) : filteredAndSortedEvents.length > 0 ? (
          // Event cards
          <AnimatePresence>
            {filteredAndSortedEvents.map(event => renderEventCard(event))}
          </AnimatePresence>
        ) : (
          // No events message
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery ? 
                `No events match "${searchQuery}"` : 
                "Try adjusting your filters to see more events"}
            </p>
            <EnhancedButton
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  category: 'all',
                  dateRange: 'all',
                  priceRange: 'all',
                  distance: 30
                });
              }}
            >
              Reset Filters
            </EnhancedButton>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <span>
          {filteredAndSortedEvents.length} 
          {filteredAndSortedEvents.length === 1 ? ' event' : ' events'} found
        </span>
        {isFilterOpen ? (
          <button 
            onClick={() => setIsFilterOpen(false)}
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Hide Filters
          </button>
        ) : (
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Show Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedEventSidebar;
