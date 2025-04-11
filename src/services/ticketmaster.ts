import { Event, Filter } from '../types';

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY || 'DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9';

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
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const REQUEST_TIMEOUT = 30000;

// Map our categories to Ticketmaster segment IDs and genre IDs
const CATEGORY_MAPPING: Record<string, { segmentId?: string; genreId?: string }> = {
  'live-music': { segmentId: 'KZFzniwnSyZfZ7v7nJ' },
  'sports-games': { segmentId: 'KZFzniwnSyZfZ7v7nE' },
  'performing-arts': { segmentId: 'KZFzniwnSyZfZ7v7na' },
  'comedy': { segmentId: 'KZFzniwnSyZfZ7v7na', genreId: 'KnvZfZ7vAe1' },
  'food-drink': { segmentId: 'KZFzniwnSyZfZ7v7lF' },
  'cultural': { segmentId: 'KZFzniwnSyZfZ7v7na' },
  'social': { segmentId: 'KZFzniwnSyZfZ7v7ld' },
  'educational': { segmentId: 'KZFzniwnSyZfZ7v7n1' },
  'outdoor': { segmentId: 'KZFzniwnSyZfZ7v7nE' },
  'special': { segmentId: 'KZFzniwnSyZfZ7v7n1' }
};

function getDateRange(dateFilter?: string): { startDateTime?: string; endDateTime?: string } {
  const now = new Date();
  // Set time to beginning of the day to ensure we get all of today's events
  now.setHours(0, 0, 0, 0);
  const startDateTime = now.toISOString().slice(0, 19) + 'Z';
  let endDateTime;

  if (!dateFilter) return { startDateTime };

  switch (dateFilter) {
    case 'today':
      now.setHours(23, 59, 59);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'tomorrow':
      now.setDate(now.getDate() + 1);
      now.setHours(23, 59, 59);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'week':
      now.setDate(now.getDate() + 7);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'month':
      now.setMonth(now.getMonth() + 1);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    default:
      if (dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateFilter);
        date.setHours(23, 59, 59);
        endDateTime = date.toISOString().slice(0, 19) + 'Z';
      }
  }

  return { startDateTime, endDateTime };
}

interface TicketmasterEvent {
  id: string;
  name: string;
  description?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  priceRanges?: { min?: number }[];
  images?: { ratio?: string; width?: number; url?: string }[];
  dates: { start: { localDate?: string; localTime?: string } };
  _embedded?: {
    venues?: {
      name?: string;
      location?: { latitude?: string; longitude?: string };
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
    }[];
  };
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }[];
  _userLocation?: { latitude: number; longitude: number } | null;
}

async function fetchAllPages(baseParams: URLSearchParams): Promise<TicketmasterEvent[]> {
  let allEvents: TicketmasterEvent[] = [];
  let page = 0;
  let hasMorePages = true;
  const eventsPerPage = 100;
  const maxPages = 4;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    while (hasMorePages && page < maxPages && allEvents.length < 400) {
      const params = new URLSearchParams(baseParams);
      params.set('page', page.toString());
      params.set('size', eventsPerPage.toString());

      // Use the Netlify proxy function to avoid CORS issues
      const baseUrl = window.location.hostname === 'localhost' ? '' : 'https://dateapril.netlify.app';
      const proxyUrl = `${baseUrl}/.netlify/functions/ticketmaster-proxy?${params.toString()}`;
      const response = await fetch(proxyUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data._embedded?.events) {
        break;
      }

      allEvents = [...allEvents, ...data._embedded.events];
      hasMorePages = data.page.totalPages > page + 1;
      page++;
    }

    clearTimeout(timeoutId);
    return allEvents.slice(0, 400);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    throw error;
  }
}

