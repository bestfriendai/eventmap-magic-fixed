import React, { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import Map, {
  NavigationControl,
  Marker,
  Popup,
  ViewState,
  Source,
  Layer,
  MapRef,
  GeolocateControl,
  FullscreenControl,
  ScaleControl
} from 'react-map-gl';
import type { LineLayerSpecification, CircleLayerSpecification, SymbolLayerSpecification } from 'mapbox-gl';
import {
  MapPin,
  Calendar,
  Clock,
  Ticket,
  Maximize,
  Minimize,
  DollarSign,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Navigation,
  Compass
} from 'lucide-react';
import type { Feature, LineString, Point, GeoJSON } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '../types';
import { EnhancedButton } from './ui/enhanced-button';
import { EnhancedBadge } from './ui/enhanced-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/enhanced-card';
import { cn } from '@/lib/utils';

// Map styles
const MAP_STYLES = {
  DARK: 'mapbox://styles/mapbox/dark-v11',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1'
};

// Event category icons
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

// Route layer style
const routeLayer: LineLayerSpecification = {
  id: 'route',
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': '#3b82f6',
    'line-width': 4,
    'line-opacity': 0.8,
    'line-dasharray': [0.5, 1.5]
  }
};

// Cluster layer styles
const clusterLayer: CircleLayerSpecification = {
  id: 'clusters',
  type: 'circle',
  source: 'events',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#4f46e5', // Indigo for small clusters
      10,
      '#8b5cf6', // Purple for medium clusters
      30,
      '#ec4899'  // Pink for large clusters
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,  // Size for small clusters
      10,
      25,  // Size for medium clusters
      30,
      30   // Size for large clusters
    ],
    'circle-opacity': 0.85,
    'circle-stroke-width': 3,
    'circle-stroke-color': 'rgba(255, 255, 255, 0.3)',
    'circle-stroke-opacity': 0.5
  }
};

const clusterCountLayer: SymbolLayerSpecification = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'events',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 14
  },
  paint: {
    'text-color': '#ffffff'
  }
};

const unclusteredPointLayer: CircleLayerSpecification = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#4f46e5',
    'circle-radius': 8,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
};

interface EnhancedMapProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event | null) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isLoadingEvents?: boolean;
  className?: string;
}

