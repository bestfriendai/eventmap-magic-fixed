export const fetchRealTimeEvents = async (latitude: number, longitude: number) => {
  const RAPIDAPI_KEY = Deno.env.get("RAPID_API_KEY");
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }
  
  try {
    const searchQuery = await getLocationName(latitude, longitude);
    const url = `https://real-time-events-search.p.rapidapi.com/search-events?query=${encodeURIComponent(searchQuery)}&lat=${latitude}&lon=${longitude}&radius=50&unit=mi&date=any&is_virtual=false&start=0&size=100`;

    console.log('Fetching RealTime events with URL:', url);
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'real-time-events-search.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RealTime API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('RealTime API response:', {
      totalEvents: data.data?.length || 0,
      searchQuery
    });
    return data.data || [];
  } catch (error) {
    console.error("Error fetching Real-Time events:", error);
    throw error;
  }
};

async function getLocationName(latitude: number, longitude: number): Promise<string> {
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX");
  if (!MAPBOX_TOKEN) {
    return `${latitude},${longitude}`;
  }

  try {
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    const cityFeature = geocodeData.features?.find((f: { place_type?: string[]; text?: string }) => 
      f.place_type?.includes('place') || f.place_type?.includes('locality')
    );
    const stateFeature = geocodeData.features?.find((f: { place_type?: string[]; text?: string }) => 
      f.place_type?.includes('region')
    );
    
    const cityName = cityFeature?.text || '';
    const stateName = stateFeature?.text || '';
    return `${cityName} ${stateName}`.trim() || `${latitude},${longitude}`;
  } catch (error) {
    console.error("Error getting location name:", error);
    return `${latitude},${longitude}`;
  }
}

export const processRealTimeEvent = (event: {
  event_id?: string;
  name?: string;
  start_time: string;
  venue?: {
    name?: string;
    latitude?: string;
    longitude?: string;
    address?: string;
  };
  tags?: string[];
  thumbnail?: string;
  ticket_links?: { link?: string }[];
  description?: string;
}) => {
  try {
    if (!event.venue?.latitude || !event.venue?.longitude) {
      console.log('Skipping RealTime event due to missing coordinates:', event.event_id);
      return null;
    }

    const startDateTime = new Date(event.start_time);
    const date = startDateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = startDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const categories = event.tags?.map((tag: string) => 
      tag.charAt(0).toUpperCase() + tag.slice(1)
    ) || ["Other"];

    return {
      id: `rt-${event.event_id || Math.random().toString(36)}`,
      title: event.name || "Untitled Event",
      date,
      time,
      venue: event.venue?.name || "TBA",
      latitude: parseFloat(event.venue.latitude),
      longitude: parseFloat(event.venue.longitude),
      location: {
        address: event.venue?.address || 'Location TBA',
        latitude: parseFloat(event.venue.latitude),
        longitude: parseFloat(event.venue.longitude)
      },
      image: event.thumbnail || "https://placehold.co/600x400?text=No+Image",
      categories,
      source: "realtime",
      price: null,
      url: event.ticket_links?.[0]?.link || "",
      description: event.description || null
    };
  } catch (error) {
    console.error("Error processing RealTime event:", error);
    return null;
  }
};
