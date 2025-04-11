import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import Map, { NavigationControl, Marker, Popup, ViewState, Source, Layer, MapRef } from 'react-map-gl';
import type { LineLayerSpecification } from 'mapbox-gl';
import { MapPin, Calendar, Clock, Ticket, Maximize, Minimize, DollarSign, ExternalLink } from 'lucide-react';
import type { Feature, LineString } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '../types';

const EVENT_ICONS: Record<string, string> = {
  'live-music': '🎵',
  'music': '🎵',
  'comedy': '😄',
  'sports-games': '⚽',
  'sports': '⚽',
  'performing-arts': '🎪',
  'arts': '🎨',
  'theatre': '🎭',
  'food-drink': '🍽️',
  'food': '🍽️',
  'cultural': '🏛️',
  'social': '👥',
  'community': '👥',
  'educational': '📚',
  'outdoor': '🌲',
  'special': '✨',
  'entertainment': '✨',
  'festival': '🎪',
  'film': '🎬'
};

interface MapViewProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event | null) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isLoadingEvents?: boolean;
}

const MapView = memo(({
  events,
  selectedEvent,
  onEventSelect,
  userLocation,
  isFullscreen,
  onToggleFullscreen
}: MapViewProps) => {
  const mapRef = useRef<MapRef | null>(null);
  // Track if the map has been initialized
  const [mapInitialized, setMapInitialized] = useState(false);
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
    bearing: 0,
    pitch: 0
  });
  const [popupEvent, setPopupEvent] = useState<Event | null>(null);
  const [routeData, setRouteData] = useState<Feature<LineString> | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  // Handle map initialization
  useEffect(() => {
    if (mapRef.current && !mapInitialized) {
      // Set the map as initialized
      setMapInitialized(true);
      console.log('Map initialized');

      // If we already have a user location, center on it
      if (userLocation) {
        setTimeout(() => {
          console.log('Centering on user location after initialization');
          mapRef.current?.flyTo({
            center: [userLocation.longitude, userLocation.latitude],
            zoom: 13,
            duration: 2500,
            essential: true
          });
        }, 500); // Longer delay for initial load
      }
    }
  }, [mapInitialized, userLocation]); // mapRef.current removed from deps as it's a ref

  // Track if we've centered on the user location

  // Center map on user location when available
  useEffect(() => {
    if (userLocation && mapRef.current && mapInitialized) {
      console.log('Centering map on user location:', userLocation);

      // Don't use setViewState as it can conflict with the map's internal state
      // Instead, use the flyTo method directly which provides smoother animations

      // First, cancel any ongoing animations
      if (mapRef.current) {
        mapRef.current.stop();
      }

      // Use a short timeout to ensure the map is ready and any previous animations have stopped
      setTimeout(() => {
        if (mapRef.current) {
          // Use enhanced flyTo options for smoother animation
          mapRef.current.flyTo({
            center: [userLocation.longitude, userLocation.latitude],
            zoom: 13, // Slightly higher zoom for better visibility
            duration: 2000, // Longer duration for smoother animation
            essential: true, // This animation is considered essential
            curve: 1.42, // Use a custom ease curve (1.42 is the default for flyTo)
            speed: 1.2, // Slightly faster than default
            screenSpeed: 1.2, // Consistent screen speed
            padding: { top: 100, bottom: 300, left: 50, right: 50 } // Add padding to account for UI elements
          });

          // Mark that we've centered on the user (State removed as unused)
        }
      }, 150);
    }
  }, [userLocation, mapInitialized]);

  // Center map on selected event
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      // Cancel any ongoing animations
      if (mapRef.current) {
        mapRef.current.stop();
      }

      // Use a short timeout to ensure the map is ready
      setTimeout(() => {
        if (mapRef.current) {
          // Use enhanced flyTo options for smoother animation
          mapRef.current.flyTo({
            center: [selectedEvent.longitude, selectedEvent.latitude],
            zoom: 15, // Higher zoom for event details
            duration: 1800, // Slightly shorter than location animation
            essential: true,
            curve: 1.42,
            speed: 1.0,
            padding: { top: 100, bottom: 300, left: 50, right: 50 }
          });
        }
      }, 100);

      // Set the popup event to show details
      setPopupEvent(selectedEvent);
    }
  }, [selectedEvent]);

  // Get route between user location and selected event
  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !popupEvent) {
        setRouteData(null);
        setRouteDistance(null);
        setRouteDuration(null);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${popupEvent.longitude},${popupEvent.latitude}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
          setRouteDistance(route.distance);
          setRouteDuration(route.duration);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteData(null);
        setRouteDistance(null);
        setRouteDuration(null);
      }
    };

    fetchRoute();
  }, [userLocation, popupEvent]);

  const handleMarkerClick = useCallback((event: Event) => {
    setPopupEvent(event);
    onEventSelect(event);
  }, [onEventSelect]);

  const handlePopupClose = useCallback(() => {
    setPopupEvent(null);
    onEventSelect(null);
  }, [onEventSelect]);

  const getEventIcon = useCallback((event: Event) => {
    if (!event.categories || event.categories.length === 0) return '📍';

    const category = event.categories[0].toLowerCase();
    for (const [key, icon] of Object.entries(EVENT_ICONS)) {
      if (category.includes(key)) return icon;
    }

    return '📍';
  }, []);

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    const miles = meters / 1609.34;
    return miles < 10 ? miles.toFixed(1) : Math.round(miles);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return null;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
  };

  const routeLayer: LineLayerSpecification = {
    id: 'route',
    type: 'line',
    source: 'route-source', // Link to the Source component
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => {
          console.log('Map loaded');
          setMapInitialized(true);
        }}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        minZoom={2}
        maxZoom={20}
        onClick={() => setPopupEvent(null)}
        ref={mapRef}
        terrain={{ source: 'mapbox-terrain', exaggeration: 1.5 }}
        reuseMaps
        renderWorldCopies={true}
        antialias={true}
      >
        <NavigationControl position="bottom-right" />

        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
            pitchAlignment="map"
            rotationAlignment="map"
          >
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
              {/* Middle ring */}
              <div className="absolute -inset-2 bg-blue-500/30 rounded-full"></div>
              {/* Inner marker */}
              <div className="w-8 h-8 bg-blue-600 border-4 border-white rounded-full flex items-center justify-center text-white text-xs font-bold relative z-10 shadow-lg">
                <span>YOU</span>
              </div>
            </div>
          </Marker>
        )}

        {events.map(event => (
          <Marker
            key={event.id}
            longitude={event.longitude}
            latitude={event.latitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(event);
            }}
          >
            <div
              className={`event-marker ${popupEvent?.id === event.id ? 'scale-125 border-blue-500' : ''}`}
            >
              <span>{getEventIcon(event)}</span>
            </div>
          </Marker>
        ))}

        {popupEvent && (
          <Popup
            longitude={popupEvent.longitude}
            latitude={popupEvent.latitude}
            anchor="bottom"
            onClose={handlePopupClose}
            closeOnClick={false}
            closeButton={true}
            maxWidth="400px"
          >
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{popupEvent.title}</h3>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-medium">{popupEvent.date}</div>
                  <div className="text-sm text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {popupEvent.time || 'Time TBA'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                <div>
                  <div className="font-medium">{popupEvent.venue}</div>
                  <div className="text-sm text-zinc-400">{popupEvent.location?.address}</div>

                  {routeDistance !== null && routeDuration !== null && (
                    <div className="mt-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md inline-block">
                      {formatDistance(routeDistance)} miles • {formatDuration(routeDuration)} drive
                    </div>
                  )}
                </div>
              </div>

              {popupEvent.price !== undefined && popupEvent.price !== null && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="font-medium">
                    {popupEvent.price === 0 ? 'Free' : `$${popupEvent.price}`}
                  </div>
                </div>
              )}

              {popupEvent.url && (
                <a
                  href={popupEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Get Tickets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </Popup>
        )}

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>

      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="absolute top-4 right-4 z-10 bg-black/75 backdrop-blur-md p-2 rounded-lg border border-white/10 text-white hover:bg-black/90 transition-colors"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;
