# TripAdvisor API Implementation Guide

## Overview
The TripAdvisor Content API provides access to TripAdvisor's content, including information about locations, reviews, photos, and more. This document provides implementation details and code examples for integrating with the TripAdvisor API, specifically through the RapidAPI platform.

## Authentication
Access to TripAdvisor API on RapidAPI requires:

1. A RapidAPI account
2. Subscription to the TripAdvisor API
3. An API key from RapidAPI

## Key Endpoints

### 1. Search Locations

**Endpoint:** `GET https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation`

**Description:** Searches for locations (restaurants, attractions, hotels) based on a query string.

**Sample Request:**

```javascript
// JavaScript Example - Search Locations
const axios = require('axios');

async function searchLocations(apiKey, query) {
  try {
    const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation', {
      params: {
        query: query
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching locations:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
searchLocations('YOUR_RAPIDAPI_KEY', 'New York')
  .then(data => {
    if (data.data && data.data.length > 0) {
      console.log(`Found ${data.data.length} locations`);
      console.log(data.data);
    } else {
      console.log('No locations found');
    }
  })
  .catch(err => console.error('Failed to search locations:', err));
```

```python
# Python Example - Search Locations
import requests

def search_locations(api_key, query):
    url = "https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "tripadvisor16.p.rapidapi.com"
    }
    
    params = {
        "query": query
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching locations: {response.text}")

# Example usage
try:
    data = search_locations('YOUR_RAPIDAPI_KEY', 'New York')
    if 'data' in data and data['data']:
        print(f"Found {len(data['data'])} locations")
        for location in data['data']:
            print(f"- {location['title']} (ID: {location['locationId']})")
    else:
        print("No locations found")
except Exception as e:
    print(f"Failed to search locations: {str(e)}")
```

### 2. Get Location Details

**Endpoint:** `GET https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails`

**Description:** Retrieves detailed information about a specific restaurant based on its location ID.

**Sample Request:**

```javascript
// JavaScript Example - Get Restaurant Details
async function getRestaurantDetails(apiKey, locationId, currency = "USD", language = "en_US") {
  try {
    const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails', {
      params: {
        locationId: locationId,
        currency: currency,
        language: language
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant details:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
getRestaurantDetails('YOUR_RAPIDAPI_KEY', '1234567')
  .then(data => {
    if (data.data) {
      console.log(`Restaurant details for: ${data.data.name}`);
      console.log(`Rating: ${data.data.rating} (${data.data.num_reviews} reviews)`);
      console.log(`Address: ${data.data.address}`);
    } else {
      console.log('No restaurant details found');
    }
  })
  .catch(err => console.error('Failed to get restaurant details:', err));
```

```python
# Python Example - Get Restaurant Details
def get_restaurant_details(api_key, location_id, currency="USD", language="en_US"):
    url = "https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "tripadvisor16.p.rapidapi.com"
    }
    
    params = {
        "locationId": location_id,
        "currency": currency,
        "language": language
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error getting restaurant details: {response.text}")

# Example usage
try:
    data = get_restaurant_details('YOUR_RAPIDAPI_KEY', '1234567')
    if 'data' in data:
        print(f"Restaurant details for: {data['data']['name']}")
        print(f"Rating: {data['data']['rating']} ({data['data']['num_reviews']} reviews)")
        print(f"Address: {data['data']['address']}")
    else:
        print("No restaurant details found")
except Exception as e:
    print(f"Failed to get restaurant details: {str(e)}")
```

### 3. Search Hotels

**Endpoint:** `GET https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels`

**Description:** Searches for hotels based on location, check-in/check-out dates, and other parameters.

**Sample Request:**

```javascript
// JavaScript Example - Search Hotels
async function searchHotels(apiKey, geoId, checkIn, checkOut, adults = 2, rooms = 1) {
  try {
    const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels', {
      params: {
        geoId: geoId,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: adults,
        rooms: rooms,
        currency: 'USD',
        language: 'en_US'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching hotels:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
searchHotels('YOUR_RAPIDAPI_KEY', '60763', '2024-07-15', '2024-07-18')
  .then(data => {
    if (data.data && data.data.data) {
      console.log(`Found ${data.data.data.length} hotels`);
      data.data.data.forEach(hotel => {
        console.log(`- ${hotel.title}`);
        console.log(`  Price: ${hotel.priceForDisplay}`);
        console.log(`  Rating: ${hotel.bubbleRating.rating}`);
      });
    } else {
      console.log('No hotels found');
    }
  })
  .catch(err => console.error('Failed to search hotels:', err));
```

```python
# Python Example - Search Hotels
def search_hotels(api_key, geo_id, check_in, check_out, adults=2, rooms=1):
    url = "https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "tripadvisor16.p.rapidapi.com"
    }
    
    params = {
        "geoId": geo_id,
        "checkIn": check_in,
        "checkOut": check_out,
        "adults": adults,
        "rooms": rooms,
        "currency": "USD",
        "language": "en_US"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error searching hotels: {response.text}")

# Example usage
try:
    data = search_hotels('YOUR_RAPIDAPI_KEY', '60763', '2024-07-15', '2024-07-18')
    if 'data' in data and 'data' in data['data']:
        print(f"Found {len(data['data']['data'])} hotels")
        for hotel in data['data']['data']:
            print(f"- {hotel['title']}")
            print(f"  Price: {hotel['priceForDisplay']}")
            print(f"  Rating: {hotel['bubbleRating']['rating']}")
    else:
        print("No hotels found")
except Exception as e:
    print(f"Failed to search hotels: {str(e)}")
```

