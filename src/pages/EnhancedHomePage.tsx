import React, { useState, useCallback, useEffect } from 'react';
import EnhancedMap from '@/components/EnhancedMap';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import { Event, Filter } from '@/types';
import { searchAllEvents } from '@/services/events';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Search, 
  Filter as FilterIcon, 
  X, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  ArrowUpDown,
  Compass,
  Sparkles,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedBadge } from '@/components/ui/enhanced-badge';
import { Card, CardContent } from '@/components/ui/enhanced-card';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/hooks/useLocation';
import LoadingState from '@/components/layout/LoadingState';
import EmptyState from '@/components/layout/EmptyState';
import { cn } from '@/lib/utils';

type SortOption = 'date' | 'title' | 'distance';

// Helper function to calculate distance between two coordinates in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

export default function EnhancedHomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEventList, setShowEventList] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Get user location from browser
  const { location: userLocation, isLoading: locationLoading, error: locationError } = useLocation();
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Type the state and initialize according to Filter type
  const [currentFilters, setCurrentFilters] = useState<Filter>({
    category: undefined,
    dateRange: undefined,
    distance: 30,
    priceRange: undefined,
  });

  const fetchEvents = useCallback(async () => {
    // Prioritize searchLocation (from search bar) over userLocation (from browser)
    const location = searchLocation || userLocation;
    if (!location) {
      console.log('No location available for fetching events');
      return;
    }

    // Log the location being used
    const locationSource = searchLocation ? 'search bar' : 'browser geolocation';
    console.log(`Fetching events for location from ${locationSource}`);

    setIsLoading(true);

    try {
      // Make the API call to search for events
      const fetchedEvents = await searchAllEvents({
        latitude: location.latitude,
        longitude: location.longitude,
        filters: currentFilters,
        keyword: "local events" // Provide a default keyword to avoid fallback to 'events'
      });

      console.log(`Total events found: ${fetchedEvents.length} near location`);

      // Calculate distance for each event
      const eventsWithDistance = fetchedEvents.map(event => ({
        ...event,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          event.latitude,
          event.longitude
        )
      }));

      // Sort events by distance
      eventsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setEvents(eventsWithDistance);

      // Show a success message
      if (fetchedEvents.length > 0) {
        toast.success(`Found ${fetchedEvents.length} events near you!`);
      } else {
        toast.info('No events found nearby. Try expanding your search radius.');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchLocation, userLocation, currentFilters]);

  // Effect to fetch events when location changes
  useEffect(() => {
    if (searchLocation) {
      // User has explicitly searched for a location
      console.log('USING SEARCH LOCATION FOR EVENTS:', searchLocation);
      fetchEvents();
    } else if (userLocation && !locationLoading) {
      // Use browser geolocation if available and no search location is set
      if (userLocation.latitude === 0 && userLocation.longitude === 0) {
        console.error('Invalid user location (0,0) - not fetching events');
        toast.error('Could not determine your location. Please use the search bar or try the "Nearby" button.');
        return;
      }

      console.log('USING BROWSER GEOLOCATION FOR EVENTS:', userLocation);
      fetchEvents();
    }
  }, [fetchEvents, searchLocation, userLocation, locationLoading]);

  // Initial load effect - runs once when component mounts
  useEffect(() => {
    // Show a loading message
    toast.loading('Finding your location...', { id: 'location-loading' });

    // Set a timeout to check if we have a location after 3 seconds
    const timeoutId = setTimeout(() => {
      if (!userLocation && !searchLocation) {
        toast.error('Could not determine your location. Please use the search bar or try the "Nearby" button.', { id: 'location-loading' });
      } else {
        toast.success('Location found!', { id: 'location-loading' });
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [userLocation, searchLocation]);

  // Effect to handle when user location becomes available
  useEffect(() => {
    if (userLocation && !searchLocation && !isLoading) {
      console.log('User location available, fetching events:', userLocation);
      fetchEvents();
    }
  }, [userLocation, searchLocation, isLoading, fetchEvents]);

  const handleSearch = useCallback((term: string) => {
    console.log('Search term:', term);
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setCurrentFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    console.log('Location changed in HomePage:', location);

    // If location is null (cleared), fall back to user location
    if (!location && userLocation) {
      console.log('Search location cleared, falling back to user location:', userLocation);
      // We're setting searchLocation to null, which will cause the useEffect to use userLocation
    }

    setSearchLocation(location);
  }, [userLocation]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'date':
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      case 'title':
        return a.title.localeCompare(b.title) * multiplier;
      case 'distance':
        return ((a.distance || Infinity) - (b.distance || Infinity)) * multiplier;
      default:
        return 0;
    }
  });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowEventList(!isFullscreen);
  };

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

  return (
    <PageLayout fullWidth animate={false}>
      <div className="h-[calc(100vh-64px)] w-full flex">
        {/* Event List Panel */}
        <AnimatePresence>
          {showEventList && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full md:w-[400px] bg-card/95 backdrop-blur-xl border-r border-border z-30 relative"
            >
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Events</h1>
                    <EnhancedButton
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowEventList(false)}
                      className="md:hidden"
                    >
                      <X className="w-4 h-4" />
                    </EnhancedButton>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <EnhancedButton
                      variant={showFilters ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      leftIcon={showFilters ? <X className="w-4 h-4" /> : <FilterIcon className="w-4 h-4" />}
                    >
                      Filters
                    </EnhancedButton>
                    
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      onClick={fetchEvents}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                      disabled={isLoading}
                    >
                      Refresh
                    </EnhancedButton>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <EnhancedBadge
                      variant={sortBy === 'date' ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleSort('date')}
                      icon={sortBy === 'date' ? <ArrowUpDown className="w-3 h-3" /> : undefined}
                    >
                      Date
                    </EnhancedBadge>
                    
                    <EnhancedBadge
                      variant={sortBy === 'title' ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleSort('title')}
                      icon={sortBy === 'title' ? <ArrowUpDown className="w-3 h-3" /> : undefined}
                    >
                      Name
                    </EnhancedBadge>
                    
                    <EnhancedBadge
                      variant={sortBy === 'distance' ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleSort('distance')}
                      icon={sortBy === 'distance' ? <ArrowUpDown className="w-3 h-3" /> : undefined}
                    >
                      Distance
                    </EnhancedBadge>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="space-y-4">
                          {/* Category Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                              {['All', 'Music', 'Sports', 'Arts', 'Food', 'Outdoor'].map(category => (
                                <EnhancedBadge
                                  key={category}
                                  variant={currentFilters.category === category.toLowerCase() ? "primary" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => handleFilterChange('category', category === 'All' ? undefined : category.toLowerCase())}
                                >
                                  {category}
                                </EnhancedBadge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Date Range Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Date</label>
                            <div className="flex flex-wrap gap-2">
                              {['All', 'Today', 'Tomorrow', 'This Week', 'Weekend', 'Next Week'].map(range => (
                                <EnhancedBadge
                                  key={range}
                                  variant={currentFilters.dateRange === range.toLowerCase().replace(' ', '-') ? "primary" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => handleFilterChange('dateRange', range === 'All' ? undefined : range.toLowerCase().replace(' ', '-'))}
                                >
                                  {range}
                                </EnhancedBadge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Distance Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Distance (miles)</label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min="5"
                                max="100"
                                step="5"
                                value={currentFilters.distance || 30}
                                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-sm font-medium w-8 text-center">
                                {currentFilters.distance || 30}
                              </span>
                            </div>
                          </div>
                          
                          {/* Price Range Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Price</label>
                            <div className="flex flex-wrap gap-2">
                              {['All', 'Free', 'Paid', 'Under $25', 'Under $50', 'Premium'].map(range => (
                                <EnhancedBadge
                                  key={range}
                                  variant={currentFilters.priceRange === range.toLowerCase().replace(' ', '-').replace('$', '') ? "primary" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => handleFilterChange('priceRange', range === 'All' ? undefined : range.toLowerCase().replace(' ', '-').replace('$', ''))}
                                >
                                  {range}
                                </EnhancedBadge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Reset Filters */}
                          <div className="flex justify-end">
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentFilters({
                                  category: undefined,
                                  dateRange: undefined,
                                  distance: 30,
                                  priceRange: undefined
                                });
                              }}
                            >
                              Reset Filters
                            </EnhancedButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <LoadingState message="Finding events near you..." />
                  ) : sortedEvents.length === 0 ? (
                    <EmptyState
                      title="No events found"
                      description="Try adjusting your filters or search in a different area."
                      icon={<MapPin className="w-6 h-6" />}
                      action={{
                        label: "Refresh",
                        onClick: fetchEvents
                      }}
                    />
                  ) : (
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {sortedEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <Card 
                              variant={selectedEvent?.id === event.id ? "gradient" : "default"}
                              hover="lift"
                              className={cn(
                                "cursor-pointer overflow-hidden",
                                selectedEvent?.id === event.id && "border-primary"
                              )}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex">
                                {/* Event image or icon */}
                                <div className="w-24 h-24 bg-primary/10 flex items-center justify-center text-2xl">
                                  {event.image ? (
                                    <img 
                                      src={event.image} 
                                      alt={event.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    event.categories && event.categories[0] ? (
                                      getCategoryIcon(event.categories[0])
                                    ) : (
                                      '📅'
                                    )
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
                                        <div className="text-muted-foreground">
                                          {event.price === 0 ? 'Free' : `$${event.price}`}
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
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                
                {/* Status Bar */}
                <div className="p-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    {events.length} 
                    {events.length === 1 ? ' event' : ' events'} found
                  </span>
                  
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-xs"
                  >
                    {isFullscreen ? 'Show List' : 'Full Screen Map'}
                  </EnhancedButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Container */}
        <div className="relative flex-1">
          <EnhancedMap
            events={events}
            onEventSelect={setSelectedEvent}
            selectedEvent={selectedEvent}
            userLocation={userLocation}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isLoadingEvents={isLoading}
          />

          {/* Mobile Toggle Button */}
          <EnhancedButton
            variant="glass"
            size="icon"
            className="md:hidden absolute top-4 left-4 z-20"
            onClick={() => setShowEventList(!showEventList)}
          >
            {showEventList ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </EnhancedButton>

          {/* Results Count */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-card/80 backdrop-blur-xl px-6 py-3 rounded-full border border-border shadow-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {events.length} {events.length === 1 ? 'event' : 'events'} found
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
            <EnhancedSearchBar
              onSearch={handleSearch}
              onLocationChange={handleLocationChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Helper function to get category icon
function getCategoryIcon(category: string): React.ReactNode {
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
}
