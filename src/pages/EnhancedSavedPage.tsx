import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { Restaurant } from '../types/restaurant';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Heart, 
  Trash, 
  Share2, 
  Bookmark, 
  Utensils, 
  CalendarDays,
  Loader2,
  Search,
  Filter,
  X
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import CardGrid from '@/components/layout/CardGrid';
import LoadingState from '@/components/layout/LoadingState';
import EmptyState from '@/components/layout/EmptyState';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { EnhancedBadge } from '@/components/ui/enhanced-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/enhanced-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SavedItinerary {
  id: string;
  events: Event[];
  date: string;
  startTime: string;
  duration: number;
  budget: number;
  travelTimes: number[];
  totalCost: number;
}

export default function EnhancedSavedPage() {
  const { currentUser } = useAuth();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'restaurants' | 'itineraries'>('events');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchSavedItems = async () => {
      setIsLoading(true);
      try {
        // Fetch saved events
        const eventsQuery = query(
          collection(db, 'savedEvents'),
          where('userId', '==', currentUser.uid)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        setSavedEvents(eventsSnapshot.docs.map(doc => ({
          ...doc.data() as Event,
          id: doc.id
        })));

        // Fetch saved restaurants
        const restaurantsQuery = query(
          collection(db, 'savedRestaurants'),
          where('userId', '==', currentUser.uid)
        );
        const restaurantsSnapshot = await getDocs(restaurantsQuery);
        setSavedRestaurants(restaurantsSnapshot.docs.map(doc => ({
          ...doc.data() as Restaurant,
          id: doc.id
        })));

        // Fetch saved itineraries
        const itinerariesQuery = query(
          collection(db, 'users', currentUser.uid, 'itineraries')
        );
        const itinerariesSnapshot = await getDocs(itinerariesQuery);
        setSavedItineraries(itinerariesSnapshot.docs.map(doc => ({
          ...doc.data() as SavedItinerary,
          id: doc.id
        })));
      } catch (error) {
        console.error('Error fetching saved items:', error);
        toast.error('Failed to load saved items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedItems();
  }, [currentUser]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return;
    
    setIsDeleting(prev => ({ ...prev, [eventId]: true }));
    
    try {
      await deleteDoc(doc(db, 'savedEvents', eventId));
      setSavedEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Event removed from saved items');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to remove event');
    } finally {
      setIsDeleting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!currentUser) return;
    
    setIsDeleting(prev => ({ ...prev, [restaurantId]: true }));
    
    try {
      await deleteDoc(doc(db, 'savedRestaurants', restaurantId));
      setSavedRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
      toast.success('Restaurant removed from saved items');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to remove restaurant');
    } finally {
      setIsDeleting(prev => ({ ...prev, [restaurantId]: false }));
    }
  };

  const handleDeleteItinerary = async (itineraryId: string) => {
    if (!currentUser) return;
    
    setIsDeleting(prev => ({ ...prev, [itineraryId]: true }));
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'itineraries', itineraryId));
      setSavedItineraries(prev => prev.filter(itinerary => itinerary.id !== itineraryId));
      toast.success('Itinerary removed from saved items');
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error('Failed to remove itinerary');
    } finally {
      setIsDeleting(prev => ({ ...prev, [itineraryId]: false }));
    }
  };

  const filteredEvents = savedEvents.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRestaurants = savedRestaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.location.address1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.categories.some(cat => cat.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredItineraries = savedItineraries.filter(itinerary => 
    itinerary.events.some(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    itinerary.date.includes(searchQuery.toLowerCase())
  );

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

  const renderEventCard = (event: Event) => (
    <Card key={event.id} hover="lift" className="overflow-hidden">
      {event.image && (
        <div className="h-40 w-full overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{event.title}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>{event.venue}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {event.categories && event.categories.map(category => (
            <EnhancedBadge key={category} variant="secondary" size="sm">
              {category}
            </EnhancedBadge>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(event.date)}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatTime(event.time)}</span>
          </div>
          
          {event.price !== undefined && (
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>{event.price === 0 ? 'Free' : `$${event.price}`}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        {event.url ? (
          <EnhancedButton 
            variant="outline" 
            size="sm"
            onClick={() => window.open(event.url, '_blank')}
          >
            View Details
          </EnhancedButton>
        ) : (
          <div></div>
        )}
        
        <EnhancedButton 
          variant="ghost" 
          size="icon-sm"
          onClick={() => handleDeleteEvent(event.id)}
          loading={isDeleting[event.id]}
        >
          <Trash className="h-4 w-4 text-destructive" />
        </EnhancedButton>
      </CardFooter>
    </Card>
  );

  const renderRestaurantCard = (restaurant: Restaurant) => (
    <Card key={restaurant.id} hover="lift" className="overflow-hidden">
      {restaurant.image_url && (
        <div className="h-40 w-full overflow-hidden">
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
          <span>{restaurant.location.address1}</span>
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
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        {restaurant.url ? (
          <EnhancedButton 
            variant="outline" 
            size="sm"
            onClick={() => window.open(restaurant.url, '_blank')}
          >
            View Details
          </EnhancedButton>
        ) : (
          <div></div>
        )}
        
        <EnhancedButton 
          variant="ghost" 
          size="icon-sm"
          onClick={() => handleDeleteRestaurant(restaurant.id)}
          loading={isDeleting[restaurant.id]}
        >
          <Trash className="h-4 w-4 text-destructive" />
        </EnhancedButton>
      </CardFooter>
    </Card>
  );

  const renderItineraryCard = (itinerary: SavedItinerary) => (
    <Card key={itinerary.id} hover="lift" className="overflow-hidden">
      <CardHeader className="p-4 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Date Plan</CardTitle>
          <EnhancedBadge variant="glass">
            {formatDate(itinerary.date)}
          </EnhancedBadge>
        </div>
        <CardDescription className="flex items-center mt-1">
          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>Starts at {formatTime(itinerary.startTime)} • {itinerary.duration} hours</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3 mb-4">
          {itinerary.events.slice(0, 3).map((event, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{event.title}</h4>
                <p className="text-xs text-muted-foreground">{event.venue}</p>
              </div>
            </div>
          ))}
          
          {itinerary.events.length > 3 && (
            <div className="text-center text-sm text-muted-foreground">
              +{itinerary.events.length - 3} more stops
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1 text-primary" />
            <span>Total: ${itinerary.totalCost.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-primary" />
            <span>{itinerary.events.length} stops</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <EnhancedButton 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Navigate to plan page with this itinerary
            // For now, just show a toast
            toast.info('View itinerary functionality coming soon');
          }}
        >
          View Plan
        </EnhancedButton>
        
        <EnhancedButton 
          variant="ghost" 
          size="icon-sm"
          onClick={() => handleDeleteItinerary(itinerary.id)}
          loading={isDeleting[itinerary.id]}
        >
          <Trash className="h-4 w-4 text-destructive" />
        </EnhancedButton>
      </CardFooter>
    </Card>
  );

  const renderContent = () => {
    if (!currentUser) {
      return (
        <EmptyState
          title="Sign in to view saved items"
          description="You need to be signed in to save and view your favorite events, restaurants, and date plans."
          icon={<Bookmark className="h-6 w-6" />}
        />
      );
    }

    if (isLoading) {
      return <LoadingState message="Loading your saved items..." />;
    }

    switch (activeTab) {
      case 'events':
        return filteredEvents.length > 0 ? (
          <CardGrid columns={3} gap="md">
            {filteredEvents.map(renderEventCard)}
          </CardGrid>
        ) : (
          <EmptyState
            title="No saved events"
            description="Events you save will appear here"
            icon={<Calendar className="h-6 w-6" />}
          />
        );
      
      case 'restaurants':
        return filteredRestaurants.length > 0 ? (
          <CardGrid columns={3} gap="md">
            {filteredRestaurants.map(renderRestaurantCard)}
          </CardGrid>
        ) : (
          <EmptyState
            title="No saved restaurants"
            description="Restaurants you save will appear here"
            icon={<Utensils className="h-6 w-6" />}
          />
        );
      
      case 'itineraries':
        return filteredItineraries.length > 0 ? (
          <CardGrid columns={3} gap="md">
            {filteredItineraries.map(renderItineraryCard)}
          </CardGrid>
        ) : (
          <EmptyState
            title="No saved date plans"
            description="Date plans you create and save will appear here"
            icon={<CalendarDays className="h-6 w-6" />}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Saved Items"
        description="Your saved events, restaurants, and date plans"
        icon={<Heart className="h-6 w-6" />}
      />
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2">
            <EnhancedButton
              variant={activeTab === 'events' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('events')}
            >
              Events
            </EnhancedButton>
            
            <EnhancedButton
              variant={activeTab === 'restaurants' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('restaurants')}
            >
              Restaurants
            </EnhancedButton>
            
            <EnhancedButton
              variant={activeTab === 'itineraries' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('itineraries')}
            >
              Date Plans
            </EnhancedButton>
          </div>
          
          <div className="w-full md:w-auto flex-1">
            <EnhancedInput
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              clearable
              onClear={() => setSearchQuery('')}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {renderContent()}
    </PageLayout>
  );
}
