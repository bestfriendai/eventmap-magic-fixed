import React, { useState, useCallback, useEffect } from 'react';
import EnhancedMap from '../components/EnhancedMap';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import CardGrid from '@/components/layout/CardGrid';
import LoadingState from '@/components/layout/LoadingState';
import EmptyState from '@/components/layout/EmptyState';
import { Restaurant, RestaurantFilter } from '../types/restaurant';
import { searchRestaurants } from '../services/restaurants';
import { 
  Filter, 
  SlidersHorizontal, 
  Utensils, 
  Star, 
  DollarSign, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  X,
  Search,
  Coffee,
  Pizza,
  Beef,
  Wine,
  Salad,
  Sandwich
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from '../hooks/useLocation';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedBadge } from '@/components/ui/enhanced-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/enhanced-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Restaurant categories with icons
const RESTAURANT_CATEGORIES = [
  { id: 'all', name: 'All', icon: <Utensils className="h-4 w-4" /> },
  { id: 'italian', name: 'Italian', icon: <Pizza className="h-4 w-4" /> },
  { id: 'american', name: 'American', icon: <Beef className="h-4 w-4" /> },
  { id: 'cafe', name: 'Café', icon: <Coffee className="h-4 w-4" /> },
  { id: 'bar', name: 'Bar', icon: <Wine className="h-4 w-4" /> },
  { id: 'vegetarian', name: 'Vegetarian', icon: <Salad className="h-4 w-4" /> },
  { id: 'fastfood', name: 'Fast Food', icon: <Sandwich className="h-4 w-4" /> }
];

// Price ranges
const PRICE_RANGES = [
  { id: '1', name: '$', description: 'Inexpensive' },
  { id: '2', name: '$$', description: 'Moderate' },
  { id: '3', name: '$$$', description: 'Expensive' },
  { id: '4', name: '$$$$', description: 'Very Expensive' }
];

