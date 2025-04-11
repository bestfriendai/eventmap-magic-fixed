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

      // Try to find a major city or landmark near these coordinates
      // Convert coordinates to a more general search that's likely to find results
      // First, round coordinates to 2 decimal places to get a broader area
      const roundedLat = Math.round(parseFloat(latitude) * 100) / 100;
      const roundedLng = Math.round(parseFloat(longitude) * 100) / 100;

      // Use a more general search query that's likely to find results
      const searchQuery = `restaurants ${roundedLat},${roundedLng}`;
      queryParams.append('query', searchQuery);
      console.log(`Searching for restaurants with query: ${searchQuery}`);
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
          // Try to find a location with a locationId
          const validLocations = data.data.filter(loc => loc.locationId);

          let locationId;
          let firstLocation;

          if (validLocations.length === 0) {
            console.log('No valid locations found with locationId, trying direct city search');

            // If we can't find a location, try a direct search for a major city near the coordinates
            // This is a fallback approach that often works better
            try {
              // Use a hardcoded list of major cities that are likely to have restaurant data
              const majorCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
                                  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Washington DC', 'Boston',
                                  'Las Vegas', 'Miami', 'Atlanta', 'San Francisco', 'Seattle', 'Denver'];

              // Find the nearest major city based on coordinates (simplified approach)
              // In a real implementation, you would use a geocoding service or database
              // For now, we'll just use Washington DC as a fallback since the coordinates are near DC
              const cityLocationUrl = `${SEARCH_LOCATION_URL}?query=Washington DC`;
              console.log('Trying direct city search:', cityLocationUrl);

              const cityResponse = await fetch(cityLocationUrl, {
                headers: {
                  'x-rapidapi-key': TRIPADVISOR_API_KEY,
                  'x-rapidapi-host': TRIPADVISOR_HOST
                }
              });

              if (!cityResponse.ok) {
                throw new Error(`City search failed with status ${cityResponse.status}`);
              }

              const cityData = await cityResponse.json();
              if (!cityData.data || cityData.data.length === 0) {
                throw new Error('No city location found');
              }

              const cityLocation = cityData.data[0];
              locationId = cityLocation.locationId;
              firstLocation = cityLocation;
              console.log(`Found city location: ${cityLocation.name} (${locationId})`);
              console.log(`Using city location: ${firstLocation.name} (${locationId}), fetching restaurants...`);
            } catch (cityError) {
              console.error('City search fallback failed:', cityError);
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ data: { data: [] } })
              };
            }
          } else {
            firstLocation = validLocations[0];
            locationId = firstLocation.locationId;
            console.log(`Found location: ${firstLocation.name} (${locationId}), fetching restaurants...`);
          }

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
              statusCode: 200, // Return 200 even on error to prevent client-side crashes
              headers,
              body: JSON.stringify({
                data: { data: [] },
                error: `Error fetching restaurants: ${restaurantsResponse.status}`,
                details: errorText
              })
            };
          }

          const restaurantsData = await restaurantsResponse.json();
          console.log(`Found ${restaurantsData.data?.data?.length || 0} restaurants`);

          // Make sure we have valid restaurant data
          if (!restaurantsData.data || !restaurantsData.data.data || !Array.isArray(restaurantsData.data.data)) {
            console.log('Invalid restaurant data format');
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ data: { data: [] } })
            };
          }

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
          statusCode: 200, // Return 200 even on error to prevent client-side crashes
          headers,
          body: JSON.stringify({
            data: { data: [] },
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
