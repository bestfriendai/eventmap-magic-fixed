import { Restaurant, RestaurantFilter } from '../types/restaurant';
import { searchTripAdvisorRestaurants, getTripAdvisorRestaurantDetails } from './tripadvisor';

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

    // Only use TripAdvisor for restaurant data
    console.log('Fetching restaurants from TripAdvisor...');
    const tripAdvisorResults = await searchTripAdvisorRestaurants(params);

    console.log(`Found ${tripAdvisorResults.restaurants.length} restaurants from TripAdvisor`);

    // Cache the full result set
    cache.set(cacheKey, {
      data: tripAdvisorResults.restaurants,
      timestamp: now,
      location: `${params.latitude},${params.longitude}`,
      filters: JSON.stringify(params.filters)
    });

    return tripAdvisorResults;
  } catch (error) {
    console.error('Error fetching restaurants from TripAdvisor:', error);
    // Return empty results instead of throwing
    return {
      restaurants: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

// Get detailed information about a specific restaurant
export async function getRestaurantDetails(restaurantId: string): Promise<Restaurant | null> {
  try {
    // Check if it's a TripAdvisor restaurant ID
    if (restaurantId.startsWith('ta-')) {
      const taId = restaurantId.replace('ta-', '');
      return await getTripAdvisorRestaurantDetails(taId);
    }

    // Otherwise, implement Yelp details fetching here if needed
    // For now, return null for Yelp restaurants
    return null;
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return null;
  }
}

// Get detailed information about a specific restaurant by ID
export async function getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  // If it's a TripAdvisor ID, use the TripAdvisor service
  if (restaurantId.startsWith('ta-')) {
    return getRestaurantDetails(restaurantId);
  }

  // For other IDs, return null (we're only using TripAdvisor now)
  console.warn(`Restaurant ID ${restaurantId} is not a TripAdvisor ID`);
  return null;
}