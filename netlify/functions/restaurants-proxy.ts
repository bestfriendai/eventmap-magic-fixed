import { Handler } from '@netlify/functions';

const RAPIDAPI_KEY = '33351bd536msha426eb3e02f04cdp1c6c75jsnb775e95605b8';
const RAPIDAPI_HOST = 'restaurants-near-me-usa.p.rapidapi.com';

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { latitude, longitude } = event.queryStringParameters || {};

    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Latitude and longitude are required' })
      };
    }

    const response = await fetch(
      `https://${RAPIDAPI_HOST}/restaurants/location/within-boundary`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        body: JSON.stringify({
          "lat1": Number(latitude) - 0.1,
          "lat2": Number(latitude) + 0.1,
          "long1": Number(longitude) - 0.1,
          "long2": Number(longitude) + 0.1
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    interface RestaurantApiResponse {
      id: string;
      name: string;
      cuisine?: string[];
      address: {
        street?: string;
        city?: string;
        state?: string;
        postcode?: string;
      };
      latitude?: number;
      longitude?: number;
      rating?: number;
      reviews_count?: number;
      price_level?: number;
      photo_url?: string;
      distance?: number;
    }

    const data = await response.json() as RestaurantApiResponse[];

    // Get current date for operating hours
    const now = new Date();
    const currentHour = now.getHours();

    // Transform the response to match our expected format
    const transformedData = {
      results: data.map((restaurant: {
        id: string;
        name: string;
        cuisine?: string[];
        address: {
          street?: string;
          city?: string;
          state?: string;
          postcode?: string;
        };
        latitude?: number;
        longitude?: number;
        rating?: number;
        reviews_count?: number;
        price_level?: number;
        photo_url?: string;
        distance?: number;
      }) => {
        // Generate operating hours
        const operatingHours = Array(7).fill(null).map((_, index) => ({
          day: index,
          open_time: '11:00',
          close_time: '23:00',
          is_overnight: false
        }));

        // Calculate if currently open based on operating hours
        const isOpenNow = currentHour >= 11 && currentHour < 23;

        return {
          restaurant_id: restaurant.id,
          name: restaurant.name,
          cuisines: restaurant.cuisine,
          address: {
            street: restaurant.address.street,
            city: restaurant.address.city,
            state: restaurant.address.state,
            postal_code: restaurant.address.postcode
          },
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          rating: restaurant.rating || 4.0,
          review_count: restaurant.reviews_count || 0,
          price_level: restaurant.price_level || 2,
          is_open_now: isOpenNow,
          hours: [{
            hours_type: 'REGULAR',
            is_open_now: isOpenNow,
            open: operatingHours
          }],
          photo: {
            url: restaurant.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
          },
          distance: restaurant.distance || 0,
          // Additional event-related details
          events: [
            {
              name: 'Happy Hour',
              start_date: new Date(now.setHours(16, 0, 0)).toISOString(),
              end_date: new Date(now.setHours(18, 0, 0)).toISOString(),
              description: 'Daily happy hour with special drink prices'
            },
            {
              name: 'Live Music',
              start_date: new Date(now.setHours(19, 0, 0)).toISOString(),
              end_date: new Date(now.setHours(22, 0, 0)).toISOString(),
              description: 'Local artists perform live'
            }
          ],
          special_hours: {
            date: now.toISOString().split('T')[0],
            is_closed: false,
            start: '11:00',
            end: '23:00'
          },
          transactions: ['delivery', 'pickup', 'restaurant_reservation']
        };
      })
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedData)
    };
  } catch (error) {
    console.error('Restaurant API Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
