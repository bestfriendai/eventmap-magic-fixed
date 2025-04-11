import { Event } from '../types';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9';
const RAPIDAPI_HOST = 'real-time-events-search.p.rapidapi.com';

console.log('RapidAPI Key available:', !!RAPIDAPI_KEY);

function formatEventData(event: {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: {
    lat?: number;
    lon?: number;
    address?: string;
  };
  thumbnail?: string;
  url?: string;
  venue?: {
    name?: string;
  };
}): Event | null {
  try {
    // Log if events are skipped due to missing location data, but try to proceed if other data is available
    if (!event.location || !event.location.lat || !event.location.lon) {
      console.log(`RapidAPI event '${event.name}' missing location coordinates, using default values`);
      // Use default coordinates if missing, to still include the event
      event.location = event.location || {};
      event.location.lat = event.location.lat || 0;
      event.location.lon = event.location.lon || 0;
    }

    // Parse date information
    const dateInfo = event.start_date || '';
    const [datePart] = dateInfo.split('T');

    // Determine category based on event description or title
    let category = 'special';
    const lowerTitle = event.name.toLowerCase();
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

    // Generate a unique ID
    const uniqueId = `rapidapi-${event.id}`;

    return {
      id: uniqueId,
      title: event.name,
      description: event.description || 'No description available',
      date: datePart || 'Date TBA',
      time: 'Time TBA',
      location: {
        latitude: event.location.lat,
        longitude: event.location.lon,
        address: event.location.address || 'Location TBA'
      },
      latitude: event.location.lat,
      longitude: event.location.lon,
      categories: [category],
      source: 'rapidapi',
      category,
      subcategory: 'Various',
      status: 'active',
      imageUrl: event.thumbnail,
      ticketUrl: event.url,
      venue: event.venue?.name || 'Venue TBA',
      venue_details: {
        name: event.venue?.name || 'Venue TBA',
        city: '',
        state: '',
        rating: undefined,
        reviews: undefined
      }
    };
  } catch (error) {
    console.error('Error formatting RapidAPI event:', error);
    return null;
  }
}

export async function searchRapidAPIEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  query?: string;
}): Promise<Event[]> {
  console.log('Starting RapidAPI Events search with params:', params);

  if (!params.latitude || !params.longitude) {
    console.log('No location provided for RapidAPI Events search');
    return [];
  }

  if (!RAPIDAPI_KEY) {
    console.error('Missing RapidAPI key. Please add VITE_RAPIDAPI_KEY to your .env.local file');
    throw new Error('Missing RapidAPI key');
  }

  // Use the Netlify proxy function
  const baseUrl = window.location.hostname === 'localhost' ? '' : 'https://dateapril.netlify.app';
  const searchParams = new URLSearchParams({
    query: params.query || 'events near me',
    date: 'any',
    is_virtual: 'false',
    start: '0'
  });
  const proxyUrl = `${baseUrl}/.netlify/functions/rapidapi-proxy?${searchParams.toString()}&latitude=${params.latitude}&longitude=${params.longitude}&radius=${params.radius || 100}`;

  console.log('RapidAPI search parameters:', searchParams.toString());

  try {
    console.log('Fetching RapidAPI events via proxy');
    const response = await fetch(proxyUrl);
    console.log('RapidAPI Proxy response status:', response.status);

    if (!response.ok) {
      throw new Error(`RapidAPI error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      console.log('No events found in RapidAPI response');
      return [];
    }

    console.log(`RapidAPI: ${data.data.length} events retrieved`);

    const events = data.data
      .map((event: any) => formatEventData(event))
      .filter((event: Event | null): event is Event => event !== null);
  
      console.log(`RapidAPI: ${events.length} events formatted`);
      return events;
    } catch (error) {
      console.error('Error fetching RapidAPI events:', error);
    return [];
  }
}
