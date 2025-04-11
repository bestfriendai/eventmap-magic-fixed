import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchTicketmasterEvents, processTicketmasterEvent } from "./ticketmaster.ts";
import { fetchRealTimeEvents, processRealTimeEvent } from "./realtime.ts";
import { fetchEventbriteEvents, processEventbriteEvent } from "./eventbrite.ts";

interface Location {
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.text();
    let coordinates: Location;
    
    try {
      coordinates = JSON.parse(requestData);
    } catch (error) {
      console.error('Error parsing request data:', error);
      throw new Error('Invalid request data format');
    }

    const { latitude, longitude } = coordinates;

    if (!latitude || !longitude) {
      throw new Error('Missing or invalid coordinates');
    }

    console.log('Fetching events for location:', { latitude, longitude });

    // Fetch events from all sources in parallel with proper error handling
    const results = await Promise.allSettled([
      fetchTicketmasterEvents(latitude, longitude),
      fetchRealTimeEvents(latitude, longitude),
      fetchEventbriteEvents(latitude, longitude)
    ]);

    const events = [];
    const errors = [];

    // Process results and handle any failed promises
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const source = ['ticketmaster', 'realtime', 'eventbrite'][index];
        const processor = [processTicketmasterEvent, processRealTimeEvent, processEventbriteEvent][index];
        
        const processed = result.value
          .map(processor)
          .filter(Boolean);
        events.push(...processed);
        
        console.log(`Successfully processed ${processed.length} events from ${source}`);
      } else {
        const source = ['Ticketmaster', 'RealTime', 'Eventbrite'][index];
        errors.push(`${source} API error: ${result.reason}`);
        console.error(`Error fetching from ${source}:`, result.reason);
      }
    });

    // Ensure all event objects are serializable
    const serializableEvents = events.map(event => ({
      ...event,
      latitude: Number(event.latitude),
      longitude: Number(event.longitude),
      date: String(event.date),
      time: String(event.time),
      price: event.price ? Number(event.price) : null,
      location: {
        address: event.location?.address || 'Location TBA',
        latitude: Number(event.latitude),
        longitude: Number(event.longitude)
      }
    }));

    const responseData = {
      events: serializableEvents,
      meta: {
        total: serializableEvents.length,
        sources: {
          ticketmaster: serializableEvents.filter(e => e.source === 'ticketmaster').length,
          realTime: serializableEvents.filter(e => e.source === 'realtime').length,
          eventbrite: serializableEvents.filter(e => e.source === 'eventbrite').length
        },
        errors: errors.length > 0 ? errors : undefined
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in fetch-events function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: 'Failed to fetch events'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});