function formatEventData(event: TicketmasterEvent): Event | null {
  try {
    const venue = event._embedded?.venues?.[0];
    if (!venue?.location?.latitude || !venue?.location?.longitude) {
      return null;
    }

    const image = event.images?.find((img: { ratio?: string; width?: number; url?: string }) => img.ratio === '16_9' && img.width > 1000) || event.images?.[0];
    const classification = event.classifications?.[0];

    // Extract categories
    const categories = [];
    if (classification?.segment?.name) {
      categories.push(classification.segment.name);
    }
    if (classification?.genre?.name) {
      categories.push(classification.genre.name);
    }
    if (classification?.subGenre?.name) {
      categories.push(classification.subGenre.name);
    }

    // Calculate distance if coordinates are provided
    let distance: number | undefined;
    if (event._userLocation) {
      const { latitude, longitude } = event._userLocation;
      distance = calculateDistance(
        latitude,
        longitude,
        Number(venue.location.latitude),
        Number(venue.location.longitude)
      );
    }

    // Format date and time
    const dateStr = event.dates.start.localDate || 'Date TBA';
    const timeStr = event.dates.start.localTime || 'Time TBA';

    // Format address
    const addressParts = [
      venue.name,
      venue.address?.line1,
      venue.city?.name,
      venue.state?.stateCode
    ].filter(Boolean);

    const addressStr = addressParts.length > 0 ? addressParts.join(', ') : 'Location TBA';

    return {
      id: `tm-${event.id}`,
      title: event.name,
      description: event.description || event.info || event.pleaseNote || 'No description available',
      date: dateStr,
      time: timeStr,
      venue: venue.name,
      latitude: Number(venue.location.latitude),
      longitude: Number(venue.location.longitude),
      location: {
        address: addressStr,
        latitude: Number(venue.location.latitude),
        longitude: Number(venue.location.longitude)
      },
      image: image?.url || "https://placehold.co/600x400?text=No+Image",
      categories: categories.length > 0 ? categories : ["Other"],
      source: "ticketmaster",
      price: event.priceRanges?.[0]?.min || null,
      url: event.url || "",
      distance
    };
  } catch (error) {
    console.error('Error formatting Ticketmaster event data:', error);
    return null;
  }
}

export async function searchTicketmasterEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
  size?: number;
  filters?: Filter;
}): Promise<Event[]> {
  console.log('Searching Ticketmaster events with params:', params);

  const dateRange = params.filters?.dateRange ? getDateRange(params.filters.dateRange) : {};
  const categoryMapping = params.filters?.category ? CATEGORY_MAPPING[params.filters.category] : undefined;

  const searchParams = new URLSearchParams({
    apikey: API_KEY,
    size: '100',
    unit: 'miles',
    sort: 'date,asc',
    includeTBA: 'yes',
    includeTest: 'no',
    ...(params.latitude && params.longitude && {
      latlong: `${params.latitude},${params.longitude}`,
      radius: (params.filters?.distance || params.radius || 10).toString(),
    }),
    ...(params.keyword && { keyword: params.keyword }),
    ...(dateRange.startDateTime && { startDateTime: dateRange.startDateTime }),
    ...(dateRange.endDateTime && { endDateTime: dateRange.endDateTime }),
    ...(categoryMapping?.segmentId && { segmentId: categoryMapping.segmentId }),
    ...(categoryMapping?.genreId && { genreId: categoryMapping.genreId }),
  });

  try {
    const events = await fetchAllPages(searchParams);
    console.log(`Ticketmaster: ${events.length} events retrieved`);

    // Add user location to each event for distance calculation
    const eventsWithLocation = events.map(event => ({
      ...event,
      _userLocation: params.latitude && params.longitude
        ? { latitude: params.latitude, longitude: params.longitude }
        : null
    }));

    const formattedEvents = eventsWithLocation
      .map(formatEventData)
      .filter((event): event is Event => event !== null);

    console.log(`Ticketmaster: ${formattedEvents.length} events formatted`);
    return formattedEvents;
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    throw error;
  }
}
