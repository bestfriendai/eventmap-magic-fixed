# Eventbrite API Implementation Guide

## Overview
The Eventbrite API allows developers to interact with Eventbrite's event platform to search events, create events, manage attendees, and more. This document provides implementation details and code examples to help you integrate with the Eventbrite API.

## Authentication
Eventbrite API uses OAuth 2.0 for authentication. You'll need to:

1. Create a free Eventbrite account
2. Register your application in the [Eventbrite Developer Portal](https://www.eventbrite.com/platform/)
3. Obtain your OAuth credentials (Client ID and Client Secret)

### Authentication Flow

```javascript
// JavaScript Example - OAuth 2.0 Authentication
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

// Step 1: Redirect user to Eventbrite authorization page
app.get('/authorize', (req, res) => {
  res.redirect(
    `https://www.eventbrite.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`
  );
});

// Step 2: Handle the callback and exchange the code for an access token
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const response = await axios.post('https://www.eventbrite.com/oauth/token', null, {
      params: {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      }
    });
    
    const { access_token } = response.data;
    // Store this token securely for future API calls
    res.send('Authentication successful!');
  } catch (error) {
    console.error('Auth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

app.listen(3000, () => console.log('Server listening on port 3000'));
```

```python
# Python Example - OAuth 2.0 Authentication
import requests
from flask import Flask, request, redirect

app = Flask(__name__)

CLIENT_ID = 'YOUR_CLIENT_ID'
CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
REDIRECT_URI = 'http://localhost:5000/oauth/callback'

@app.route('/authorize')
def authorize():
    return redirect(
        f'https://www.eventbrite.com/oauth/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}'
    )

@app.route('/oauth/callback')
def callback():
    code = request.args.get('code')
    
    response = requests.post('https://www.eventbrite.com/oauth/token', params={
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT_URI
    })
    
    if response.status_code == 200:
        access_token = response.json()['access_token']
        # Store this token securely for future API calls
        return 'Authentication successful!'
    else:
        return f'Authentication failed: {response.text}', 500

if __name__ == '__main__':
    app.run(port=5000)
```

## Key Endpoints

### 1. Search Events

**Endpoint:** `GET /v3/events/search/`

**Description:** Search for events based on various parameters like location, category, keyword, etc.

**Sample Request:**

```javascript
// JavaScript Example - Search Events
const axios = require('axios');

async function searchEvents(accessToken, query, location) {
  try {
    const response = await axios.get('https://www.eventbriteapi.com/v3/events/search/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        'q': query,               // Search keyword
        'location.address': location, // Location
        'expand': 'venue,category',   // Include venue and category info
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching events:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
searchEvents('YOUR_ACCESS_TOKEN', 'concert', 'San Francisco')
  .then(data => console.log('Events found:', data.events.length))
  .catch(err => console.error('Failed to search events:', err));
```

```python
# Python Example - Search Events
import requests

def search_events(access_token, query, location):
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    params = {
        'q': query,                # Search keyword
        'location.address': location,  # Location
        'expand': 'venue,category'     # Include venue and category info
    }
    
    response = requests.get(
        'https://www.eventbriteapi.com/v3/events/search/',
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching events: {response.text}")

# Example usage
try:
    events_data = search_events('YOUR_ACCESS_TOKEN', 'concert', 'San Francisco')
    print(f"Events found: {len(events_data['events'])}")
except Exception as e:
    print(f"Failed to search events: {str(e)}")
```

### 2. Get Event Details

**Endpoint:** `GET /v3/events/{event_id}/`

**Description:** Retrieves detailed information about a specific event.

**Sample Request:**

```javascript
// JavaScript Example - Get Event Details
async function getEventDetails(accessToken, eventId) {
  try {
    const response = await axios.get(`https://www.eventbriteapi.com/v3/events/${eventId}/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        'expand': 'venue,ticket_classes,organizer'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting event details:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
getEventDetails('YOUR_ACCESS_TOKEN', '123456789')
  .then(event => console.log('Event details:', event.name.text))
  .catch(err => console.error('Failed to get event details:', err));
```

```python
# Python Example - Get Event Details
def get_event_details(access_token, event_id):
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    params = {
        'expand': 'venue,ticket_classes,organizer'
    }
    
    response = requests.get(
        f'https://www.eventbriteapi.com/v3/events/{event_id}/',
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error getting event details: {response.text}")

# Example usage
try:
    event = get_event_details('YOUR_ACCESS_TOKEN', '123456789')
    print(f"Event details: {event['name']['text']}")
except Exception as e:
    print(f"Failed to get event details: {str(e)}")
```

### 3. Create an Event

**Endpoint:** `POST /v3/events/`

**Description:** Creates a new event on Eventbrite.

**Sample Request:**

```javascript
// JavaScript Example - Create an Event
async function createEvent(accessToken, eventData) {
  try {
    const response = await axios.post('https://www.eventbriteapi.com/v3/events/', eventData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
const newEvent = {
  "event": {
    "name": {
      "html": "Sample Event"
    },
    "description": {
      "html": "<p>This is a sample event created via the Eventbrite API.</p>"
    },
    "start": {
      "timezone": "America/Los_Angeles",
      "utc": "2025-05-15T22:00:00Z"
    },
    "end": {
      "timezone": "America/Los_Angeles",
      "utc": "2025-05-16T01:00:00Z"
    },
    "currency": "USD",
    "venue_id": "YOUR_VENUE_ID",
    "organizer_id": "YOUR_ORGANIZER_ID",
    "listed": true,
    "capacity": 100,
    "category_id": "103", // Music category
    "format_id": "1",     // Conference format
  }
};

createEvent('YOUR_ACCESS_TOKEN', newEvent)
  .then(createdEvent => console.log('Event created:', createdEvent.id))
  .catch(err => console.error('Failed to create event:', err));
```

```python
# Python Example - Create an Event
import json

def create_event(access_token, event_data):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        'https://www.eventbriteapi.com/v3/events/',
        headers=headers,
        data=json.dumps(event_data)
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error creating event: {response.text}")

# Example usage
new_event = {
    "event": {
        "name": {
            "html": "Sample Event"
        },
        "description": {
            "html": "<p>This is a sample event created via the Eventbrite API.</p>"
        },
        "start": {
            "timezone": "America/Los_Angeles",
            "utc": "2025-05-15T22:00:00Z"
        },
        "end": {
            "timezone": "America/Los_Angeles",
            "utc": "2025-05-16T01:00:00Z"
        },
        "currency": "USD",
        "venue_id": "YOUR_VENUE_ID",
        "organizer_id": "YOUR_ORGANIZER_ID",
        "listed": True,
        "capacity": 100,
        "category_id": "103", # Music category
        "format_id": "1",     # Conference format
    }
}

try:
    created_event = create_event('YOUR_ACCESS_TOKEN', new_event)
    print(f"Event created: {created_event['id']}")
except Exception as e:
    print(f"Failed to create event: {str(e)}")
```

## Response Structure Example

Here's an example of the event structure returned by the API:

```json
{
  "name": {
    "text": "Example Event",
    "html": "Example Event"
  },
  "description": {
    "text": "This is an example event.",
    "html": "<p>This is an example event.</p>"
  },
  "id": "12345",
  "url": "https://www.eventbrite.com/e/example-event-tickets-12345",
  "start": {
    "timezone": "America/Los_Angeles",
    "local": "2025-05-15T15:00:00",
    "utc": "2025-05-15T22:00:00Z"
  },
  "end": {
    "timezone": "America/Los_Angeles",
    "local": "2025-05-15T18:00:00",
    "utc": "2025-05-16T01:00:00Z"
  },
  "organization_id": "67890",
  "created": "2024-04-10T12:00:00Z",
  "changed": "2024-04-10T12:00:00Z",
  "capacity": 100,
  "capacity_is_custom": false,
  "status": "live",
  "currency": "USD",
  "listed": true,
  "shareable": true,
  "online_event": false,
  "tx_time_limit": 480,
  "hide_start_date": false,
  "hide_end_date": false,
  "locale": "en_US",
  "is_locked": false,
  "privacy_setting": "unlocked",
  "is_series": false,
  "is_series_parent": false,
  "is_reserved_seating": false,
  "show_pick_a_seat": false,
  "show_seatmap_thumbnail": false,
  "show_colors_in_seatmap_thumbnail": false,
  "source": "create_2.0",
  "is_free": false,
  "version": "3.0.0",
  "summary": "This is an example event.",
  "logo_id": null,
  "organizer_id": "98765",
  "venue_id": "54321",
  "category_id": "103",
  "subcategory_id": null,
  "format_id": "1",
  "resource_uri": "https://www.eventbriteapi.com/v3/events/12345/",
  "is_externally_ticketed": false,
  "logo": null
}
```

## Common Use Cases

1. **Event Discovery App**: Use the search endpoint to display events based on user location and preferences
2. **Event Management**: Create and update events programmatically
3. **Ticketing Integration**: Sell tickets through your platform using Eventbrite's infrastructure
4. **Analytics Dashboard**: Track event performance and attendance

## Best Practices

1. **Rate Limiting**: The Eventbrite API has rate limits. Implement appropriate caching and respect the rate limits to avoid being blocked.
2. **Error Handling**: Always implement robust error handling for API calls.
3. **Webhooks**: For real-time updates, use Eventbrite's webhook functionality instead of frequent polling.
4. **Pagination**: When retrieving large datasets, implement pagination to improve performance.
5. **Security**: Never expose your OAuth credentials in client-side code.

## Resources

- [Eventbrite API Reference](https://www.eventbrite.com/platform/api)
- [Eventbrite Developer Documentation](https://www.eventbrite.com/platform/docs/)
- [Eventbrite API SDKs](https://github.com/eventbrite)
