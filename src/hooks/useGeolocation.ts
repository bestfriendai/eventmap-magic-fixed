import { useState, useCallback, useEffect } from 'react';
import { Location } from '../types';

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Function to get the user's location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('GEOLOCATION ERROR: Browser does not support geolocation');
      setLocation({
        latitude: 0,
        longitude: 0,
        error: 'Geolocation is not supported'
      });
      return;
    }

    setLoading(true);
    console.log('%c GETTING YOUR LOCATION... ', 'background: #3498db; color: white; font-size: 14px; padding: 5px;');

    // Clear any previous errors
    setLocation(prev => prev ? { ...prev, error: undefined } : null);
    setPermissionDenied(false);

    // Use high accuracy and a longer timeout
    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout to 30 seconds
      maximumAge: 0
    };

    // Add a timeout to detect if geolocation is taking too long
    const timeoutId = setTimeout(() => {
      console.warn('Geolocation is taking longer than expected...');
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(newLocation);
        setLoading(false);

        // Store the location in localStorage for future use
        try {
          localStorage.setItem('lastKnownLocation', JSON.stringify(newLocation));
        } catch (e) {
          console.error('Could not save location to localStorage:', e);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('%c GEOLOCATION ERROR! ', 'background: #e74c3c; color: white; font-size: 14px; padding: 5px;', error.message, error.code);

        // Check if permission was denied
        if (error.code === 1) { // PERMISSION_DENIED
          setPermissionDenied(true);
          console.log('Geolocation permission denied');
        }

        // Try to get the last known location from localStorage
        try {
          const savedLocation = localStorage.getItem('lastKnownLocation');
          if (savedLocation) {
            const parsedLocation = JSON.parse(savedLocation);
            console.log('Using saved location from localStorage:', parsedLocation);
            setLocation({
              ...parsedLocation,
              error: 'Using saved location (current location unavailable)'
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Could not retrieve location from localStorage:', e);
        }

        // Do NOT default to New York City - instead use a more neutral default
        // or let the user know we couldn't determine their location
        setLocation({
          latitude: 0,
          longitude: 0,
          error: `Could not get your location: ${error.message}`
        });
        setLoading(false);
      },
      options
    );
  }, []);

  // Try to get the location on initial load
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { location, loading, permissionDenied, getLocation };
}
