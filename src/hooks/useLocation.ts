import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  error?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    // Try to get the user's location
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout
      maximumAge: 0
    };

    console.log('%c GETTING YOUR LOCATION FROM useLocation HOOK... ', 'background: #3498db; color: white; font-size: 14px; padding: 5px;');

    // Add a timeout to detect if geolocation is taking too long
    const timeoutId = setTimeout(() => {
      console.warn('Geolocation is taking longer than expected in useLocation hook...');
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        if (isMounted) {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          // Store in localStorage for future use
          try {
            localStorage.setItem('userLocation', JSON.stringify(userLocation));
          } catch (e) {
            console.error('Could not save to localStorage:', e);
          }

          setLocation(userLocation);
          setIsLoading(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('%c ERROR GETTING LOCATION IN useLocation HOOK: ', 'background: #e74c3c; color: white; font-size: 14px; padding: 5px;', error);

        if (isMounted) {
          setError(error.message);

          // Try to get location from localStorage
          try {
            const savedLocation = localStorage.getItem('userLocation');
            if (savedLocation) {
              const parsedLocation = JSON.parse(savedLocation);
              console.log('Using saved location from localStorage:', parsedLocation);
              setLocation({
                ...parsedLocation,
                error: 'Using saved location (current location unavailable)'
              });
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error('Could not retrieve location from localStorage:', e);
          }

          // Do NOT default to New York City
          setLocation({
            latitude: 0,
            longitude: 0,
            error: `Could not get your location: ${error.message}`
          });
          setIsLoading(false);
        }
      },
      geoOptions
    );

    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
    };
  }, []);

  return { location, error, isLoading };
}
