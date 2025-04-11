import mapboxgl from 'mapbox-gl';
import { MutableRefObject } from 'react';

export const initializeMap = (
  mapContainer: MutableRefObject<HTMLDivElement | null>,
  mapRef: MutableRefObject<mapboxgl.Map | null>
) => {
  if (!mapContainer.current) return;

  mapRef.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [0, 20],
    zoom: 1.5,
    attributionControl: true,
    projection: 'globe',
    maxZoom: 18,
    minZoom: 1,
    antialias: true,
    pitch: 45,
    bearing: -17.6,
    renderWorldCopies: true,
    boxZoom: true,
    dragRotate: true,
    dragPan: true,
    keyboard: true,
    doubleClickZoom: true,
    touchZoomRotate: true,
    trackResize: true
  });

  // Add navigation controls
  mapRef.current.addControl(
    new mapboxgl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    }), 
    'top-right'
  );

  // Add fullscreen control
  mapRef.current.addControl(
    new mapboxgl.FullscreenControl({
      container: document.querySelector('body')!
    }), 
    'top-right'
  );

  // Add geolocate control
  const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true,
    showAccuracyCircle: true,
  });
  
  mapRef.current.addControl(geolocateControl, 'top-right');

  // Add scale control
  mapRef.current.addControl(
    new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 
    'bottom-left'
  );

  return mapRef.current;
};