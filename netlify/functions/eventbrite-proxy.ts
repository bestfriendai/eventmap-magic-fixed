import { Handler } from '@netlify/functions';

// Use environment variables with fallbacks
const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN || 'EUB5KUFLJH2SKVCHVD3E';
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY || 'YJH4KGIHRNH0KODPZD';
const EVENTBRITE_CLIENT_SECRET = process.env.EVENTBRITE_CLIENT_SECRET || 'QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ';
const EVENTBRITE_PUBLIC_TOKEN = process.env.EVENTBRITE_PUBLIC_TOKEN || 'C4WQAR3XB7XX2AYOUEQ4';

// Log available credentials for debugging
console.log('Eventbrite credentials available:', {
  privateToken: !!EVENTBRITE_PRIVATE_TOKEN,
  apiKey: !!EVENTBRITE_API_KEY,
  clientSecret: !!EVENTBRITE_CLIENT_SECRET,
  publicToken: !!EVENTBRITE_PUBLIC_TOKEN
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

  if (!EVENTBRITE_PRIVATE_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Eventbrite token not configured' }) };
  }

  const { latitude, longitude, radius = '100mi', start_date_range_start } = event.queryStringParameters || {};

  if (!latitude || !longitude) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Latitude and longitude are required' }) };
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = start_date_range_start || `${today}T00:00:00`;

  // Build the search URL with all necessary parameters
  // Note: We're using the v3 API with OAuth token authentication
  // For future dates, use a date range that's not too far in the future
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // Look for events up to a year in the future
  const formattedEndDate = endDate.toISOString().split('T')[0];

  // Try endpoint with location.address as per documentation
  const searchUrl = `https://www.eventbriteapi.com/v3/events/search/?location.address=nearby&location.within=${radius}`;

  try {
    console.log(`Fetching Eventbrite events for coordinates: ${latitude},${longitude} within ${radius}`);
    console.log('Eventbrite search URL (simplified):', searchUrl);
    // Try with the private token first
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    // Log the response status for debugging
    console.log(`Eventbrite API response status: ${response.status}`);

    // If we get a 401 Unauthorized or 404 Not Found, try with the public token as a query parameter
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      console.log('Trying alternative authentication method with public token...');

      // Try with token in URL
      const altUrl = `${searchUrl}&token=${EVENTBRITE_PUBLIC_TOKEN}`;
      console.log('Alternative Eventbrite URL:', altUrl);

      const altResponse = await fetch(altUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`Eventbrite API alternative response status: ${altResponse.status}`);

      // If the alternative method works, use that response
      if (altResponse.ok) {
        const data = await altResponse.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }

      // If that fails, try with API key
      if (!altResponse.ok) {
        console.log('Trying with API key...');
        const apiKeyUrl = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${latitude}&location.longitude=${longitude}&location.within=${radius}&start_date.range_start=${startDate}&expand=venue,ticket_availability,category,organizer&token=${EVENTBRITE_API_KEY}`;

        const apiKeyResponse = await fetch(apiKeyUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log(`Eventbrite API key response status: ${apiKeyResponse.status}`);

        if (apiKeyResponse.ok) {
          const data = await apiKeyResponse.json();
          return { statusCode: 200, headers, body: JSON.stringify(data) };
        }
      }
    }

    // Handle final failure after trying all auth methods
    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;
      const finalUrlAttempted = response.url; // Get the URL that finally failed
      console.error('Eventbrite API error (final attempt):', { status, statusText: response.statusText, error: errorText, url: finalUrlAttempted });

      let errorMessage = `Eventbrite API error: ${status} - ${errorText}`;
      let userMessage = 'Unable to fetch events from Eventbrite at this time.';

      // Provide more specific feedback for common auth issues
      if (status === 401 || status === 403) {
        errorMessage = `Eventbrite API Authentication Error: ${status}`;
        userMessage = 'Authentication failed. Please check Eventbrite API credentials (tokens/keys) in the Netlify environment variables.';
        console.error('Potential cause: Invalid or missing EVENTBRITE_PRIVATE_TOKEN, EVENTBRITE_PUBLIC_TOKEN, or EVENTBRITE_API_KEY in Netlify environment.');
      } else if (status === 404) {
         // Keep the original 404 message if it wasn't an auth issue initially
         errorMessage = `Eventbrite API error: 404 - Path not found. URL: ${finalUrlAttempted}`;
         userMessage = 'Eventbrite API endpoint not found. Check the API path or version, or ensure credentials are valid for this endpoint.';
      }


      return {
        statusCode: 500, // Keep 500 for the proxy error, but include specific details
        headers,
        body: JSON.stringify({
          error: errorMessage,
          message: userMessage,
          details: { status, errorText, failedUrl: finalUrlAttempted } // Include original details and the URL
        })
      };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error: unknown) {
    console.error('Eventbrite Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: errorMessage }) };
  }
};
