export const fetchTicketmasterEvents = async (latitude: number, longitude: number) => {
  const TICKETMASTER_API_KEY = Deno.env.get("TICKETMASTER_API_KEY");
  if (!TICKETMASTER_API_KEY) {
    throw new Error('Ticketmaster API key not configured');
  }

  const radius = 50;
  const unit = "miles";
  const size = 200;
  const sort = "date,asc";
  
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${latitude},${longitude}&radius=${radius}&unit=${unit}&size=${size}&sort=${sort}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ticketmaster API responded with status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Ticketmaster response:', {
      totalEvents: data._embedded?.events?.length || 0,
      page: data.page || {}
    });
    return data._embedded?.events || [];
  } catch (error) {
    console.error("Error fetching Ticketmaster events:", error);
    throw error; // Propagate error for proper handling
  }
};

export const processTicketmasterEvent = (event: {
  id: string;
  name: string;
  dates: { start: { localDate?: string; localTime?: string } };
  _embedded?: {
    venues?: {
      name?: string;
      location?: { latitude?: string; longitude?: string };
      address?: { line1?: string };
      city?: { name?: string };
    }[];
  };
  images?: { url?: string }[];
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
  }[];
  priceRanges?: { min?: number }[];
  url?: string;
  description?: string;
  info?: string;
}) => {
  try {
    const venue = event._embedded?.venues?.[0];
    if (!venue?.location?.latitude || !venue?.location?.longitude) {
      console.log('Skipping Ticketmaster event due to missing coordinates:', event.id);
      return null;
    }

    const categories: string[] = [];
    if (event.classifications?.[0]?.segment?.name) {
      categories.push(event.classifications[0].segment.name);
    }
    if (event.classifications?.[0]?.genre?.name) {
      categories.push(event.classifications[0].genre.name);
    }

    return {
      id: `tm-${event.id}`,
      title: event.name,
      date: event.dates.start.localDate || "TBA",
      time: event.dates.start.localTime || "TBA",
      venue: venue.name,
      latitude: parseFloat(venue.location.latitude),
      longitude: parseFloat(venue.location.longitude),
      location: {
        address: venue.address?.line1 ? `${venue.address.line1}, ${venue.city?.name || ''}` : 'Location TBA',
        latitude: parseFloat(venue.location.latitude),
        longitude: parseFloat(venue.location.longitude)
      },
      image: event.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image",
      categories: categories.length > 0 ? categories : ["Other"],
      source: "ticketmaster",
      price: event.priceRanges?.[0]?.min || null,
      url: event.url || "",
      description: event.description || event.info || null
    };
  } catch (error) {
    console.error("Error processing Ticketmaster event:", error);
    return null;
  }
};
