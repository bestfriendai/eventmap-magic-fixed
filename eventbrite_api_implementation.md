# Eventbrite API Implementation Guide

## Overview
This document provides implementation details for the Eventbrite API integration in our application. The Eventbrite API allows us to search for events based on location and other parameters.

## Authentication
Eventbrite API uses OAuth 2.0 for authentication, but for our application, we're using a Private Token approach:

1. Create a free Eventbrite account
2. Register your application in the [Eventbrite Developer Portal](https://www.eventbrite.com/platform/)
3. Generate a Private Token from your account settings

## Environment Variables
The application requires the following environment variables:

```
EVENTBRITE_PRIVATE_TOKEN=your_private_token_here
```

For local development, add this to your `.env.local` file. For production, set this in your Netlify environment variables.

## Implementation Architecture

Our Eventbrite integration uses a proxy approach to avoid exposing API keys in client-side code:

1. **Client-side code** (`src/services/eventbrite-rapidapi.ts`): Makes requests to our Netlify function
2. **Netlify function** (`netlify/functions/eventbrite-proxy.ts`): Acts as a proxy to the Eventbrite API
3. **Supabase function** (`supabase/functions/fetch-events/eventbrite.ts`): Alternative server-side implementation

### Client-Side Implementation

```typescript
// src/services/eventbrite-rapidapi.ts
import { Event } from '../types';

// Use the Eventbrite credentials from environment variables
const EVENTBRITE_PRIVATE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN;

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
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    // Use the Netlify proxy function
    const baseUrl = window.location.hostname === 'localhost' ? '' : 'https://dateapril.netlify.app';
    const proxyUrl = `${baseUrl}/.netlify/functions/eventbrite-proxy?latitude=${params.latitude}&longitude=${params.longitude}&radius=${radius}mi&start_date_range_start=${formattedDate}T00:00:00`;
    
    const eventResponse = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      throw new Error(`Eventbrite API error: ${eventResponse.status} - ${errorText}`);
    }

    const eventData = await eventResponse.json();

    if (!eventData.events || !Array.isArray(eventData.events)) {
      console.log('No events found in Eventbrite response');
      return [];
    }

    // Process events and return
    const events = eventData.events
      .map((event: any) => {
        try {
          // Skip events without venue coordinates
          if (!event.venue?.latitude || !event.venue?.longitude) {
            return null;
          }

          // Process event data and return formatted event
          return {
            id: `eb-${event.id}`,
            title: event.name.text,
            description: event.description?.text || 'No description available',
            // ... other fields
          };
        } catch (error) {
          console.error('Error processing Eventbrite event:', error);
          return null;
        }
      })
      .filter(Boolean);

    return events;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in Eventbrite event search:', error);
    return [];
  }
}
```

### Netlify Function (Proxy)

```typescript
// netlify/functions/eventbrite-proxy.ts
import { Handler } from '@netlify/functions';

const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN;

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!EVENTBRITE_PRIVATE_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Eventbrite token not configured' }) };
  }

  const { latitude, longitude, radius = '100mi', start_date_range_start } = event.queryStringParameters || {};

  if (!latitude || !longitude) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Latitude and longitude are required' }) };
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = start_date_range_start || `${today}T00:00:00`;

  const searchUrl = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${latitude}&location.longitude=${longitude}&location.within=${radius}&start_date.range_start=${startDate}&expand=venue,ticket_availability,category,organizer`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eventbrite API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Eventbrite Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: errorMessage }) };
  }
};
```

## API Endpoints

### Search Events

**Endpoint:** `GET /v3/events/search/`

**Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `location.latitude` | Latitude coordinate | `37.7749` |
| `location.longitude` | Longitude coordinate | `-122.4194` |
| `location.within` | Search radius | `10mi` |
| `start_date.range_start` | Start date for events | `2023-01-01T00:00:00` |
| `expand` | Additional data to include | `venue,ticket_availability,category,organizer` |

**Response Structure:**

```json
{
  "pagination": {
    "object_count": 42,
    "page_number": 1,
    "page_size": 50,
    "page_count": 1,
    "has_more_items": false
  },
  "events": [
    {
      "name": {
        "text": "Example Event",
        "html": "<p>Example Event</p>"
      },
      "description": {
        "text": "This is an example event description.",
        "html": "<p>This is an example event description.</p>"
      },
      "id": "123456789",
      "url": "https://www.eventbrite.com/e/example-event-tickets-123456789",
      "start": {
        "timezone": "America/Los_Angeles",
        "local": "2023-06-15T19:00:00",
        "utc": "2023-06-16T02:00:00Z"
      },
      "end": {
        "timezone": "America/Los_Angeles",
        "local": "2023-06-15T22:00:00",
        "utc": "2023-06-16T05:00:00Z"
      },
      "venue": {
        "id": "987654321",
        "name": "Example Venue",
        "address": {
          "address_1": "123 Main St",
          "address_2": "Suite 100",
          "city": "San Francisco",
          "region": "CA",
          "postal_code": "94105",
          "country": "US",
          "latitude": "37.7749",
          "longitude": "-122.4194"
        }
      },
      "category": {
        "id": "103",
        "name": "Music"
      },
      "is_free": false,
      "ticket_availability": {
        "minimum_ticket_price": {
          "currency": "USD",
          "major_value": "25.00"
        }
      }
    }
  ]
}
```

## Error Handling

The application implements robust error handling:

1. **Client-side**: Catches and logs errors, with fallback to empty array
2. **Netlify function**: Returns appropriate HTTP status codes with error messages
3. **Supabase function**: Logs detailed error information

## Best Practices

1. **Never expose API keys in client-side code** - Use environment variables and server-side proxies
2. **Implement timeouts** - Prevent hanging requests with appropriate timeouts
3. **Detailed logging** - Log request parameters and response status for debugging
4. **Graceful degradation** - Handle API failures without breaking the application
5. **Data validation** - Validate API responses before processing

## Resources

- [Eventbrite API Reference](https://www.eventbrite.com/platform/api)
- [Eventbrite Developer Documentation](https://www.eventbrite.com/platform/docs/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
