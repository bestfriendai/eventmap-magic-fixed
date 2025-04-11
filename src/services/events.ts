import { Event, Filter } from '../types';
import { searchTicketmasterEvents } from './ticketmaster';
import { searchRapidAPIEvents } from './rapidapi-events';
import { searchEventbriteRapidAPI } from './eventbrite-rapidapi';
import { searchGoogleEvents } from './google-events';

export const UNIFIED_CATEGORIES = {
  'all': 'All Events',
  'live-music': 'Live Music',
  'comedy': 'Comedy',
  'sports-games': 'Sports & Games',
  'performing-arts': 'Performing Arts',
  'food-drink': 'Food & Drink',
  'cultural': 'Cultural',
  'social': 'Social',
  'educational': 'Educational',
  'outdoor': 'Outdoor',
  'special': 'Special Events'
} as const;

// Cache for storing fetched events
let eventCache: {
  events: Event[];
  timestamp: number;
  expiresIn: number;
} | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const SEARCH_RADIUS = 100; // 100 mile default radius

function removeDuplicates(events: Event[]): Event[] {
  const seen = new Set();
  const uniqueEvents = events.filter(event => {
    const key = `${event.title}-${event.date}-${event.location.latitude}-${event.location.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return uniqueEvents;
}

function validateEvent(event: Event): boolean {
  // Check for required fields
  if (!event.id || !event.title || !event.date || !event.location) {
    console.log('Invalid event:', { id: event.id, title: event.title });
    return false;
  }

  // Check for valid coordinates, but allow default (0,0) for events that were formatted with defaults
  if (!event.location.latitude && event.location.latitude !== 0 || !event.location.longitude && event.location.longitude !== 0) {
    console.log('Event missing coordinates:', event.title);
    return false;
  }

  // Filter out past events
  try {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (eventDate < today) {
      console.log('Filtering out past event:', event.title, 'on', event.date);
      return false;
    }
  } catch (error) {
    console.error('Error parsing event date:', event.date, error);
    // If we can't parse the date, keep the event to be safe
  }

  return true;
}

async function fetchAllEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string; // Add keyword parameter
}): Promise<Event[]> {
  console.log('Fetching events from all sources');

  const eventPromises = [
    searchTicketmasterEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('Ticketmaster API Error:', error);
      return [];
    }),
    searchRapidAPIEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('RapidAPI Error:', error);
      return [];
    }),
    // Temporarily disable Eventbrite API due to persistent 404 errors
    // searchEventbriteRapidAPI({
    //   latitude: params.latitude,
    //   longitude: params.longitude,
    //   radius: params.radius || SEARCH_RADIUS
    // }).catch(error => {
    //   console.error('Eventbrite API Error:', error);
    //   return [];
    // }),
    Promise.resolve([]), // Return empty array for Eventbrite
    // Re-enable Google Events API with proper keyword handling
    searchGoogleEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS,
      keyword: params.keyword // Pass keyword down
    }).catch(error => {
      console.error('Google Events API Error:', error);
      return [];
    })
  ];

  const results = await Promise.allSettled(eventPromises);

  const allEvents: Event[] = results
    .filter((result): result is PromiseFulfilledResult<Event[]> =>
      result.status === 'fulfilled' && Array.isArray(result.value)
    )
    .flatMap(result => result.value.filter(validateEvent));

  console.log('Event counts by source:');
  results.forEach((result, index) => {
    const source = ['Ticketmaster', 'RapidAPI', 'Eventbrite (disabled)', 'Google'][index];
    const count = result.status === 'fulfilled' ? result.value.length : 0;
    console.log(`- ${source}: ${count} events`);
  });

  const uniqueEvents = removeDuplicates(allEvents);
  return uniqueEvents;
}

export async function searchAllEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
  size?: number;
  filters?: Filter;
}): Promise<Event[]> {
  console.log('Searching all events');

  try {
    // Check cache first
    const now = Date.now();
    if (eventCache && (now - eventCache.timestamp) < eventCache.expiresIn) {
      console.log('Using cached events');
    } else {
      console.log('Cache expired or not found, fetching fresh events');
      const events = await fetchAllEvents({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius,
        keyword: params.keyword // Pass keyword from searchAllEvents
      });

      eventCache = {
        events,
        timestamp: now,
        expiresIn: CACHE_DURATION
      };
    }

    let filteredEvents = eventCache.events;

    // Apply location-based filtering
    if (params.latitude && params.longitude) {
      console.log('Applying location filtering');
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        distance: calculateDistance(
          params.latitude!,
          params.longitude!,
          event.location.latitude,
          event.location.longitude
        )
      }));
    }

    // Apply other filters
    if (params.filters) {
      console.log('Applying filters:', params.filters);
      filteredEvents = filterEvents(
        filteredEvents,
        params.filters,
        params.latitude && params.longitude
          ? { latitude: params.latitude, longitude: params.longitude }
          : undefined
      );
    }

    // Sort events
    filteredEvents.sort((a, b) => {
      // First by date - prioritize upcoming events
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // Events happening today should be prioritized
      const isToday = (date: Date) => date.toDateString() === today.toDateString();

      if (isToday(dateA) && !isToday(dateB)) return -1;
      if (!isToday(dateA) && isToday(dateB)) return 1;

      // Then sort by date
      const dateComparison = dateA.getTime() - dateB.getTime();
      if (dateComparison !== 0) return dateComparison;

      // Then by distance if available
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }

      return 0;
    });

    // Limit results if size is specified
    if (params.size && params.size > 0) {
      filteredEvents = filteredEvents.slice(0, params.size);
    }

    console.log(`Total events after filtering: ${filteredEvents.length}`);
    return filteredEvents;
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function filterEvents(events: Event[], filters: Filter, userLocation?: { latitude: number; longitude: number }): Event[] {
  console.log('Applying event filters');

  return events.filter(event => {
    // Category filter
    if (filters.category !== 'all' && event.category !== filters.category) {
      return false;
    }

    // Date filter
    if (filters.dateRange !== 'all') {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case 'today':
          if (eventDate.toDateString() !== today.toDateString()) return false;
          break;
        case 'tomorrow': {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
          break;
        }
        case 'week': {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (eventDate > nextWeek) return false;
          break;
        }
        case 'month': {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          if (eventDate > nextMonth) return false;
          break;
        }
      }
    }

    // Price filter
    // Check if priceRange filter is set (and not 'all' or empty, adjust as needed)
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (event.price === undefined || event.price === null) return false; // Check event price existence
      const price = event.price; // Assuming event.price is already a number
      
      // Use the single priceRange string directly
      const range = filters.priceRange;
      let matchesPrice = false;
      switch (range) {
        case 'free':
          matchesPrice = (price === 0);
          break;
        case 'under $25': // Assuming 'under $25' is the string used in FilterPanel
          matchesPrice = (price < 25);
          break;
        case '$25-$50': // Assuming '$25-$50' is the string used
          matchesPrice = (price >= 25 && price <= 50);
          break;
        case '$50-$100': // Assuming '$50-$100' is the string used
          matchesPrice = (price > 50 && price <= 100);
          break;
        case '$100+': // Assuming '$100+' is the string used
          matchesPrice = (price > 100);
          break;
        default:
          matchesPrice = false; // Or true if unknown range should pass
          break;
      }
      if (!matchesPrice) return false; // If the selected range didn't match, filter out
    }

    // Distance filter - Skip for events with default coordinates (0,0)
    if (userLocation && filters.distance) {
      // Check if event has default coordinates (0,0)
      if (event.location.latitude === 0 && event.location.longitude === 0) {
        // Don't filter out events with default coordinates
        return true;
      }
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.location.latitude,
        event.location.longitude
      );
      if (distance > filters.distance) return false;
    }
    
    // If the event passed all filters, include it
    return true;

    return true;
  });
}