const EnhancedMap = memo(({
  events,
  selectedEvent,
  onEventSelect,
  userLocation,
  isFullscreen,
  onToggleFullscreen,
  isLoadingEvents,
  className
}: EnhancedMapProps) => {
  const mapRef = useRef<MapRef | null>(null);
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
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLES.DARK);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [show3D, setShow3D] = useState<boolean>(false);

  // Define getEventIcon function before using it in useMemo
  const getEventIcon = useCallback((event: Event) => {
    if (!event.categories || event.categories.length === 0) return '📍';

    const category = event.categories[0].toLowerCase();
    for (const [key, icon] of Object.entries(EVENT_ICONS)) {
      if (category.includes(key)) return icon;
    }

    return '📍';
  }, []);

  // Convert events to GeoJSON for clustering
  const eventsGeoJson: GeoJSON = useMemo(() => {
    const validEvents = events.filter(event => {
      const lat = event.latitude;
      const lng = event.longitude;
      return lat && lng && !isNaN(lat) && !isNaN(lng) &&
             lat !== 0 && lng !== 0 &&
             Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    });

    return {
      type: 'FeatureCollection',
      features: validEvents.map(event => ({
        type: 'Feature',
        properties: {
          id: event.id,
          title: event.title,
          category: event.categories?.[0] || 'event',
          icon: getEventIcon(event)
        },
        geometry: {
          type: 'Point',
          coordinates: [event.longitude, event.latitude]
        }
      }))
    };
  }, [events, getEventIcon]);

  // Handle map initialization
  useEffect(() => {
    if (mapRef.current && !mapInitialized) {
      setMapInitialized(true);
      console.log('Map initialized');

      // If we already have a user location, center on it
      if (userLocation) {
        // Validate coordinates before flying to them
        const lat = userLocation.latitude;
        const lng = userLocation.longitude;
        const isValid = lat && lng && !isNaN(lat) && !isNaN(lng) &&
                       lat !== 0 && lng !== 0 &&
                       Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

        if (!isValid) {
          console.warn(`Invalid user location coordinates:`, { lat, lng });
          return;
        }

        setTimeout(() => {
          console.log('Centering on user location after initialization');
          try {
            mapRef.current?.flyTo({
              center: [lng, lat],
              zoom: 13,
              duration: 2500,
              essential: true
            });
          } catch (error) {
            console.error('Error flying to user location:', error);
          }
        }, 500); // Longer delay for initial load
      }
    }
  }, [mapInitialized, userLocation]);

  // Center map on user location when available
  useEffect(() => {
    if (userLocation && mapRef.current && mapInitialized) {
      console.log('Centering map on user location:', userLocation);

      // Validate coordinates before flying to them
      const lat = userLocation.latitude;
      const lng = userLocation.longitude;
      const isValid = lat && lng && !isNaN(lat) && !isNaN(lng) &&
                     lat !== 0 && lng !== 0 &&
                     Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

      if (!isValid) {
        console.warn(`Invalid user location coordinates for centering:`, { lat, lng });
        return;
      }

      // Don't use setViewState as it can conflict with the map's internal state
      // Instead, use the flyTo method directly which provides smoother animations

      // First, cancel any ongoing animations
      if (mapRef.current) {
        mapRef.current.stop();
      }

      // Use a short timeout to ensure the map is ready and any previous animations have stopped
      setTimeout(() => {
        if (mapRef.current) {
          try {
            // Use enhanced flyTo options for smoother animation
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 13, // Slightly higher zoom for better visibility
              duration: 2000, // Longer duration for smoother animation
              essential: true, // This animation is considered essential
              curve: 1.42, // Use a custom ease curve (1.42 is the default for flyTo)
              speed: 1.2, // Slightly faster than default
              screenSpeed: 1.2, // Consistent screen speed
              padding: { top: 100, bottom: 300, left: 50, right: 50 } // Add padding to account for UI elements
            });
          } catch (error) {
            console.error('Error flying to user location:', error);
          }
        }
      }, 150);
    }
  }, [userLocation, mapInitialized]);

  // Center map on selected event
  useEffect(() => {
    if (selectedEvent && mapRef.current) {
      // Validate coordinates before flying to them
      const lat = selectedEvent.latitude;
      const lng = selectedEvent.longitude;
      const isValid = lat && lng && !isNaN(lat) && !isNaN(lng) &&
                     lat !== 0 && lng !== 0 &&
                     Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

      if (!isValid) {
        console.warn(`Invalid coordinates for selected event:`, {
          id: selectedEvent.id,
          title: selectedEvent.title,
          lat, lng
        });
        return;
      }

      // Cancel any ongoing animations
      if (mapRef.current) {
        mapRef.current.stop();
      }

      // Use a short timeout to ensure the map is ready
      setTimeout(() => {
        if (mapRef.current) {
          try {
            // Use enhanced flyTo options for smoother animation
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 15, // Higher zoom for event details
              duration: 1800, // Slightly shorter than location animation
              essential: true,
              curve: 1.42,
              speed: 1.0,
              padding: { top: 100, bottom: 300, left: 50, right: 50 }
            });
          } catch (error) {
            console.error('Error flying to location:', error);
          }
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

      // Validate coordinates before fetching route
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      const eventLat = popupEvent.latitude;
      const eventLng = popupEvent.longitude;

      const isUserLocationValid = userLat && userLng && !isNaN(userLat) && !isNaN(userLng) &&
                                 userLat !== 0 && userLng !== 0 &&
                                 Math.abs(userLat) <= 90 && Math.abs(userLng) <= 180;

      const isEventLocationValid = eventLat && eventLng && !isNaN(eventLat) && !isNaN(eventLng) &&
                                 eventLat !== 0 && eventLng !== 0 &&
                                 Math.abs(eventLat) <= 90 && Math.abs(eventLng) <= 180;

      if (!isUserLocationValid || !isEventLocationValid) {
        console.warn('Invalid coordinates for route calculation:', {
          userLocation: { lat: userLat, lng: userLng, valid: isUserLocationValid },
          eventLocation: { lat: eventLat, lng: eventLng, valid: isEventLocationValid }
        });
        setRouteData(null);
        setRouteDistance(null);
        setRouteDuration(null);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${eventLng},${eventLat}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Check if it's already in a time format
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }

      // Otherwise, try to parse it as a date
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeString;
    }
  };

  const handleClusterClick = (event: any) => {
    const features = mapRef.current?.queryRenderedFeatures(event.point, {
      layers: ['clusters']
    });

    if (!features || features.length === 0) return;

    const clusterId = features[0].properties.cluster_id;
    const mapboxSource = mapRef.current?.getSource('events');

    // @ts-ignore - getClusterExpansionZoom exists but is not in the type definitions
    mapboxSource?.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return;

      mapRef.current?.easeTo({
        center: (features[0].geometry as Point).coordinates as [number, number],
        zoom: zoom + 0.5,
        duration: 500
      });
    });
  };

  const toggleMapStyle = () => {
    const styles = Object.values(MAP_STYLES);
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
  };

  const toggle3D = () => {
    setShow3D(!show3D);

    if (mapRef.current) {
      if (!show3D) {
        // Enable 3D
        mapRef.current.easeTo({
          pitch: 45,
          bearing: -17.6,
          duration: 1000
        });
      } else {
        // Disable 3D
        mapRef.current.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
      }
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => {
          console.log('Map loaded');
          setMapInitialized(true);
        }}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        minZoom={2}
        maxZoom={20}
        onClick={() => setPopupEvent(null)}
        ref={mapRef}
        terrain={show3D ? { source: 'mapbox-terrain', exaggeration: 1.5 } : undefined}
        reuseMaps
        renderWorldCopies={true}
        antialias={true}
        projection="globe"
      >
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserHeading={true}
          showAccuracyCircle={true}
        />
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-right" unit="imperial" />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <EnhancedButton
            size="icon"
            variant="glass"
            onClick={toggleMapStyle}
            title="Change map style"
          >
            <Layers className="h-5 w-5" />
          </EnhancedButton>

          <EnhancedButton
            size="icon"
            variant="glass"
            onClick={toggle3D}
            title="Toggle 3D view"
          >
            <Compass className="h-5 w-5" />
          </EnhancedButton>

          <EnhancedButton
            size="icon"
            variant="glass"
            onClick={() => setShowClusters(!showClusters)}
            title={showClusters ? "Disable clustering" : "Enable clustering"}
          >
            {showClusters ? <MapPin className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
          </EnhancedButton>

          {onToggleFullscreen && (
            <EnhancedButton
              size="icon"
              variant="glass"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </EnhancedButton>
          )}
        </div>

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

        {/* Event markers or clusters */}
        {showClusters ? (
          <Source
            id="events"
            type="geojson"
            data={eventsGeoJson}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} onClick={handleClusterClick} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        ) : (
          events.filter(event => {
            // Validate coordinates before creating markers
            const lat = event.latitude;
            const lng = event.longitude;
            return lat && lng && !isNaN(lat) && !isNaN(lng) &&
                   lat !== 0 && lng !== 0 &&
                   Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
          }).map(event => (
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
                className={cn(
                  "event-marker",
                  popupEvent?.id === event.id && "scale-125 border-blue-500"
                )}
              >
                <span>{getEventIcon(event)}</span>
              </div>
            </Marker>
          ))
        )}

        {/* Event Popup */}
        {popupEvent && (() => {
          // Validate coordinates before showing popup
          const lat = popupEvent.latitude;
          const lng = popupEvent.longitude;
          const isValid = lat && lng && !isNaN(lat) && !isNaN(lng) &&
                         lat !== 0 && lng !== 0 &&
                         Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

          if (!isValid) {
            console.warn('Popup event has invalid coordinates:', { lat, lng });
            return null;
          }

          return (
            <Popup
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClose={handlePopupClose}
              closeOnClick={false}
              closeButton={true}
              maxWidth="400px"
            >
              <Card variant="glass" className="border-none shadow-none w-full">
                <CardHeader className="p-0">
                  {popupEvent.image && (
                    <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
                      <img
                        src={popupEvent.image}
                        alt={popupEvent.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4">
                        <EnhancedBadge variant="glass" className="mb-2">
                          {popupEvent.categories[0] || 'Event'}
                        </EnhancedBadge>
                        <h3 className="text-white text-xl font-bold">{popupEvent.title}</h3>
                      </div>
                    </div>
                  )}
                  {!popupEvent.image && (
                    <div className="p-4">
                      <EnhancedBadge variant="glass" className="mb-2">
                        {popupEvent.categories[0] || 'Event'}
                      </EnhancedBadge>
                      <CardTitle className="text-xl">{popupEvent.title}</CardTitle>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="font-medium">
                      {formatDate(popupEvent.date)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="font-medium">
                      {formatTime(popupEvent.time)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="font-medium">
                      {popupEvent.venue}
                    </div>
                  </div>

                  {routeDistance !== null && routeDuration !== null && (
                    <div className="flex flex-col gap-1 mt-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="font-medium">
                          {formatDistance(routeDistance)} miles away
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <div className="text-sm text-blue-300">
                          {formatDuration(routeDuration)} by car
                        </div>
                      </div>
                    </div>
                  )}

                  {popupEvent.price !== undefined && popupEvent.price !== null && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="font-medium">
                        {popupEvent.price === 0 ? 'Free' : `$${popupEvent.price}`}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  {popupEvent.url && (
                    <EnhancedButton
                      variant="glass"
                      size="sm"
                      className="w-full"
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => window.open(popupEvent.url, '_blank')}
                    >
                      Get Tickets
                    </EnhancedButton>
                  )}
                </CardFooter>
              </Card>
            </Popup>
          );
        })()}

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>

      {/* Loading indicator */}
      {isLoadingEvents && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-black/80 p-4 rounded-lg flex items-center gap-3 border border-white/10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white font-medium">Loading events...</span>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedMap.displayName = 'EnhancedMap';

export default EnhancedMap;
