import { Handler } from '@netlify/functions';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_KEY || 'DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

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

  if (!TICKETMASTER_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ticketmaster API key not configured' }) };
  }

  const queryParams = event.queryStringParameters || {};
  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    ...queryParams
  });

  const url = `${BASE_URL}/events.json?${params.toString()}`;

  try {
    console.log(`Fetching Ticketmaster events with URL: ${url}`);
    const response = await fetch(url);

    console.log(`Ticketmaster API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ticketmaster API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Ticketmaster API error: ${response.status} - ${errorText}`,
          message: 'Unable to fetch events from Ticketmaster at this time.'
        })
      };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (error: unknown) {
    console.error('Ticketmaster Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: errorMessage }) };
  }
};