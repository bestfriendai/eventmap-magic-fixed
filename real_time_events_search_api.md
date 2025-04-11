# Real-Time Events Search API Implementation Guide

## Overview
The Real-Time Events Search API, available through RapidAPI, allows developers to search for events found on the web in real-time. This includes concerts, sporting events, workshops, festivals, movies, and more types of events supported by Google Events. This document provides implementation details and code examples for integrating with the Real-Time Events Search API.

## Authentication
Access to the Real-Time Events Search API on RapidAPI requires:

1. A RapidAPI account
2. Subscription to the Real-Time Events Search API
3. An API key from RapidAPI

## Key Endpoints

### 1. Search Events

**Endpoint:** `GET https://real-time-events-search.p.rapidapi.com/search-events`

**Description:** Searches for events based on a query string and location.

**Sample Request:**

```javascript
// JavaScript Example - Search Events
const axios = require('axios');

async function searchEvents(apiKey, query, location, fromDate = null, maxResults = 20) {
  try {
    const params = {
      query: query,
      location: location,
      maxResults: maxResults
    };

    // Add fromDate if provided
    if (fromDate) {
      params.fromDate = fromDate;
    }

    const response = await axios.get('https://real-time-events-search.p.rapidapi.com/search-events', {
      params: params,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-events-search.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching events:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
searchEvents('YOUR_RAPIDAPI_KEY', 'concerts', 'New York', '2024-05-01')
  .then(data => {
    if (data.events && data.events.length > 0) {
      console.log(`Found ${data.events.length} events`);
      data.events.forEach(event => {
        console.log(`- ${event.title}`);
        console.log(`  When: ${event.date}`);
        console.log(`  Where: ${event.venue}`);
        console.log(`  URL: ${event.url}`);
        console.log('-------------------');
      });
    } else {
      console.log('No events found');
    }
  })
  .catch(err => console.error('Failed to search events:', err));
```

```python
# Python Example - Search Events
import requests

def search_events(api_key, query, location, from_date=None, max_results=20):
    url = "https://real-time-events-search.p.rapidapi.com/search-events"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "real-time-events-search.p.rapidapi.com"
    }
    
    params = {
        "query": query,
        "location": location,
        "maxResults": max_results
    }
    
    # Add fromDate if provided
    if from_date:
        params["fromDate"] = from_date
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching events: {response.text}")

# Example usage
try:
    data = search_events('YOUR_RAPIDAPI_KEY', 'concerts', 'New York', '2024-05-01')
    if 'events' in data and data['events']:
        print(f"Found {len(data['events'])} events")
        for event in data['events']:
            print(f"- {event['title']}")
            print(f"  When: {event['date']}")
            print(f"  Where: {event['venue']}")
            print(f"  URL: {event['url']}")
            print('-------------------')
    else:
        print("No events found")
except Exception as e:
    print(f"Failed to search events: {str(e)}")
```

### 2. Get Event Details

**Endpoint:** `GET https://real-time-events-search.p.rapidapi.com/event-details`

**Description:** Retrieves detailed information about a specific event based on its URL.

**Sample Request:**

```javascript
// JavaScript Example - Get Event Details
async function getEventDetails(apiKey, eventUrl) {
  try {
    const response = await axios.get('https://real-time-events-search.p.rapidapi.com/event-details', {
      params: {
        url: eventUrl
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-events-search.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting event details:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
getEventDetails('YOUR_RAPIDAPI_KEY', 'https://example.com/event/123')
  .then(data => {
    if (data) {
      console.log('Event Details:');
      console.log(`Title: ${data.title}`);
      console.log(`Date: ${data.date}`);
      console.log(`Time: ${data.time}`);
      console.log(`Location: ${data.location}`);
      console.log(`Venue: ${data.venue}`);
      console.log(`Description: ${data.description}`);
      console.log(`Price: ${data.price}`);
      console.log(`Organizer: ${data.organizer}`);
    } else {
      console.log('No event details found');
    }
  })
  .catch(err => console.error('Failed to get event details:', err));
```

```python
# Python Example - Get Event Details
def get_event_details(api_key, event_url):
    url = "https://real-time-events-search.p.rapidapi.com/event-details"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "real-time-events-search.p.rapidapi.com"
    }
    
    params = {
        "url": event_url
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error getting event details: {response.text}")

# Example usage
try:
    data = get_event_details('YOUR_RAPIDAPI_KEY', 'https://example.com/event/123')
    if data:
        print('Event Details:')
        print(f"Title: {data['title']}")
        print(f"Date: {data['date']}")
        print(f"Time: {data['time']}")
        print(f"Location: {data['location']}")
        print(f"Venue: {data['venue']}")
        print(f"Description: {data['description']}")
        print(f"Price: {data['price']}")
        print(f"Organizer: {data['organizer']}")
    else:
        print("No event details found")
except Exception as e:
    print(f"Failed to get event details: {str(e)}")
```

