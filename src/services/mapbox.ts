const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// CORS proxy configuration with fallbacks
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/'
];

// Default to the first proxy, but allow fallback to others if needed
export const CORS_PROXY = CORS_PROXIES[0];

/**
 * Fetch with CORS proxy and fallback to alternative proxies if the first one fails
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Response from the fetch request
 */
export async function fetchWithCorsProxy(url: string, options: RequestInit = {}): Promise<Response> {
  let lastError: Error | null = null;

  // Try each proxy in order
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, options);

      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`CORS proxy ${proxy} failed:`, error);
      lastError = error as Error;
    }
  }

  // If all proxies fail, throw the last error
  throw lastError || new Error('All CORS proxies failed');
}

export interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  place_type: string[];
}

/**
 * Search for locations using the Mapbox Geocoding API
 * @param query The search query
 * @returns Array of location suggestions
 */
export const searchLocations = async (query: string): Promise<Suggestion[]> => {
  if (!query.trim()) return [];

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query.trim()
    )}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address`;

    // Direct fetch without CORS proxy for Mapbox (usually works client-side)
    let response: Response;
    try {
      response = await fetch(url);
    } catch (directError) {
      console.warn('Direct Mapbox API call failed, trying with CORS proxy:', directError);
      response = await fetchWithCorsProxy(url);
    }

    if (!response.ok) {
      throw new Error(`Mapbox API error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.warn('Mapbox API returned no features');
      return [];
    }

    return data.features.map((feature: Suggestion) => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      text: feature.text,
      place_type: feature.place_type
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};