export default function EnhancedRestaurantsPage() {
  const { location: userLocation } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentFilters, setCurrentFilters] = useState<RestaurantFilter>({
    categories: [],
    price: [],
    rating: 0,
    distance: 30,
    openNow: false
  });

  const fetchRestaurants = useCallback(async (isLoadingMore = false) => {
    const location = searchLocation || userLocation;
    if (!location) {
      toast.error('Please select a location first');
      return;
    }

    try {
      if (!isLoadingMore) {
        setIsLoading(true);
        setPage(1);
      } else {
        setIsLoadingMore(true);
      }

      const result = await searchRestaurants({
        latitude: location.latitude,
        longitude: location.longitude,
        page: isLoadingMore ? page + 1 : 1,
        filters: currentFilters,
        term: searchQuery
      });

      if (result.restaurants) {
        if (isLoadingMore) {
          setRestaurants(prev => [...prev, ...result.restaurants]);
          setPage(prev => prev + 1);
        } else {
          setRestaurants(result.restaurants);
        }
        
        setHasMore(result.restaurants.length > 0);
        
        if (result.restaurants.length > 0) {
          toast.success(`Found ${isLoadingMore ? 'more' : result.restaurants.length} restaurants`);
        } else if (!isLoadingMore) {
          toast.info('No restaurants found with these filters');
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to fetch restaurants');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchLocation, userLocation, currentFilters, page, searchQuery]);

  // Effect to fetch restaurants when location changes
  useEffect(() => {
    if (searchLocation || (userLocation && !isLoading)) {
      fetchRestaurants();
    }
  }, [searchLocation, userLocation, fetchRestaurants]);

  const handleLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    setSearchLocation(location);
  }, []);

  const handleFilterChange = (key: keyof RestaurantFilter, value: any) => {
    setCurrentFilters(prev => {
      // Handle array values (categories, price)
      if (Array.isArray(prev[key])) {
        const currentArray = prev[key] as any[];
        
        // If the value is already in the array, remove it
        if (currentArray.includes(value)) {
          return {
            ...prev,
            [key]: currentArray.filter(item => item !== value)
          };
        } 
        // Otherwise add it
        else {
          return {
            ...prev,
            [key]: [...currentArray, value]
          };
        }
      } 
      // Handle boolean toggle (openNow)
      else if (typeof prev[key] === 'boolean') {
        return {
          ...prev,
          [key]: !prev[key]
        };
      } 
      // Handle other values
      else {
        return {
          ...prev,
          [key]: value
        };
      }
    });
  };

  const resetFilters = () => {
    setCurrentFilters({
      categories: [],
      price: [],
      rating: 0,
      distance: 30,
      openNow: false
    });
    setSearchQuery('');
  };

  const handleSearch = () => {
    fetchRestaurants();
  };

  const renderRestaurantCard = (restaurant: Restaurant) => (
    <Card 
      key={restaurant.id}
      variant="default"
      hover="lift"
      className="overflow-hidden"
    >
      {restaurant.image_url && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={restaurant.image_url} 
            alt={restaurant.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
          <div className="flex items-center bg-primary/10 px-2 py-1 rounded-md">
            <Star className="h-3 w-3 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
        </div>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">{restaurant.location.address1}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {restaurant.categories.map(category => (
            <EnhancedBadge key={category.alias} variant="secondary" size="sm">
              {category.title}
            </EnhancedBadge>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>{restaurant.price || '$'}</span>
          </div>
          
          {restaurant.distance && (
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{(restaurant.distance / 1609.34).toFixed(1)} mi</span>
            </div>
          )}
          
          {restaurant.is_closed !== undefined && (
            <div className={cn(
              "flex items-center",
              !restaurant.is_closed ? "text-green-500" : "text-red-500"
            )}>
              <Clock className="h-3 w-3 mr-1" />
              <span>{!restaurant.is_closed ? "Open" : "Closed"}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <EnhancedButton 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setSelectedRestaurant(restaurant);
            setViewMode('map');
          }}
        >
          View on Map
        </EnhancedButton>
      </CardFooter>
    </Card>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Restaurants"
        description="Find the perfect dining spot for your date"
        icon={<Utensils className="h-6 w-6" />}
        actions={
          <>
            <EnhancedButton
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </EnhancedButton>
            <EnhancedButton
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              Map View
            </EnhancedButton>
          </>
        }
      />
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-auto flex-1">
            <div className="relative">
              <EnhancedInput
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                clearable
                onClear={() => setSearchQuery('')}
                className="w-full"
              />
            </div>
          </div>
          
          <EnhancedSearchBar
            onLocationChange={handleLocationChange}
            onSearch={handleSearch}
            isLoading={isLoading}
            className="w-full md:w-auto md:min-w-[300px]"
          />
          
          <EnhancedButton
            variant={showFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          >
            Filters
          </EnhancedButton>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {RESTAURANT_CATEGORIES.map(category => (
                        <EnhancedBadge
                          key={category.id}
                          variant={currentFilters.categories.includes(category.id) ? "primary" : "outline"}
                          className="cursor-pointer"
                          icon={category.icon}
                          onClick={() => handleFilterChange('categories', category.id)}
                        >
                          {category.name}
                        </EnhancedBadge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Price Range</h3>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_RANGES.map(price => (
                        <EnhancedBadge
                          key={price.id}
                          variant={currentFilters.price.includes(price.id) ? "primary" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleFilterChange('price', price.id)}
                        >
                          {price.name}
                        </EnhancedBadge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Other Filters */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Additional Filters</h3>
                    
                    {/* Rating */}
                    <div className="mb-4">
                      <label className="text-sm block mb-2">Minimum Rating</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={currentFilters.rating}
                          onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center bg-primary/10 px-2 py-1 rounded-md min-w-[60px] justify-center">
                          {currentFilters.rating > 0 ? (
                            <>
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">{currentFilters.rating}</span>
                            </>
                          ) : (
                            <span className="text-sm">Any</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Distance */}
                    <div className="mb-4">
                      <label className="text-sm block mb-2">Maximum Distance (miles)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={currentFilters.distance}
                          onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="min-w-[60px] text-center">
                          <span className="text-sm font-medium">{currentFilters.distance} mi</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Open Now */}
                    <div className="flex items-center">
                      <EnhancedButton
                        variant={currentFilters.openNow ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('openNow', !currentFilters.openNow)}
                        leftIcon={<Clock className="h-4 w-4" />}
                      >
                        Open Now
                      </EnhancedButton>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <EnhancedButton
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </EnhancedButton>
                  
                  <EnhancedButton
                    variant="primary"
                    className="ml-2"
                    onClick={() => {
                      fetchRestaurants();
                      setShowFilters(false);
                    }}
                  >
                    Apply Filters
                  </EnhancedButton>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {viewMode === 'grid' ? (
        <>
          {isLoading ? (
            <LoadingState message="Finding restaurants..." />
          ) : restaurants.length === 0 ? (
            <EmptyState
              title="No restaurants found"
              description="Try adjusting your filters or search in a different area"
              icon={<Utensils className="h-6 w-6" />}
              action={{
                label: "Reset Filters",
                onClick: resetFilters
              }}
            />
          ) : (
            <>
              <CardGrid columns={3} gap="md">
                {restaurants.map(restaurant => renderRestaurantCard(restaurant))}
              </CardGrid>
              
              {hasMore && (
                <div className="mt-8 text-center">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => fetchRestaurants(true)}
                    loading={isLoadingMore}
                  >
                    Load More Restaurants
                  </EnhancedButton>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="h-[600px] rounded-lg overflow-hidden border border-border">
          <EnhancedMap
            events={restaurants.map(restaurant => ({
              id: restaurant.id,
              title: restaurant.name,
              latitude: restaurant.coordinates.latitude,
              longitude: restaurant.coordinates.longitude,
              venue: restaurant.location.address1,
              categories: restaurant.categories.map(c => c.title),
              date: new Date().toISOString().split('T')[0],
              time: restaurant.is_closed ? 'Closed' : 'Open',
              price: restaurant.price ? restaurant.price.length : 0,
              image: restaurant.image_url,
              distance: restaurant.distance ? restaurant.distance / 1609.34 : undefined
            }))}
            selectedEvent={selectedRestaurant ? {
              id: selectedRestaurant.id,
              title: selectedRestaurant.name,
              latitude: selectedRestaurant.coordinates.latitude,
              longitude: selectedRestaurant.coordinates.longitude,
              venue: selectedRestaurant.location.address1,
              categories: selectedRestaurant.categories.map(c => c.title),
              date: new Date().toISOString().split('T')[0],
              time: selectedRestaurant.is_closed ? 'Closed' : 'Open',
              price: selectedRestaurant.price ? selectedRestaurant.price.length : 0,
              image: selectedRestaurant.image_url,
              distance: selectedRestaurant.distance ? selectedRestaurant.distance / 1609.34 : undefined
            } : null}
            onEventSelect={(event) => {
              const restaurant = restaurants.find(r => r.id === event.id);
              if (restaurant) {
                setSelectedRestaurant(restaurant);
              }
            }}
            userLocation={searchLocation || userLocation}
            isLoadingEvents={isLoading}
          />
        </div>
      )}
    </PageLayout>
  );
}
