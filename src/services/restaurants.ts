import { Restaurant, RestaurantFilter } from '../types/restaurant';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

interface CacheEntry {
  data: Restaurant[];
  timestamp: number;
  location: string;
  filters: string;
}

interface SearchParams {
  latitude: number;
  longitude: number;
  filters?: RestaurantFilter;
}

const cache = new Map<string, CacheEntry>();

const getCacheKey = (params: SearchParams): string => {
  return `${params.latitude},${params.longitude}-${JSON.stringify(params.filters)}`;
};

export async function searchRestaurants(params: {
  latitude: number;
  longitude: number;
  page?: number;
  filters?: RestaurantFilter;
}): Promise<{ restaurants: Restaurant[]; totalCount: number; hasMore: boolean }> {
  try {
    const cacheKey = getCacheKey(params);
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      const start = ((params.page || 1) - 1) * PAGE_SIZE;
      return {
        restaurants: cached.data.slice(start, start + PAGE_SIZE),
        totalCount: cached.data.length,
        hasMore: start + PAGE_SIZE < cached.data.length
      };
    }

    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      limit: '50',
      sort_by: 'distance',
      radius: '40000' // 40km radius
    });

    const response = await fetch(`/.netlify/functions/yelp-proxy?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch restaurants');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const restaurants = formatRestaurants(data.businesses || [], params);

    // Cache the full result set
    cache.set(cacheKey, {
      data: restaurants,
      timestamp: now,
      location: `${params.latitude},${params.longitude}`,
      filters: JSON.stringify(params.filters)
    });

    const start = ((params.page || 1) - 1) * PAGE_SIZE;
    return {
      restaurants: restaurants.slice(start, start + PAGE_SIZE),
      totalCount: restaurants.length,
      hasMore: start + PAGE_SIZE < restaurants.length
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

interface YelpBusiness {
  id: string;
  name: string;
  image_url?: string;
  url?: string;
  review_count?: number;
  rating?: number;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  price?: string;
  categories?: Array<{
    alias: string;
    title: string;
  }>;
  location?: {
    address1?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    display_address?: string[];
  };
  phone?: string;
  display_phone?: string;
  distance?: number;
  is_closed?: boolean;
  transactions?: string[];
}

function formatRestaurants(results: YelpBusiness[], params: SearchParams): Restaurant[] {
  const formatted = results
    .map(result => {
      try {
        const restaurant: Restaurant = {
          id: result.id,
          name: result.name,
          image_url: result.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          url: result.url || '',
          review_count: result.review_count || 0,
          rating: result.rating || 0,
          coordinates: {
            latitude: result.coordinates?.latitude || params.latitude,
            longitude: result.coordinates?.longitude || params.longitude
          },
          price: result.price || '$$',
          categories: result.categories || [],
          location: {
            address1: result.location?.address1 || '',
            city: result.location?.city || '',
            state: result.location?.state || '',
            country: result.location?.country || 'US',
            zip_code: result.location?.zip_code || '',
            display_address: result.location?.display_address || []
          },
          phone: result.phone || '',
          display_phone: result.display_phone || '',
          distance: result.distance || 0,
          is_closed: result.is_closed || false,
          hours: [{
            hours_type: 'REGULAR',
            is_open_now: !result.is_closed,
            open: [{
              is_overnight: false,
              start: '0900',
              end: '2200',
              day: new Date().getDay()
            }]
          }],
          photos: [
            result.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9',
            'https://images.unsplash.com/photo-1544148103-0773bf10d330'
          ],
          transactions: result.transactions || []
        };

        // Apply filters if provided
        if (params.filters) {
          if (params.filters.rating > 0 && restaurant.rating < params.filters.rating) {
            return null;
          }
          if (params.filters.price.length > 0 && !params.filters.price.includes(restaurant.price?.length.toString())) {
            return null;
          }
          if (params.filters.categories.length > 0 && !restaurant.categories.some(c => 
            params.filters.categories.includes(c.alias)
          )) {
            return null;
          }
          if (params.filters.distance > 0 && restaurant.distance > params.filters.distance * 1609.34) {
            return null;
          }
          if (params.filters.openNow && restaurant.is_closed) {
            return null;
          }
        }

        return restaurant;
      } catch (error) {
        console.error('Error formatting restaurant:', error);
        return null;
      }
    });

  return formatted.filter((r): r is Restaurant => r !== null);
}