import { Handler } from '@netlify/functions';

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9';
const TRIPADVISOR_HOST = 'tripadvisor16.p.rapidapi.com';
const SEARCH_LOCATION_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation';
const SEARCH_RESTAURANTS_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchRestaurants';
const RESTAURANT_DETAILS_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetails';
const RESTAURANT_DETAILS_V2_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetailsV2';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!TRIPADVISOR_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'TripAdvisor API key is not configured' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const { action, query, locationId, latitude, longitude, currencyCode = 'USD' } = params;

    console.log('TripAdvisor proxy request:', { action, query, locationId, latitude, longitude });

    let url;
    let queryParams = new URLSearchParams();

    if (action === 'searchLocation' && query) {
      // Search for locations
      url = SEARCH_LOCATION_URL;
      queryParams.append('query', query);
    } else if (action === 'getRestaurants' && locationId) {
      // Get restaurants by location ID
      url = SEARCH_RESTAURANTS_URL;
      queryParams.append('locationId', locationId);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
    } else if (action === 'getDetails' && locationId) {
      // Get restaurant details
      url = RESTAURANT_DETAILS_URL;
      queryParams.append('restaurantId', locationId);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
    } else if (action === 'getDetailsV2' && locationId) {
      // Get restaurant details V2
      url = RESTAURANT_DETAILS_V2_URL;
      queryParams.append('restaurantId', locationId);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
    } else if (action === 'searchNearby' && latitude && longitude) {
      // Search restaurants near coordinates
      // For TripAdvisor, we need to first search for a location, then get restaurants in that location
      // This is a workaround since direct coordinate search doesn't work well
      url = SEARCH_LOCATION_URL;
      // Use a generic query for the area based on coordinates
      queryParams.append('query', `restaurants near ${latitude},${longitude}`);
      console.log(`Searching for restaurants near ${latitude},${longitude}`);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid parameters. Required: action and (query or locationId or coordinates)'
        })
      };
    }

    const apiUrl = `${url}?${queryParams.toString()}`;
    console.log('Making request to TripAdvisor API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': TRIPADVISOR_API_KEY,
        'x-rapidapi-host': TRIPADVISOR_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TripAdvisor API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `TripAdvisor API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();

    // Special handling for searchNearby action
    if (action === 'searchNearby') {
      try {
        // If we found locations, get the first location ID and fetch restaurants for it
        if (data.data && data.data.length > 0) {
          const firstLocation = data.data[0];
          const locationId = firstLocation.locationId;
          console.log(`Found location: ${firstLocation.name} (${locationId}), fetching restaurants...`);

          // Now fetch restaurants for this location
          const restaurantsUrl = `${SEARCH_RESTAURANTS_URL}?locationId=${locationId}&currencyCode=${currencyCode}`;
          console.log('Fetching restaurants from location:', restaurantsUrl);

          const restaurantsResponse = await fetch(restaurantsUrl, {
            headers: {
              'x-rapidapi-key': TRIPADVISOR_API_KEY,
              'x-rapidapi-host': TRIPADVISOR_HOST
            }
          });

          if (!restaurantsResponse.ok) {
            const errorText = await restaurantsResponse.text();
            console.error('Error fetching restaurants:', errorText);
            return {
              statusCode: restaurantsResponse.status,
              headers,
              body: JSON.stringify({
                error: `Error fetching restaurants: ${restaurantsResponse.status}`,
                details: errorText
              })
            };
          }

          const restaurantsData = await restaurantsResponse.json();
          console.log(`Found ${restaurantsData.data?.data?.length || 0} restaurants`);
          return { statusCode: 200, headers, body: JSON.stringify(restaurantsData) };
        } else {
          console.log('No locations found for the given coordinates');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: { data: [] } })
          };
        }
      } catch (error) {
        console.error('Error in searchNearby processing:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Error processing location search results',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        };
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    console.error('TripAdvisor Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      })
    };
  }
};
