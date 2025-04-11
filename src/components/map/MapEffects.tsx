import mapboxgl from 'mapbox-gl';

export const setupMapEffects = (map: mapboxgl.Map) => {
  map.on('style.load', () => {
    map.setFog({
      'range': [0.8, 8],
      'color': '#242B4B',
      'high-color': '#161B36',
      'space-color': '#0B1026',
      'horizon-blend': 0.1,
      'star-intensity': 0.15
    });

    map.setLight({
      anchor: 'map',
      color: '#ffffff',
      intensity: 0.4,
      position: [1.5, 90, 80]
    });

    map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 90.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
  });
};