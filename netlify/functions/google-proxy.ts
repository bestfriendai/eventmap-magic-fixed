import { Handler } from '@netlify/functions';

// Use environment variables with fallbacks
const SERPAPI_KEY = process.env.SERPAPI_KEY || '18596fbf4a660faf2c48ceca0c19c385eba49ba054fc4db6ab1bb541d8f73c5d';
const BASE_URL = 'https://serpapi.com/search.json';

// Log the API key for debugging (masked for security)
console.log('SerpAPI key available:', SERPAPI_KEY ? 'Yes' : 'No');

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

  if (!SERPAPI_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SerpAPI key not configured' }) };
  }

  try {
    // Extract all query parameters
    const params = event.queryStringParameters || {};

    // Get location from query parameters
    let location;
    if (params.location) {
      location = params.location;
    } else if (params.latitude && params.longitude) {
      location = `${params.latitude},${params.longitude}`;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Location parameter is required' })
      };
    }

    const q = params.q || 'events';
    const hl = params.hl || 'en';
    const gl = params.gl || 'us';
    const num = params.num || '20';

    // Build search parameters according to SerpAPI documentation
    const searchParams = new URLSearchParams({
      engine: 'google_events',
      q,
      hl,
      gl,
      api_key: SERPAPI_KEY,
      location,
      device: 'desktop',
      num
    });

    const searchUrl = `${BASE_URL}?${searchParams.toString()}`;

    // Log the URL with the API key masked for security
    console.log('Google search URL:', searchUrl.replace(SERPAPI_KEY, 'API_KEY_HIDDEN'));

    console.log('Sending request to SerpAPI...');
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `SerpAPI error: ${response.status} - ${errorText}` })
      };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (error) {
    console.error('Google Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: errorMessage }) };
  }
};
