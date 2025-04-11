export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  venue: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  latitude: number;
  longitude: number;
  image?: string;
  categories: string[];
  source: 'ticketmaster' | 'eventbrite' | 'realtime' | 'google' | 'ai' | string;
  price?: number | null;
  url?: string;
  distance?: number;
  // Optional fields for different API sources
  imageUrl?: string; // Alternative to image
  ticketUrl?: string; // Alternative to url
  category?: string; // Single category
  subcategory?: string; // Subcategory
  status?: string; // Event status
  priceRange?: string; // Price range as string
  venue_details?: {
    name?: string;
    city?: string;
    state?: string;
    capacity?: number;
    generalInfo?: string;
    rating?: number;
    reviews?: number;
  };
  attractions?: Array<{
    name: string;
    type?: string;
    image?: string;
    url?: string;
  }>;
}

export interface Filter {
  category?: string;
  dateRange?: string;
  priceRange?: string; // Changed from string[] to string
  distance?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  error?: string;
}
