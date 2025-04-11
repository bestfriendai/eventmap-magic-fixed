import { Event } from '../types';
// import { fetchWithCorsProxy } from './mapbox'; // Replaced with Netlify function

// Use the SerpAPI key from environment variables
const API_KEY = import.meta.env.VITE_SERPAPI_KEY || '18596fbf4a660faf2c48ceca0c19c385eba49ba054fc4db6ab1bb541d8f73c5d';
console.log('SerpAPI Key available:', !!API_KEY);
const BASE_URL = 'https://serpapi.com/search.json';

function formatEventData(event: {
  event_location_map?: { serpapi_link?: string };
  date?: { when?: string };
  title: string;
  description?: string;
  address?: string | string[];
  thumbnail?: string;
  ticket_info?: { link?: string }[];
  venue?: {
    name?: string;
    rating?: number;
    reviews?: number;
  };
}): Event | null {
  try {
    // Extract coordinates from the event_location_map link if available
    let latitude = 0;
    let longitude = 0;

    if (event.event_location_map?.serpapi_link) {
      const match = event.event_location_map.serpapi_link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (match) {
        latitude = parseFloat(match[1]);
        longitude = parseFloat(match[2]);
      }
    }

    // Skip events without location data
    if (!latitude || !longitude) {
      return null;
    }

    // Parse date information
    const dateInfo = event.date?.when || '';
    const [datePart, timePart] = dateInfo.split(', ');

    // Determine category based on event description or title
    let category = 'special';
    const lowerTitle = event.title.toLowerCase();
    const lowerDesc = (event.description || '').toLowerCase();

    if (lowerTitle.includes('music') || lowerTitle.includes('concert')) {
      category = 'live-music';
    } else if (lowerTitle.includes('comedy') || lowerDesc.includes('comedy')) {
      category = 'comedy';
    } else if (lowerTitle.includes('sports') || lowerDesc.includes('sports')) {
      category = 'sports-games';
    } else if (lowerTitle.includes('art') || lowerDesc.includes('art')) {
      category = 'performing-arts';
    } else if (lowerTitle.includes('food') || lowerDesc.includes('food')) {
      category = 'food-drink';
    } else if (lowerTitle.includes('culture') || lowerDesc.includes('culture')) {
      category = 'cultural';
    } else if (lowerTitle.includes('education') || lowerDesc.includes('education')) {
      category = 'educational';
    }

    // Generate a unique ID that doesn't use deprecated methods
    const uniqueId = `google-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return {
      id: uniqueId,
      title: event.title,
      description: event.description || 'No description available',
      date: datePart,
      time: timePart || 'Time TBA',
      location: {
        latitude,
        longitude,
        address: Array.isArray(event.address) ? event.address.join(', ') : event.address || 'Location TBA'
      },
      latitude,
      longitude,
      categories: [category],
      source: 'google',
      category,
      subcategory: 'Various',
      status: 'active',
      imageUrl: event.thumbnail,
      ticketUrl: event.ticket_info?.[0]?.link,
      venue: event.venue?.name || event.address?.[0] || 'Venue TBA',
      venue_details: {
        name: event.venue?.name || event.address?.[0] || 'Venue TBA',
        city: event.address?.[1]?.split(', ')?.[0] || '',
        state: event.address?.[1]?.split(', ')?.[1] || '',
        rating: event.venue?.rating,
        reviews: event.venue?.reviews
      }
    };
  } catch (error) {
    console.error('Error formatting Google event:', error);
    return null;
  }
}

export async function searchGoogleEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
}): Promise<Event[]> {
  console.log('Starting Google Events search with params:', params);

  if (!params.latitude || !params.longitude) {
    console.log('No location provided for Google Events search');
    return [];
  }

  if (!API_KEY) {
    console.error('Missing SerpAPI key. Please add VITE_SERPAPI_KEY to your .env.local file');
    throw new Error('Missing SerpAPI key');
  }

  // Construct a query following SerpAPI documentation example (e.g., "Events in Austin")
  let query = params.keyword || 'events near me';
  // Ensure the query is formatted correctly for SerpAPI as per documentation
  query = query.toLowerCase().includes('event') ? query : `Events ${query}`;
  // Override to a more generic query that should work with SerpAPI
  query = 'Events near me';
  // Create search parameters for SerpAPI
  const searchParams = new URLSearchParams({
    engine: 'google_events',
    q: query,
    hl: 'en',
    gl: 'us',
    location: `${params.latitude},${params.longitude}`, // Correct location format
    device: 'desktop',
    num: '20' // Request more events
  });

  // Note: We're not sending the API key in the client-side code for security reasons
  // The server will use its own API key

  console.log('SerpAPI search parameters:', searchParams.toString());

  try {
    // Using proxy URL instead of direct API call
    console.log('Fetching Google events via proxy');

    // Use the Netlify proxy function
    // Use relative URL for local development, absolute URL for production
    const baseUrl = window.location.hostname === 'localhost' ? '' : 'https://dateapril.netlify.app';
    const proxyUrl = `${baseUrl}/.netlify/functions/google-proxy?${searchParams.toString()}`;
    const response = await fetch(proxyUrl);
    console.log('Google Proxy response status:', response.status);

    if (!response.ok) {
      throw new Error(`SerpAPI error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.events_results || !Array.isArray(data.events_results)) {
      console.log('No events found in Google Events response');
      return [];
    }

    console.log(`Google Events: ${data.events_results.length} events retrieved`);

    const events = data.events_results
      .map((event: {
        event_location_map?: { serpapi_link?: string };
        date?: { when?: string };
        title: string;
        description?: string;
        address?: string | string[];
        thumbnail?: string;
        ticket_info?: { link?: string }[];
        venue?: {
          name?: string;
          rating?: number;
          reviews?: number;
        };
      }) => formatEventData(event))
      .filter((event: Event | null): event is Event => event !== null);

    console.log(`Google Events: ${events.length} events formatted`);
    return events;
  } catch (error) {
    console.error('Error fetching Google events:', error);
    return [];
  }
}
