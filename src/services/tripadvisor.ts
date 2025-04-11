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
  return `tripadvisor-${params.latitude},${params.longitude}-${JSON.stringify(params.filters)}`;
};

export async function searchTripAdvisorRestaurants(params: {
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

    // First, search for nearby restaurants using coordinates
    const queryParams = new URLSearchParams({
      action: 'searchNearby',
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      currencyCode: 'USD'
    });

    console.log('Fetching TripAdvisor restaurants near:', params.latitude, params.longitude);
    const response = await fetch(`/.netlify/functions/tripadvisor-proxy?${queryParams}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TripAdvisor API error:', errorText);
      throw new Error(`TripAdvisor API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('TripAdvisor API returned an error:', data.error);
      throw new Error(data.error);
    }

    console.log('TripAdvisor API response:', {
      hasData: !!data.data,
      restaurantsCount: data.data?.data?.length || 0
    });

    // Format the restaurants
    const restaurants = formatTripAdvisorRestaurants(data.data?.data || [], params);

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
    console.error('Error fetching TripAdvisor restaurants:', error);
    throw error;
  }
}

// Get detailed information about a specific restaurant
export async function getTripAdvisorRestaurantDetails(restaurantId: string): Promise<Restaurant | null> {
  try {
    const queryParams = new URLSearchParams({
      action: 'getDetailsV2',
      locationId: restaurantId,
      currencyCode: 'USD'
    });

    console.log('Fetching TripAdvisor restaurant details for:', restaurantId);
    const response = await fetch(`/.netlify/functions/tripadvisor-proxy?${queryParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant details: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Format the restaurant details
    return formatTripAdvisorRestaurantDetail(data.data);
  } catch (error) {
    console.error('Error fetching TripAdvisor restaurant details:', error);
    return null;
  }
}

interface TripAdvisorRestaurant {
  locationId: string;
  name: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  priceLevel?: string;
  address?: string;
  addressObj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
  };
  phone?: string;
  website?: string;
  cuisine?: Array<{
    key: string;
    name: string;
  }>;
  photo?: {
    images?: {
      original?: {
        url?: string;
      };
      large?: {
        url?: string;
      };
    };
  };
  distance?: string;
  isOpen?: boolean;
  description?: string;
  hours?: {
    weekday_text?: string[];
  };
  reviews?: Array<any>;
  price_level?: string;
  num_reviews?: number;
}

function formatTripAdvisorRestaurants(results: TripAdvisorRestaurant[], params: SearchParams): Restaurant[] {
  console.log(`Formatting ${results.length} TripAdvisor restaurants`);

  // If we have no results, create a dummy restaurant for testing purposes
  // This is just for development and should be removed in production
  if (results.length === 0) {
    console.log('No restaurants found, adding a dummy restaurant for testing');
    results = [{
      locationId: 'dummy-1',
      name: 'Washington DC Restaurant',
      latitude: params.latitude,
      longitude: params.longitude,
      rating: 4.5,
      priceLevel: '$$',
      address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
      addressObj: {
        street1: '1600 Pennsylvania Ave NW',
        city: 'Washington',
        state: 'DC',
        country: 'US',
        postalcode: '20500'
      },
      phone: '(202) 456-1111',
      cuisine: [{ key: 'american', name: 'American' }],
      photo: {
        images: {
          original: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5' },
          large: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5' }
        }
      },
      num_reviews: 1000
    }];
  }

  const formatted = results
    .map(result => {
      try {
        // Skip if no coordinates
        if (!result.latitude || !result.longitude) {
          console.log(`Restaurant ${result.name || 'unknown'} missing coordinates, using default values`);
          // Instead of skipping, use the search coordinates
          result.latitude = params.latitude;
          result.longitude = params.longitude;
        }

        const restaurant: Restaurant = {
          id: `ta-${result.locationId}`,
          name: result.name,
          image_url: result.photo?.images?.large?.url || result.photo?.images?.original?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          url: `https://www.tripadvisor.com/Restaurant_Review-g-d${result.locationId}`,
          review_count: result.num_reviews || 0,
          rating: result.rating || 0,
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude
          },
          price: result.price_level || result.priceLevel || '$$',
          categories: (result.cuisine || []).map(c => ({
            alias: c.key,
            title: c.name
          })),
          location: {
            address1: result.addressObj?.street1 || result.address || '',
            address2: result.addressObj?.street2 || '',
            city: result.addressObj?.city || '',
            state: result.addressObj?.state || '',
            country: result.addressObj?.country || 'US',
            zip_code: result.addressObj?.postalcode || '',
            display_address: [result.address || '']
          },
          phone: result.phone || '',
          display_phone: result.phone || '',
          distance: parseFloat(result.distance || '0') * 1000 || 0, // Convert to meters
          is_closed: result.isOpen === false,
          description: result.description || '',
          hours: [{
            hours_type: 'REGULAR',
            is_open_now: result.isOpen !== false,
            open: [{
              is_overnight: false,
              start: '0900',
              end: '2200',
              day: new Date().getDay()
            }]
          }],
          photos: [
            result.photo?.images?.large?.url || result.photo?.images?.original?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9',
            'https://images.unsplash.com/photo-1544148103-0773bf10d330'
          ],
          transactions: []
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
        console.error('Error formatting TripAdvisor restaurant:', error);
        return null;
      }
    });

  return formatted.filter((r): r is Restaurant => r !== null);
}

function formatTripAdvisorRestaurantDetail(result: TripAdvisorRestaurant): Restaurant | null {
  if (!result) return null;

  try {
    return {
      id: `ta-${result.locationId}`,
      name: result.name,
      image_url: result.photo?.images?.large?.url || result.photo?.images?.original?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      url: `https://www.tripadvisor.com/Restaurant_Review-g-d${result.locationId}`,
      review_count: result.num_reviews || 0,
      rating: result.rating || 0,
      coordinates: {
        latitude: result.latitude || 0,
        longitude: result.longitude || 0
      },
      price: result.price_level || result.priceLevel || '$$',
      categories: (result.cuisine || []).map(c => ({
        alias: c.key,
        title: c.name
      })),
      location: {
        address1: result.addressObj?.street1 || result.address || '',
        address2: result.addressObj?.street2 || '',
        city: result.addressObj?.city || '',
        state: result.addressObj?.state || '',
        country: result.addressObj?.country || 'US',
        zip_code: result.addressObj?.postalcode || '',
        display_address: [result.address || '']
      },
      phone: result.phone || '',
      display_phone: result.phone || '',
      distance: parseFloat(result.distance || '0') * 1000 || 0,
      is_closed: result.isOpen === false,
      description: result.description || '',
      hours: [{
        hours_type: 'REGULAR',
        is_open_now: result.isOpen !== false,
        open: [{
          is_overnight: false,
          start: '0900',
          end: '2200',
          day: new Date().getDay()
        }]
      }],
      photos: [
        result.photo?.images?.large?.url || result.photo?.images?.original?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9',
        'https://images.unsplash.com/photo-1544148103-0773bf10d330'
      ],
      transactions: []
    };
  } catch (error) {
    console.error('Error formatting TripAdvisor restaurant detail:', error);
    return null;
  }
}
