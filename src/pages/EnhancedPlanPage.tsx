import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/layout/LoadingState';
import EmptyState from '@/components/layout/EmptyState';
import EnhancedMap from '../components/EnhancedMap';
import { Event } from '../types';
import { generateDatePlan } from '../services/date-planner';
import { 
  Share2, 
  Save, 
  Loader2, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Car,
  Utensils,
  Music,
  Film,
  Coffee,
  Wine,
  Ticket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { EnhancedBadge } from '@/components/ui/enhanced-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/enhanced-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';

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

// Date plan preferences
const PREFERENCES = [
  { id: 'romantic', name: 'Romantic', icon: <Heart className="h-4 w-4" /> },
  { id: 'casual', name: 'Casual', icon: <Coffee className="h-4 w-4" /> },
  { id: 'foodie', name: 'Foodie', icon: <Utensils className="h-4 w-4" /> },
  { id: 'cultural', name: 'Cultural', icon: <Ticket className="h-4 w-4" /> },
  { id: 'nightlife', name: 'Nightlife', icon: <Wine className="h-4 w-4" /> },
  { id: 'entertainment', name: 'Entertainment', icon: <Film className="h-4 w-4" /> },
  { id: 'music', name: 'Music', icon: <Music className="h-4 w-4" /> }
];

// Budget options
const BUDGET_OPTIONS = [
  { value: 50, label: 'Budget ($50)' },
  { value: 100, label: 'Moderate ($100)' },
  { value: 200, label: 'Splurge ($200)' },
  { value: 500, label: 'Luxury ($500)' }
];

// Duration options
const DURATION_OPTIONS = [
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 8, label: '8 hours (Full day)' }
];