## Available Parameters

### Search Events Endpoint

| Parameter | Description | Required | Example |
|-----------|-------------|----------|--------|
| `query` | Search term for the events | Yes | `"concerts"`, `"festivals"` |
| `location` | Location to search in | Yes | `"New York"`, `"Chicago, IL"` |
| `fromDate` | Start date for the events (YYYY-MM-DD) | No | `"2024-05-01"` |
| `toDate` | End date for the events (YYYY-MM-DD) | No | `"2024-05-31"` |
| `maxResults` | Maximum number of results to return | No | `10`, `20`, `50` |
| `eventType` | Type of event | No | `"Concert"`, `"Festival"`, `"Sports"` |

### Event Details Endpoint

| Parameter | Description | Required | Example |
|-----------|-------------|----------|--------|
| `url` | URL of the event page | Yes | `"https://example.com/event/123"` |

## Response Structure Example

### Search Events Response

```json
{
  "status": "success",
  "events": [
    {
      "title": "The Weeknd - After Hours Tour",
      "date": "Saturday, June 22, 2024",
      "time": "8:00 PM",
      "venue": "Madison Square Garden",
      "location": "New York, NY",
      "url": "https://example.com/event/weeknd-after-hours-tour",
      "thumbnail": "https://example.com/images/weeknd-tour-thumbnail.jpg",
      "price": "$89 - $350",
      "category": "Concert"
    },
    {
      "title": "New York Jazz Festival",
      "date": "May 15-20, 2024",
      "time": "Various times",
      "venue": "Central Park",
      "location": "New York, NY",
      "url": "https://example.com/event/ny-jazz-festival",
      "thumbnail": "https://example.com/images/jazz-festival-thumbnail.jpg",
      "price": "$45 - $120",
      "category": "Festival"
    }
  ],
  "totalCount": 42,
  "pageInfo": {
    "currentPage": 1,
    "totalPages": 3
  }
}
```

### Event Details Response

```json
{
  "status": "success",
  "title": "The Weeknd - After Hours Tour",
  "date": "Saturday, June 22, 2024",
  "time": "8:00 PM",
  "venue": "Madison Square Garden",
  "location": {
    "address": "4 Pennsylvania Plaza",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  "description": "The Weeknd brings his After Hours Tour to Madison Square Garden for an unforgettable night of music. The show features songs from his latest album as well as hits from his extensive catalog.",
  "price": {
    "min": 89,
    "max": 350,
    "currency": "USD"
  },
  "organizer": "Live Nation",
  "category": "Concert",
  "tags": ["R&B", "Pop", "Live Music"],
  "images": [
    "https://example.com/images/weeknd-tour-1.jpg",
    "https://example.com/images/weeknd-tour-2.jpg"
  ],
  "ticketPurchaseUrl": "https://example.com/tickets/weeknd-after-hours-tour",
  "artists": [
    {
      "name": "The Weeknd",
      "role": "Headliner"
    },
    {
      "name": "Doja Cat",
      "role": "Opening Act"
    }
  ]
}
```

## Common Use Cases

1. **Event Discovery App**: Help users discover local events based on their interests and location
2. **Calendar Integration**: Allow users to add events to their personal calendars
3. **Ticket Purchasing Platform**: Show available events and link to ticket purchases
4. **Travel Planning**: Include local events as part of travel itineraries
5. **Social Event Sharing**: Enable users to share interesting events with friends

## Best Practices

1. **Caching**: Store event results to reduce API calls, especially for popular locations and searches
2. **Rate Limiting**: Be mindful of the API's rate limits based on your subscription plan
3. **Error Handling**: Implement robust error handling for API calls
4. **Data Validation**: Validate event details before displaying to users
5. **Responsive Design**: Ensure event listings are displayed properly on all device sizes

## Implementation Tips

1. **Search Optimization**: Use specific queries for better results (e.g., "jazz concerts" rather than just "music")
2. **Date Filtering**: Use the fromDate and toDate parameters to show upcoming events
3. **Pagination**: Implement pagination for large result sets using the maxResults parameter
4. **Fallback Handling**: Have a fallback plan if the API returns no results or is temporarily unavailable
5. **User Preferences**: Allow users to save event preferences to improve search recommendations

## Resources

- [Real-Time Events Search API on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-events-search)
- [RapidAPI Documentation](https://docs.rapidapi.com/)
