# Nearby Places Search API Implementation Guide

## Overview
The Nearby Places Search API, available through RapidAPI, provides a versatile solution for integrating location-based search into applications. This API allows developers to discover and retrieve information about establishments and points of interest within a defined geographical area, specified either by a user's current location or a specific address. This document provides implementation details and code examples for integrating with the Nearby Places Search API.

## Authentication
Access to the Nearby Places Search API on RapidAPI requires:

1. A RapidAPI account
2. Subscription to the Nearby Places Search API
3. An API key from RapidAPI

## Key Endpoints

### 1. Search Nearby Places

**Endpoint:** `GET https://search-nearby-places.p.rapidapi.com/nearby`

**Description:** Searches for nearby places and points of interest based on location coordinates and search parameters.

**Sample Request:**

```javascript
// JavaScript Example - Search Nearby Places
const axios = require('axios');

async function searchNearbyPlaces(apiKey, lat, lng, radius = 1000, type = 'restaurant', limit = 20) {
  try {
    const response = await axios.get('https://search-nearby-places.p.rapidapi.com/nearby', {
      params: {
        lat: lat,
        lng: lng,
        radius: radius,
        type: type,
        limit: limit
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'search-nearby-places.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching nearby places:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage - Finding restaurants within 1000m of a location
searchNearbyPlaces('YOUR_RAPIDAPI_KEY', '40.7128', '-74.0060', 1000, 'restaurant', 10)
  .then(data => {
    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} nearby places`);
      data.results.forEach(place => {
        console.log(`- ${place.name}`);
        console.log(`  Address: ${place.address}`);
        console.log(`  Distance: ${place.distance} meters`);
        console.log(`  Rating: ${place.rating}/5`);
        console.log('-------------------');
      });
    } else {
      console.log('No nearby places found');
    }
  })
  .catch(err => console.error('Failed to search nearby places:', err));
```

```python
# Python Example - Search Nearby Places
import requests

def search_nearby_places(api_key, lat, lng, radius=1000, type='restaurant', limit=20):
    url = "https://search-nearby-places.p.rapidapi.com/nearby"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "search-nearby-places.p.rapidapi.com"
    }
    
    params = {
        "lat": lat,
        "lng": lng,
        "radius": radius,
        "type": type,
        "limit": limit
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching nearby places: {response.text}")

# Example usage - Finding attractions within 2000m of a location
try:
    data = search_nearby_places('YOUR_RAPIDAPI_KEY', '48.8566', '2.3522', 2000, 'tourist_attraction', 15)
    if 'results' in data and data['results']:
        print(f"Found {len(data['results'])} nearby places")
        for place in data['results']:
            print(f"- {place['name']}")
            print(f"  Address: {place['address']}")
            print(f"  Distance: {place['distance']} meters")
            print(f"  Rating: {place['rating']}/5")
            print('-------------------')
    else:
        print("No nearby places found")
except Exception as e:
    print(f"Failed to search nearby places: {str(e)}")
```

### 2. Search by Address

**Endpoint:** `GET https://search-nearby-places.p.rapidapi.com/address`

**Description:** Searches for nearby places using a specific address as the center point.

**Sample Request:**

```javascript
// JavaScript Example - Search by Address
async function searchByAddress(apiKey, address, radius = 1000, type = 'restaurant', limit = 20) {
  try {
    const response = await axios.get('https://search-nearby-places.p.rapidapi.com/address', {
      params: {
        address: address,
        radius: radius,
        type: type,
        limit: limit
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'search-nearby-places.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching by address:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage - Finding cafes within 800m of a specific address
searchByAddress('YOUR_RAPIDAPI_KEY', '350 5th Ave, New York, NY 10118', 800, 'cafe', 10)
  .then(data => {
    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} nearby places`);
      data.results.forEach(place => {
        console.log(`- ${place.name}`);
        console.log(`  Address: ${place.address}`);
        console.log(`  Distance: ${place.distance} meters`);
        console.log(`  Category: ${place.type}`);
        console.log('-------------------');
      });
    } else {
      console.log('No nearby places found');
    }
  })
  .catch(err => console.error('Failed to search by address:', err));