### 4. Get Attraction Reviews

**Endpoint:** `GET https://tripadvisor16.p.rapidapi.com/api/v1/attraction/getAttractionReviews`

**Description:** Retrieves reviews for a specific attraction based on its location ID.

**Sample Request:**

```javascript
// JavaScript Example - Get Attraction Reviews
async function getAttractionReviews(apiKey, locationId, limit = 10, language = "en_US") {
  try {
    const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/attraction/getAttractionReviews', {
      params: {
        locationId: locationId,
        limit: limit,
        language: language
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting attraction reviews:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
getAttractionReviews('YOUR_RAPIDAPI_KEY', '7845789', 5)
  .then(data => {
    if (data.data && data.data.data) {
      console.log(`Reviews for attraction:`);
      data.data.data.forEach((review, index) => {
        console.log(`Review #${index + 1}:`);
        console.log(`- Rating: ${review.rating} stars`);
        console.log(`- Title: ${review.title}`);
        console.log(`- Text: ${review.text}`);
        console.log(`- Date: ${review.publishedDate}`);
        console.log('-------------------');
      });
    } else {
      console.log('No reviews found');
    }
  })
  .catch(err => console.error('Failed to get attraction reviews:', err));
```

```python
# Python Example - Get Attraction Reviews
def get_attraction_reviews(api_key, location_id, limit=10, language="en_US"):
    url = "https://tripadvisor16.p.rapidapi.com/api/v1/attraction/getAttractionReviews"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "tripadvisor16.p.rapidapi.com"
    }
    
    params = {
        "locationId": location_id,
        "limit": limit,
        "language": language
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error getting attraction reviews: {response.text}")

# Example usage
try:
    data = get_attraction_reviews('YOUR_RAPIDAPI_KEY', '7845789', 5)
    if 'data' in data and 'data' in data['data']:
        print("Reviews for attraction:")
        for i, review in enumerate(data['data']['data']):
            print(f"Review #{i + 1}:")
            print(f"- Rating: {review['rating']} stars")
            print(f"- Title: {review['title']}")
            print(f"- Text: {review['text']}")
            print(f"- Date: {review['publishedDate']}")
            print('-------------------')
    else:
        print("No reviews found")
except Exception as e:
    print(f"Failed to get attraction reviews: {str(e)}")
```

## Response Structure Example

Here's an example of the location search response structure:

```json
{
  "status": true,
  "message": "Success",
  "timestamp": 1712976456941,
  "data": [
    {
      "locationId": "60763",
      "title": "New York City, NY",
      "address": "New York City, NY",
      "latitude": "40.75906",
      "longitude": "-73.98434",
      "type": "CITY",
      "subnationalGeoId": "28953",
      "subcategory": [
        {
          "key": "city",
          "name": "City"
        }
      ],
      "parent": {
        "locationId": "28953",
        "title": "New York",
        "address": "New York"
      }
    },
    {
      "locationId": "47384",
      "title": "New York, NY",
      "address": "New York, NY",
      "latitude": "40.71427",
      "longitude": "-74.00597",
      "type": "ACCOMMODATION",
      "subcategory": [
        {
          "key": "hotel",
          "name": "Hotel"
        }
      ]
    }
  ]
}
```

## Common Use Cases

1. **Travel Planning App**: Help users discover restaurants, attractions, and accommodation
2. **Review Aggregation**: Display TripAdvisor reviews alongside other review sources
3. **Local Business Information**: Enhance business listings with TripAdvisor data
4. **Destination Guides**: Create comprehensive travel guides with ratings and reviews

## Best Practices

1. **Caching**: Store results to reduce API calls and improve performance
2. **Error Handling**: Implement robust error handling for API calls
3. **Rate Limit Management**: Be mindful of API rate limits based on your subscription plan
4. **Data Attribution**: Always attribute TripAdvisor as the data source and follow their branding guidelines
5. **User Experience**: Use the data to enhance user experience, not just display raw API results

## Implementation Tips

1. **Location IDs**: Store location IDs for frequently accessed places to avoid repeated searches
2. **Pagination Handling**: Implement pagination for reviews and search results
3. **Multilingual Support**: Use the language parameter to fetch content in the user's preferred language
4. **Filter Reviews**: Allow users to filter reviews by rating, date, or keywords

## Resources

- [TripAdvisor Content API Documentation](https://developer-tripadvisor.com/content-api/)
- [RapidAPI TripAdvisor API Page](https://rapidapi.com/DataCrawler/api/tripadvisor16)
- [TripAdvisor Developer Portal](https://developer-tripadvisor.com/home/)
