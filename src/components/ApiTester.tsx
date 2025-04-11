import React, { useState } from 'react';
import { searchTicketmasterEvents } from '../services/ticketmaster';
import { searchEventbriteRapidAPI } from '../services/eventbrite-rapidapi';
import { searchRapidAPIEvents } from '../services/rapidapi-events';
import { searchGoogleEvents } from '../services/google-events';
import { searchLocations } from '../services/mapbox';
import { Button } from "@nextui-org/react";
import { toast } from 'sonner';

const ApiTester = () => {
  const [results, setResults] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState<string>('ticketmaster');
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationQuery, setLocationQuery] = useState<string>('');

  const testApi = async () => {
    if (!location) {
      setError('Please search for a location first');
      toast.error('Please search for a location first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    // Display API key information
    const apiKeyInfo = {
      'ticketmaster': import.meta.env.VITE_TICKETMASTER_KEY ? 'Available' : 'Missing',
      'eventbrite': import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN ? 'Available' : 'Missing',
      'rapidapi': import.meta.env.VITE_RAPIDAPI_KEY ? 'Available' : 'Missing',
      'google': import.meta.env.VITE_SERPAPI_KEY ? 'Available' : 'Missing',
      'mapbox': import.meta.env.VITE_MAPBOX_TOKEN ? 'Available' : 'Missing'
    };

    // Log all available API keys for debugging
    console.log('All available API keys:', {
      ticketmaster: import.meta.env.VITE_TICKETMASTER_KEY ? 'Available' : 'Missing',
      eventbritePrivate: import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN ? 'Available' : 'Missing',
      eventbritePublic: import.meta.env.VITE_EVENTBRITE_PUBLIC_TOKEN ? 'Available' : 'Missing',
      eventbriteApiKey: import.meta.env.VITE_EVENTBRITE_API_KEY ? 'Available' : 'Missing',
      rapidapi: import.meta.env.VITE_RAPIDAPI_KEY ? 'Available' : 'Missing',
      serpapi: import.meta.env.VITE_SERPAPI_KEY ? 'Available' : 'Missing',
      mapbox: import.meta.env.VITE_MAPBOX_TOKEN ? 'Available' : 'Missing'
    });

    console.log('API Key Status:', apiKeyInfo);

    if (apiKeyInfo[selectedApi] === 'Missing') {
      toast.warning(`Warning: ${selectedApi} API key is missing. Test may fail.`, { id: 'api-key-warning' });
    }

    try {
      let data;
      toast.loading(`Testing ${selectedApi} API...`, { id: 'api-test' });

      switch (selectedApi) {
        case 'ticketmaster':
          data = await searchTicketmasterEvents({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10
          });
          break;
        case 'eventbrite':
          data = await searchEventbriteRapidAPI({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10
          });
          break;
        case 'rapidapi':
          data = await searchRapidAPIEvents({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10
          });
          break;
        case 'google':
          data = await searchGoogleEvents({
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 10
          });
          break;
        case 'mapbox':
          data = await searchLocations(locationQuery || 'New York');
          break;
        default:
          throw new Error('Invalid API selected');
      }

      toast.success(`${selectedApi} API test completed successfully!`, { id: 'api-test' });
      setResults(data);
    } catch (err: unknown) {
      console.error('API test error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error testing API: ${errorMessage}`);
      toast.error(`API test failed: ${errorMessage}`, { id: 'api-test' });
    } finally {
      setLoading(false);
    }
  };

  const searchForLocation = async () => {
    if (!locationQuery) {
      setError('Please enter a location to search');
      toast.error('Please enter a location to search');
      return;
    }

    setLoading(true);
    setError(null);
    toast.loading('Searching for location...', { id: 'location-search' });

    try {
      const suggestions = await searchLocations(locationQuery);
      if (suggestions.length > 0) {
        const firstResult = suggestions[0];
        const newLocation = {
          latitude: firstResult.center[1],
          longitude: firstResult.center[0]
        };
        setLocation(newLocation);
        setError(null);
        toast.success(`Location found: ${firstResult.place_name}`, { id: 'location-search' });
        console.log('Location set:', firstResult.place_name, newLocation);
      } else {
        setError('No locations found for your query');
        toast.error('No locations found for your query', { id: 'location-search' });
      }
    } catch (err: unknown) {
      console.error('Location search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error searching location: ${errorMessage}`);
      toast.error(`Error searching location: ${errorMessage}`, { id: 'location-search' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-zinc-900 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-2 text-white">API Integration Tester</h2>

      {/* API Key Status */}
      <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg text-sm">
        <h3 className="font-medium text-white mb-2">API Key Status:</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className={`px-2 py-1 rounded ${import.meta.env.VITE_MAPBOX_TOKEN ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            Mapbox: {import.meta.env.VITE_MAPBOX_TOKEN ? '✓ Available' : '✗ Missing'}
          </div>
          <div className={`px-2 py-1 rounded ${import.meta.env.VITE_TICKETMASTER_API_KEY ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            Ticketmaster: {import.meta.env.VITE_TICKETMASTER_API_KEY ? '✓ Available' : '✗ Missing'}
          </div>
          <div className={`px-2 py-1 rounded ${import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            Eventbrite: {import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN ? '✓ Available' : '✗ Missing'}
          </div>
          <div className={`px-2 py-1 rounded ${import.meta.env.VITE_RAPIDAPI_KEY ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            RapidAPI: {import.meta.env.VITE_RAPIDAPI_KEY ? '✓ Available' : '✗ Missing'}
          </div>
          <div className={`px-2 py-1 rounded ${import.meta.env.VITE_SERPAPI_KEY ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            SerpAPI: {import.meta.env.VITE_SERPAPI_KEY ? '✓ Available' : '✗ Missing'}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Location Search</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Enter a location (e.g., New York, NY)"
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          />
          <Button
            onClick={searchForLocation}
            isLoading={loading && !location}
            color="primary"
          >
            Search
          </Button>
        </div>
        {location && (
          <div className="mt-2 text-sm text-green-400">
            Location set: {locationQuery} ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select API to Test</label>
        <div className="flex gap-2">
          {['ticketmaster', 'eventbrite', 'rapidapi', 'google', 'mapbox'].map((api) => (
            <Button
              key={api}
              onClick={() => setSelectedApi(api)}
              color={selectedApi === api ? "primary" : "default"}
              variant={selectedApi === api ? "solid" : "bordered"}
              className="capitalize"
            >
              {api}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={testApi}
        isLoading={loading && !!location}
        color="success"
        className="w-full mb-6"
        size="lg"
      >
        Test {selectedApi} API
      </Button>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-white">Results</h3>
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-400">
              Found {Array.isArray(results) ? results.length : 'N/A'} results
            </div>
            <div className="text-sm text-green-400">
              Today's date: {new Date().toLocaleDateString()}
            </div>
          </div>

          {Array.isArray(results) && results.length > 0 && (
            <div className="mb-4 bg-zinc-800/50 p-4 rounded-lg">
              <h4 className="text-md font-medium mb-2 text-white">Date Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-300">First Event</h5>
                  <div className="text-sm text-gray-400">Date: {results[0].date}</div>
                  <div className="text-sm text-gray-400">Time: {results[0].time}</div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300">Last Event</h5>
                  <div className="text-sm text-gray-400">Date: {results[results.length-1].date}</div>
                  <div className="text-sm text-gray-400">Time: {results[results.length-1].time}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-800 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTester;
