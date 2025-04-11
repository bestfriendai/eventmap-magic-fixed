import React, { useState, useCallback, useEffect } from 'react';
import MapView from '@/components/Map';
import SearchBar from '@/components/SearchBar/SearchBar';
import { Event, Filter } from '@/types';
import { searchAllEvents } from '@/services/events';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import EventCard from '@/components/EventCard';
import { useLocation } from '../hooks/useLocation';
import { Search, Filter as FilterIcon, X, MapPin, ChevronLeft, ChevronRight, Calendar, Clock, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

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

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEventList, setShowEventList] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Get user location from browser
  const { location: userLocation, isLoading: locationLoading, error: locationError } = useLocation();
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // Type the state and initialize according to Filter type
  const [currentFilters, setCurrentFilters] = useState<Filter>({
    category: undefined,
    dateRange: undefined,
    distance: 30, // Or undefined if appropriate
    priceRange: undefined, // Initialize as undefined
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
          event.location.latitude,
          event.location.longitude
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
      console.log('%c USING SEARCH LOCATION FOR EVENTS: ', 'background: #9b59b6; color: white; font-size: 14px; padding: 5px;', searchLocation);
      fetchEvents();
    } else if (userLocation && !locationLoading) {
      // Use browser geolocation if available and no search location is set
      if (userLocation.latitude === 0 && userLocation.longitude === 0) {
        console.error('Invalid user location (0,0) - not fetching events');
        toast.error('Could not determine your location. Please use the search bar or try the "Nearby" button.');
        return;
      }

      if (userLocation.latitude === 40.7128 && userLocation.longitude === -74.0060) {
        console.error('Default New York location detected - this is likely an error');
        toast.error('Default location detected. Please use the "Nearby" button to get your actual location.');
        return;
      }

      console.log('%c USING BROWSER GEOLOCATION FOR EVENTS: ', 'background: #2ecc71; color: white; font-size: 14px; padding: 5px;', userLocation);
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
  }, [userLocation, searchLocation]); // Add missing dependencies

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

  const handleFilterChange = useCallback((filters: Filter) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }));
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

  console.log(`Total events after sorting: ${sortedEvents.length}`);

  const SortButton = ({ option, label }: { option: SortOption; label: string }) => (
    <button
      onClick={() => handleSort(option)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        sortBy === option
          ? 'bg-blue-500 text-white'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      {label}
      {sortBy === option && (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />

      <div className="h-[calc(100vh-64px)] w-full mt-16 flex">
        {/* Event List Panel */}
        <div
          className={`absolute md:relative z-30 h-full w-full md:w-[400px] bg-black/95 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-300 ${
            showEventList ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-500 ease-in-out`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Events</h1>
                <button
                  onClick={() => setShowEventList(false)}
                  className="md:hidden text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    showFilters
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {showFilters ? <X className="w-4 h-4" /> : <FilterIcon className="w-4 h-4" />}
                  <span className="text-sm">Filters</span>
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <SortButton option="date" label="Date" />
                <SortButton option="title" label="Name" />
                <SortButton option="distance" label="Distance" />
              </div>

              {showFilters && (
                <div className="mt-4">
                  <FilterPanel 
                    filters={currentFilters}
                    onFilterChange={(key, value) => {
                      setCurrentFilters(prev => ({ ...prev, [key]: value }));
                    }} 
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MapPin className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400">No events found. Try adjusting your filters or search in a different area.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {sortedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      isSelected={selectedEvent?.id === event.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1">
          <MapView
            events={events}
            onEventSelect={setSelectedEvent}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
            isLoadingEvents={isLoading}
          />

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setShowEventList(!showEventList)}
            className="md:hidden absolute top-4 left-4 z-20 bg-black/90 text-white p-2 rounded-lg shadow-lg hover:bg-black transition-colors"
          >
            {showEventList ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          {/* Results Count */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/95 backdrop-blur-xl px-6 py-3 rounded-full border border-zinc-800/50 shadow-xl">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">
                  {events.length} {events.length === 1 ? 'event' : 'events'} found
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
            <SearchBar
              onSearch={handleSearch}
              onLocationChange={handleLocationChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
