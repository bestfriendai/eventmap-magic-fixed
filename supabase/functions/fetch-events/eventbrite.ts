export const fetchEventbriteEvents = async (latitude: number, longitude: number) => {
  // Use environment variables or fallback to hardcoded values
  const EVENTBRITE_PRIVATE_TOKEN = Deno.env.get("EVENTBRITE_PRIVATE_TOKEN") || 'EUB5KUFLJH2SKVCHVD3E';
  const EVENTBRITE_API_KEY = Deno.env.get("EVENTBRITE_API_KEY") || 'YJH4KGIHRNH0KODPZD';
  const EVENTBRITE_CLIENT_SECRET = Deno.env.get("EVENTBRITE_CLIENT_SECRET") || 'QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ';
  const EVENTBRITE_PUBLIC_TOKEN = Deno.env.get("EVENTBRITE_PUBLIC_TOKEN") || 'C4WQAR3XB7XX2AYOUEQ4';

  const radius = "50mi";

  try {
    console.log(`Fetching Eventbrite events for coordinates: ${latitude},${longitude} within ${radius}`);
    // Build the search URL with all necessary parameters
    const searchUrl = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${latitude}&location.longitude=${longitude}&location.within=${radius}&expand=venue,ticket_availability,category,organizer`;

    const searchResponse = await fetch(searchUrl,
      {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Eventbrite API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      throw new Error(`Eventbrite API error: ${searchResponse.status} - ${errorText}`);
    }

    const data = await searchResponse.json();
    console.log('Eventbrite response:', {
      totalEvents: data.events?.length || 0,
      pagination: data.pagination || {}
    });

    return data.events || [];
  } catch (error) {
    console.error("Error fetching Eventbrite events:", error);
    throw error;
  }
};

export const processEventbriteEvent = (event: {
  id: string;
  name: { text?: string };
  start: { local: string };
  venue?: {
    name?: string;
    address?: {
      latitude?: string;
      longitude?: string;
      address_1?: string;
      address_2?: string;
      city?: string;
      region?: string;
      postal_code?: string;
    };
  };
  logo?: { url?: string };
  category?: { name?: string };
  subcategory?: { name?: string };
  is_free?: boolean;
  ticket_availability?: {
    minimum_ticket_price?: { major_value?: string };
  };
  url?: string;
  description?: { text?: string };
}) => {
  try {
    if (!event.venue?.address?.latitude || !event.venue?.address?.longitude) {
      console.log('Skipping Eventbrite event due to missing coordinates:', event.id);
      return null;
    }

    const startDateTime = new Date(event.start.local);
    const date = startDateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = startDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const categories: string[] = [];
    if (event.category?.name) {
      categories.push(event.category.name);
    }
    if (event.subcategory?.name) {
      categories.push(event.subcategory.name);
    }

    const venue = event.venue;
    const address = venue?.address;
    const addressStr = [
      address?.address_1,
      address?.address_2,
      address?.city,
      address?.region,
      address?.postal_code
    ].filter(Boolean).join(', ');

    return {
      id: `eb-${event.id}`,
      title: event.name.text || "Untitled Event",
      date,
      time,
      venue: venue?.name || "TBA",
      latitude: parseFloat(address?.latitude || '0'),
      longitude: parseFloat(address?.longitude || '0'),
      location: {
        address: addressStr || 'Location TBA',
        latitude: parseFloat(address?.latitude || '0'),
        longitude: parseFloat(address?.longitude || '0')
      },
      image: event.logo?.url || "https://placehold.co/600x400?text=No+Image",
      categories: categories.length > 0 ? categories : ["Other"],
      source: "eventbrite",
      price: event.is_free ? 0 : (event.ticket_availability?.minimum_ticket_price?.major_value || null),
      url: event.url,
      description: event.description?.text || null
    };
  } catch (error) {
    console.error("Error processing Eventbrite event:", error);
    return null;
  }
};
