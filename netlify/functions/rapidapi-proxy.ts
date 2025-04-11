import { Handler } from '@netlify/functions';

// Use environment variables with fallbacks
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9';
const RAPIDAPI_HOST = 'real-time-events-search.p.rapidapi.com';

console.log('RapidAPI credentials available:', {
  apiKey: !!RAPIDAPI_KEY
});

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

  if (!RAPIDAPI_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'RapidAPI key not configured' }) };
  }

  const { query, date = 'any', is_virtual = 'false', start = '0', latitude, longitude, radius = '100' } = event.queryStringParameters || {};

  if (!latitude || !longitude) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Latitude and longitude are required' }) };
  }

  // Build the search URL with necessary parameters
  const searchUrl = `https://${RAPIDAPI_HOST}/search-events`;
  const searchParams = new URLSearchParams({
    query: query || 'events near me',
    date,
    is_virtual,
    start
  });

  // Append location parameters if provided
  if (latitude && longitude) {
    searchParams.append('latitude', latitude);
    searchParams.append('longitude', longitude);
    searchParams.append('radius', radius);
  }

  const fullUrl = `${searchUrl}?${searchParams.toString()}`;

  try {
    console.log(`Fetching RapidAPI events for query: ${query || 'events near me'}`);
    console.log('RapidAPI search URL:', fullUrl);
    const response = await fetch(fullUrl, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Accept': 'application/json'
      }
    });

    // Log the response status for debugging
    console.log(`RapidAPI response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `RapidAPI error: ${response.status} - ${errorText}`,
          message: 'Unable to fetch events from RapidAPI at this time.'
        })
      };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error: unknown) {
    console.error('RapidAPI Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: errorMessage }) };
  }
};
