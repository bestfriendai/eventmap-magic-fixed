import { Handler } from '@netlify/functions';

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9';
const TRIPADVISOR_HOST = 'tripadvisor16.p.rapidapi.com';
const SEARCH_LOCATION_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchLocation';
const RESTAURANT_DETAILS_URL = 'https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/getRestaurantDetailsV2';

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
      url = `https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchRestaurants`;
      queryParams.append('locationId', locationId);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
    } else if (action === 'getDetails' && locationId) {
      // Get restaurant details
      url = RESTAURANT_DETAILS_URL;
      queryParams.append('restaurantId', locationId);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
    } else if (action === 'searchNearby' && latitude && longitude) {
      // Search restaurants near coordinates
      url = `https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchRestaurants`;
      queryParams.append('latitude', latitude);
      queryParams.append('longitude', longitude);
      if (currencyCode) queryParams.append('currencyCode', currencyCode);
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
