import { Event, Filter } from '../types'; // Import Filter type
import EventCard from './EventCard';
import { Filter as FilterIcon } from 'lucide-react'; // Alias the icon import
import { Button } from "@nextui-org/react";
import FilterPanel from '@/components/FilterPanel';
import { useState, useMemo } from 'react';

interface EventSidebarProps {
  events: Event[];
  loading: boolean;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

const EventSidebar = ({ events, loading, selectedEvent, onEventSelect }: EventSidebarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'distance'>('date');
  const [filters, setFilters] = useState<Filter>({ // Type the state with Filter
    category: undefined, // Use undefined for optional fields
    dateRange: undefined,
    priceRange: undefined, // Initialize as undefined
    distance: 30, // Keep distance default or make undefined if appropriate
  });

  // Update handler signature to match FilterPanel's expectation
  const handleFilterChange = (key: keyof Filter, value: string | number | string[] | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => 
        event.categories.some(cat => cat.toLowerCase() === filters.category)
      );
    }

    // Apply date range filter
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekend = new Date(now);
    weekend.setDate(weekend.getDate() + (6 - now.getDay()));
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === now.toDateString();
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === tomorrow.toDateString();
        });
        break;
      case 'this weekend':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate <= weekend && eventDate > now;
        });
        break;
      case 'this week':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate <= nextWeek && eventDate > now;
        });
        break;
      case 'this month':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate <= nextMonth && eventDate > now;
        });
        break;
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(event => {
        const price = event.price || 0;
        switch (filters.priceRange) {
          case 'free':
            return price === 0;
          case 'under $25':
            return price > 0 && price < 25;
          case '$25-$50':
            return price >= 25 && price <= 50;
          case '$50-$100':
            return price > 50 && price <= 100;
          case '$100+':
            return price > 100;
          default:
            return true;
        }
      });
    }

    // Sort events
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'distance':
        // Note: This would require calculating actual distances
        break;
    }

    return filtered;
  }, [events, filters, sortBy]);

  return (
    <div className="w-[400px] h-full bg-background/95 backdrop-blur-md border-r border-border overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <Button 
            isIconOnly 
            variant="light" 
            className="text-foreground"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FilterIcon size={20} />
          </Button>
        </div>
        
        {isFilterOpen && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            color={sortBy === 'date' ? "primary" : "default"}
            variant={sortBy === 'date' ? "shadow" : "light"}
            className="text-sm font-medium"
            onClick={() => setSortBy('date')}
          >
            Date
          </Button>
          <Button
            size="sm"
            color={sortBy === 'name' ? "primary" : "default"}
            variant={sortBy === 'name' ? "shadow" : "light"}
            className="text-sm font-medium"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
          <Button
            size="sm"
            color={sortBy === 'distance' ? "primary" : "default"}
            variant={sortBy === 'distance' ? "shadow" : "light"}
            className="text-sm font-medium"
            onClick={() => setSortBy('distance')}
          >
            Distance
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-foreground/60">Loading events...</div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="p-4 text-foreground/60">No events found matching your filters.</div>
        ) : (
          filteredAndSortedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              onClick={() => onEventSelect(event)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EventSidebar;
