import { Event } from '../types';
// import { fetchWithCorsProxy } from './mapbox'; // Replaced with Netlify function

// Remove unused function

// Use the Eventbrite credentials from environment variables
const EVENTBRITE_API_KEY = import.meta.env.VITE_EVENTBRITE_API_KEY || 'YJH4KGIHRNH0KODPZD';
const EVENTBRITE_CLIENT_SECRET = import.meta.env.VITE_EVENTBRITE_CLIENT_SECRET || 'QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ';
const EVENTBRITE_PRIVATE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN || 'EUB5KUFLJH2SKVCHVD3E';
const EVENTBRITE_PUBLIC_TOKEN = import.meta.env.VITE_EVENTBRITE_PUBLIC_TOKEN || 'C4WQAR3XB7XX2AYOUEQ4';

console.log('Eventbrite credentials available:', {
  apiKey: !!EVENTBRITE_API_KEY,
  clientSecret: !!EVENTBRITE_CLIENT_SECRET,
  privateToken: !!EVENTBRITE_PRIVATE_TOKEN,
  publicToken: !!EVENTBRITE_PUBLIC_TOKEN
});
const REQUEST_TIMEOUT = 30000;

export async function searchEventbriteRapidAPI(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
}): Promise<Event[]> {
  console.log('Starting Eventbrite API search with params:', params);

  if (!params.latitude || !params.longitude) {
    console.log('No location provided for Eventbrite search');
    return [];
  }

  if (!EVENTBRITE_PRIVATE_TOKEN) {
    console.error('Missing Eventbrite API token. Please add VITE_EVENTBRITE_PRIVATE_TOKEN to your .env.local file');
    throw new Error('Missing Eventbrite API token');
  }

  const radius = params.radius || 10;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    // Get a date in the future for events (e.g., next year)
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setFullYear(today.getFullYear() + 1); // Look for events up to a year in the future
    const formattedDate = today.toISOString().split('T')[0];

    console.log('Searching for events from', formattedDate, 'to one year in the future');

    // We're using the proxy URL instead of direct API call

    console.log('Fetching Eventbrite events via proxy');

    // Use the Netlify proxy function
    // Use relative URL for local development, absolute URL for production
    const baseUrl = window.location.hostname === 'localhost' ? '' : 'https://dateapril.netlify.app';
    const proxyUrl = `${baseUrl}/.netlify/functions/eventbrite-proxy?latitude=${params.latitude}&longitude=${params.longitude}&radius=${radius}mi&start_date_range_start=${formattedDate}T00:00:00`;

    // Note: We're not sending API tokens in the client-side code for security reasons
    // The server will handle authentication

    console.log(`Fetching Eventbrite events via proxy: ${proxyUrl}`);

    const eventResponse = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal
    });

    console.log('Eventbrite API response status:', eventResponse.status);

    clearTimeout(timeoutId);

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error('Eventbrite API error:', {
        status: eventResponse.status,
        statusText: eventResponse.statusText,
        error: errorText
      });

      // Log the error but don't throw - return empty array instead
      console.warn(`Eventbrite API error: ${eventResponse.status} - ${errorText}`);
      return [];
    }

    const eventData = await eventResponse.json();

    if (!eventData.events || !Array.isArray(eventData.events)) {
      console.log('No events found in Eventbrite response');
      return [];
    }

    console.log(`Found ${eventData.events.length} Eventbrite events`);

    const events = eventData.events
      .map((event: any) => {
        try {
          // Skip events without venue coordinates
          if (!event.venue?.latitude || !event.venue?.longitude) {
            console.log(`Skipping Eventbrite event ${event.id} due to missing coordinates`);
            return null;
          }

          const startDate = new Date(event.start.local);

          // Format address
          const addressParts = [
            event.venue.name,
            event.venue.address?.address_1,
            event.venue.address?.city,
            event.venue.address?.region
          ].filter(Boolean);

          const addressStr = addressParts.length > 0 ? addressParts.join(', ') : 'Location TBA';

          // Extract categories
          const categories = [];
          if (event.category?.name) {
            categories.push(event.category.name);
          }
          if (event.subcategory?.name) {
            categories.push(event.subcategory.name);
          }

          return {
            id: `eb-${event.id}`,
            title: event.name.text,
            description: event.description?.text || 'No description available',
            date: startDate.toLocaleDateString(),
            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            venue: event.venue.name || 'TBA',
            latitude: parseFloat(event.venue.latitude),
            longitude: parseFloat(event.venue.longitude),
            location: {
              address: addressStr,
              latitude: parseFloat(event.venue.latitude),
              longitude: parseFloat(event.venue.longitude)
            },
            image: event.logo?.url || "https://placehold.co/600x400?text=No+Image",
            categories: categories.length > 0 ? categories : ["Other"],
            source: "eventbrite",
            price: event.is_free ? 0 : null,
            url: event.url
          };
        } catch (error) {
          console.error('Error processing Eventbrite event:', error);
          return null;
        }
      })
      .filter(Boolean);

    console.log(`Successfully processed ${events.length} Eventbrite events`);
    return events;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('Eventbrite request timed out');
    } else {
      console.error('Error in Eventbrite event search:', error);
    }
    return [];
  }
}

// Remove unused function