export default function EnhancedPlanPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(4);
  const [budget, setBudget] = useState(100);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [travelTimes, setTravelTimes] = useState<number[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [step, setStep] = useState<'search' | 'results'>('search');
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const generateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !selectedDate) {
      toast.error('Please select a location and date');
      return;
    }

    setIsLoading(true);
    setEvents([]);
    setTravelTimes([]);
    setTotalCost(0);

    try {
      const result = await generateDatePlan({
        latitude: location.latitude,
        longitude: location.longitude,
        date: selectedDate.toISOString().split('T')[0],
        startTime,
        duration,
        budget,
        preferences
      });

      if (result.events && result.events.length > 0) {
        setEvents(result.events);
        setTravelTimes(result.travelTimes || []);
        setTotalCost(result.totalCost || 0);
        setStep('results');
        toast.success('Date plan generated successfully!');
      } else {
        toast.error('No suitable events found. Try adjusting your criteria.');
      }
    } catch (error) {
      console.error('Error generating date plan:', error);
      toast.error('Failed to generate date plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!currentUser) {
      toast.error('Please sign in to save your date plan');
      return;
    }

    if (events.length === 0) {
      toast.error('No date plan to save');
      return;
    }

    setIsSaving(true);

    try {
      const itineraryId = `itinerary-${Date.now()}`;
      const itineraryRef = doc(db, 'users', currentUser.uid, 'itineraries', itineraryId);

      const itinerary: SavedItinerary = {
        id: itineraryId,
        events,
        date: selectedDate.toISOString().split('T')[0],
        startTime,
        duration,
        budget,
        travelTimes,
        totalCost
      };

      await setDoc(itineraryRef, itinerary);
      toast.success('Date plan saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save date plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationChange = (newLocation: { latitude: number; longitude: number } | null) => {
    setLocation(newLocation);
  };

  const handlePreferenceToggle = (preference: string) => {
    setPreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  const renderSearchForm = () => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Perfect Date Plan</CardTitle>
        <CardDescription>
          Tell us what you're looking for and we'll create a personalized itinerary
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={generateItinerary} className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <EnhancedSearchBar
              onLocationChange={handleLocationChange}
              onSearch={() => {}}
              className="w-full"
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <EnhancedInput
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                icon={<Calendar className="h-4 w-4" />}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <EnhancedInput
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                icon={<Clock className="h-4 w-4" />}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Duration and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(option => (
                  <EnhancedBadge
                    key={option.value}
                    variant={duration === option.value ? "primary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setDuration(option.value)}
                  >
                    {option.label}
                  </EnhancedBadge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map(option => (
                  <EnhancedBadge
                    key={option.value}
                    variant={budget === option.value ? "primary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setBudget(option.value)}
                  >
                    {option.label}
                  </EnhancedBadge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferences (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map(pref => (
                <EnhancedBadge
                  key={pref.id}
                  variant={preferences.includes(pref.id) ? "primary" : "outline"}
                  className="cursor-pointer"
                  icon={pref.icon}
                  onClick={() => handlePreferenceToggle(pref.id)}
                >
                  {pref.name}
                </EnhancedBadge>
              ))}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <EnhancedButton
              type="submit"
              variant="gradient"
              className="w-full"
              loading={isLoading}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Generate Date Plan
            </EnhancedButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <div className="space-y-8">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-none">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
              <p className="font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                {formatDate(selectedDate)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Time</h3>
              <p className="font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                {formatTime(startTime)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Duration</h3>
              <p className="font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                {duration} hours
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
              <p className="font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                {formatCost(totalCost)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Your Date Itinerary</h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline Events */}
            <div className="space-y-8">
              {events.map((event, index) => {
                // Calculate event time based on start time and previous events
                let eventTime = new Date(selectedDate);
                const [hours, minutes] = startTime.split(':').map(Number);
                eventTime.setHours(hours, minutes, 0, 0);
                
                // Add duration of previous events and travel times
                for (let i = 0; i < index; i++) {
                  // Add event duration (assume 1 hour if not specified)
                  eventTime = new Date(eventTime.getTime() + (events[i].duration || 60) * 60 * 1000);
                  
                  // Add travel time to next event
                  if (travelTimes[i]) {
                    eventTime = new Date(eventTime.getTime() + travelTimes[i] * 60 * 1000);
                  }
                }
                
                const formattedTime = eventTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                
                return (
                  <div key={event.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute left-6 -translate-x-1/2 w-3 h-3 rounded-full bg-primary"></div>
                    
                    {/* Event Card */}
                    <Card 
                      className={cn(
                        "ml-10",
                        selectedEvent?.id === event.id && "border-primary"
                      )}
                      hover="lift"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{event.venue}</span>
                            </CardDescription>
                          </div>
                          <EnhancedBadge variant="secondary">
                            {formattedTime}
                          </EnhancedBadge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {event.categories && event.categories.map(category => (
                            <EnhancedBadge key={category} variant="outline" size="sm">
                              {category}
                            </EnhancedBadge>
                          ))}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatDuration(event.duration || 60)}</span>
                          </div>
                          
                          {event.price !== undefined && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>{event.price === 0 ? 'Free' : `$${event.price}`}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      {index < events.length - 1 && travelTimes[index] > 0 && (
                        <div className="px-4 py-2 border-t border-border flex items-center text-xs text-muted-foreground">
                          <Car className="h-3 w-3 mr-1" />
                          <span>{formatDuration(travelTimes[index])} travel time to next destination</span>
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Map View */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Map View</h2>
          <div className="h-[500px] rounded-lg overflow-hidden border border-border">
            <EnhancedMap
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={setSelectedEvent}
              userLocation={location}
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <EnhancedButton
          variant="outline"
          onClick={() => setStep('search')}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Modify Plan
        </EnhancedButton>
        
        <div className="flex gap-2">
          <EnhancedButton
            variant="outline"
            onClick={() => {
              // Implement share functionality
              // For now, just copy to clipboard
              const text = `Check out my date plan for ${formatDate(selectedDate)} starting at ${formatTime(startTime)}!`;
              navigator.clipboard.writeText(text);
              toast.success('Link copied to clipboard!');
            }}
            leftIcon={<Share2 className="h-4 w-4" />}
          >
            Share
          </EnhancedButton>
          
          <EnhancedButton
            variant="primary"
            onClick={saveItinerary}
            loading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
            disabled={!currentUser}
          >
            Save Plan
          </EnhancedButton>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Date Planner"
        description="Create the perfect date itinerary"
        icon={<Heart className="h-6 w-6" />}
      />
      
      {isLoading ? (
        <LoadingState message="Creating your perfect date plan..." />
      ) : step === 'search' ? (
        renderSearchForm()
      ) : (
        renderResults()
      )}
    </PageLayout>
  );
}