```

```python
# Python Example - Search by Address
def search_by_address(api_key, address, radius=1000, type='restaurant', limit=20):
    url = "https://search-nearby-places.p.rapidapi.com/address"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "search-nearby-places.p.rapidapi.com"
    }
    
    params = {
        "address": address,
        "radius": radius,
        "type": type,
        "limit": limit
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching by address: {response.text}")

# Example usage - Finding bars within 500m of a specific address
try:
    data = search_by_address('YOUR_RAPIDAPI_KEY', '123 Main St, San Francisco, CA', 500, 'bar', 10)
    if 'results' in data and data['results']:
        print(f"Found {len(data['results'])} nearby places")
        for place in data['results']:
            print(f"- {place['name']}")
            print(f"  Address: {place['address']}")
            print(f"  Distance: {place['distance']} meters")
            print(f"  Category: {place['type']}")
            print('-------------------')
    else:
        print("No nearby places found")
except Exception as e:
    print(f"Failed to search by address: {str(e)}")
```

### 3. Get Place Details

**Endpoint:** `GET https://search-nearby-places.p.rapidapi.com/details`

**Description:** Retrieves detailed information about a specific place based on its unique place ID.

**Sample Request:**

```javascript
// JavaScript Example - Get Place Details
async function getPlaceDetails(apiKey, placeId) {
  try {
    const response = await axios.get('https://search-nearby-places.p.rapidapi.com/details', {
      params: {
        place_id: placeId
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'search-nearby-places.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting place details:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
getPlaceDetails('YOUR_RAPIDAPI_KEY', 'ChIJN1t_tDeuEmsRUsoyG83frY4')
  .then(data => {
    if (data.result) {
      console.log('Place Details:');
      console.log(`Name: ${data.result.name}`);
      console.log(`Address: ${data.result.formatted_address}`);
      console.log(`Phone: ${data.result.formatted_phone_number}`);
      console.log(`Website: ${data.result.website}`);
      console.log(`Rating: ${data.result.rating}/5 (${data.result.user_ratings_total} reviews)`);
      console.log(`Open Now: ${data.result.opening_hours?.open_now ? 'Yes' : 'No'}`);
      
      if (data.result.opening_hours?.weekday_text) {
        console.log('Opening Hours:');
        data.result.opening_hours.weekday_text.forEach(day => console.log(`  ${day}`));
      }
    } else {
      console.log('No place details found');
    }
  })
  .catch(err => console.error('Failed to get place details:', err));
```

```python
# Python Example - Get Place Details
def get_place_details(api_key, place_id):
    url = "https://search-nearby-places.p.rapidapi.com/details"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "search-nearby-places.p.rapidapi.com"
    }
    
    params = {
        "place_id": place_id
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error getting place details: {response.text}")

# Example usage
try:
    data = get_place_details('YOUR_RAPIDAPI_KEY', 'ChIJN1t_tDeuEmsRUsoyG83frY4')
    if 'result' in data:
        print('Place Details:')
        print(f"Name: {data['result']['name']}")
        print(f"Address: {data['result']['formatted_address']}")
        print(f"Phone: {data['result'].get('formatted_phone_number', 'N/A')}")
        print(f"Website: {data['result'].get('website', 'N/A')}")
        print(f"Rating: {data['result'].get('rating', 'N/A')}/5 ({data['result'].get('user_ratings_total', '0')} reviews)")
        
        if 'opening_hours' in data['result'] and 'open_now' in data['result']['opening_hours']:
            print(f"Open Now: {'Yes' if data['result']['opening_hours']['open_now'] else 'No'}")
        
        if 'opening_hours' in data['result'] and 'weekday_text' in data['result']['opening_hours']:
            print('Opening Hours:')
            for day in data['result']['opening_hours']['weekday_text']:
                print(f"  {day}")
    else:
        print("No place details found")
except Exception as e:
    print(f"Failed to get place details: {str(e)}")
```

## Available Parameters

### Nearby Search Endpoint

| Parameter | Description | Required | Example |
|-----------|-------------|----------|--------|
| `lat` | Latitude of the center point | Yes | `"40.7128"` |
| `lng` | Longitude of the center point | Yes | `"-74.0060"` |
| `radius` | Radius in meters (max 50000) | No | `1000`, `5000` |
| `type` | Type of place to search for | No | `"restaurant"`, `"cafe"`, `"park"` |
| `keyword` | Additional keyword to filter by | No | `"pizza"`, `"coffee"` |
| `limit` | Maximum number of results | No | `10`, `20`, `50` |
| `language` | Language for results | No | `"en"`, `"es"`, `"fr"` |

### Address Search Endpoint

| Parameter | Description | Required | Example |
|-----------|-------------|----------|--------|
| `address` | Full address to search around | Yes | `"350 5th Ave, New York, NY 10118"` |
| `radius` | Radius in meters (max 50000) | No | `1000`, `5000` |
| `type` | Type of place to search for | No | `"restaurant"`, `"cafe"`, `"park"` |
| `keyword` | Additional keyword to filter by | No | `"pizza"`, `"coffee"` |
| `limit` | Maximum number of results | No | `10`, `20`, `50` |
| `language` | Language for results | No | `"en"`, `"es"`, `"fr"` |

### Place Details Endpoint

| Parameter | Description | Required | Example |
|-----------|-------------|----------|--------|
| `place_id` | Unique identifier for the place | Yes | `"ChIJN1t_tDeuEmsRUsoyG83frY4"` |
| `language` | Language for results | No | `"en"`, `"es"`, `"fr"` |

## Response Structure Example

### Nearby Search Response

```json
{
  "status": "OK",
  "results": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Museum of Modern Art",
      "address": "11 W 53rd St, New York, NY 10019, USA",
      "location": {
        "lat": 40.7614327,
        "lng": -73.9776216
      },
      "distance": 354,
      "rating": 4.5,
      "user_ratings_total": 45267,
      "type": "museum",
      "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/museum-71.png",
      "open_now": true,
      "photos": [
        {
          "photo_reference": "AcYSjRgUXr29TmgkjJ6t3TZiIKRRLrBiQKRCX1G9qOQa0v-cL7nHQYV5Xd9Eu5iMXHDxP0z1n_-wbQmafaxLVjw",
          "width": 4032,
          "height": 3024
        }
      ]
    },
    {
      "place_id": "ChIJaXQRs6lZwokRY6EFpJnhNNE",
      "name": "Central Park",
      "address": "Central Park, New York, NY, USA",
      "location": {
        "lat": 40.7812199,
        "lng": -73.9665138
      },
      "distance": 872,
      "rating": 4.8,
      "user_ratings_total": 234890,
      "type": "park",
      "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/park-71.png",
      "open_now": true,
      "photos": [
        {
          "photo_reference": "AcYSjRgPtliG3J5VJWHY6QHl98yb2BFC2G8WxdyTI1XrVUU-jvV5BQ3-wSF4AGuMm4jS1",
          "width": 4032,
          "height": 3024
        }
      ]
    }
  ],
  "next_page_token": "AbcDEfGhIjKl_123456789"
}
```

### Place Details Response

```json
{
  "status": "OK",
  "result": {
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "name": "Museum of Modern Art",
    "formatted_address": "11 W 53rd St, New York, NY 10019, USA",
    "formatted_phone_number": "(212) 708-9400",
    "international_phone_number": "+1 212-708-9400",
    "website": "https://www.moma.org/",
    "rating": 4.5,
    "user_ratings_total": 45267,
    "types": ["museum", "tourist_attraction", "point_of_interest", "establishment"],
    "opening_hours": {
      "open_now": true,
      "weekday_text": [
        "Monday: 10:30 AM – 5:30 PM",
        "Tuesday: 10:30 AM – 5:30 PM",
        "Wednesday: 10:30 AM – 5:30 PM",
        "Thursday: 10:30 AM – 5:30 PM",
        "Friday: 10:30 AM – 8:00 PM",
        "Saturday: 10:30 AM – 5:30 PM",
        "Sunday: 10:30 AM – 5:30 PM"
      ],
      "periods": [...]
    },
    "geometry": {
      "location": {
        "lat": 40.7614327,
        "lng": -73.9776216
      },
      "viewport": {...}
    },
    "photos": [
      {
        "height": 3024,
        "width": 4032,
        "html_attributions": [...],
        "photo_reference": "AcYSjRgUXr29TmgkjJ6t3TZiIKRRLrBiQKRCX1G9qOQa0v-cL7nHQYV5Xd9Eu5iMXHDxP0z1n_-wbQmafaxLVjw"
      },
      {...}
    ],
    "reviews": [
      {
        "author_name": "John Smith",
        "author_url": "https://www.google.com/maps/contrib/117631995892939597610/reviews",
        "profile_photo_url": "https://lh3.googleusercontent.com/a-/AOh14GhVQpiBTeJLsgYd-LY-8qYV9SD-54jTp-fwl7ql=s128-c0x00000000-cc-rp-mo-ba4",
        "rating": 5,
        "relative_time_description": "2 weeks ago",
        "text": "Amazing collection of modern art...",
        "time": 1618329876
      },
      {...}
    ],
    "url": "https://maps.google.com/?cid=1357627985207111706",
    "utc_offset": -240,
    "vicinity": "11 West 53rd Street, New York",
    "price_level": 2
  }
}
```

## Common Use Cases

1. **Location-Based Services**: Find nearby restaurants, attractions, or services based on the user's current location
2. **Travel Apps**: Help travelers discover points of interest near their hotel or in a specific area
3. **Real Estate Apps**: Show amenities and services near a property listing
4. **Event Planning**: Find venues and services near an event location
5. **Local Business Search**: Allow users to find businesses based on type and proximity

## Best Practices

1. **Caching**: Cache results to reduce API calls, especially for popular locations
2. **Progressive Loading**: Load basic information first, then fetch details only when needed
3. **Error Handling**: Implement robust error handling for API calls
4. **User Experience**: Allow users to filter results by distance, rating, or other criteria
5. **Geolocation Permission**: Always request user permission before accessing their location

## Implementation Tips

1. **Distance Display**: Convert distances to appropriate units (meters/kilometers or feet/miles) based on user locale
2. **Opening Hours Formatting**: Format opening hours in a user-friendly way
3. **Radius Optimization**: Start with a smaller radius and expand if too few results are found
4. **Filtering Options**: Provide users with filtering options to narrow down results
5. **Photo Handling**: Implement fallback images for places without photos

## Resources

- [Nearby Places Search API on RapidAPI](https://rapidapi.com/generateapis-generateapis-default/api/search-nearby-places)
- [RapidAPI Documentation](https://docs.rapidapi.com/)
