import React, { useState, useCallback } from 'react';
import Map from '../components/Map';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import EventSidebar from '../components/EventSidebar';
import { Event } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Index() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const fetchEventsForLocation = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-events', {
        body: JSON.stringify({ latitude, longitude })
      });

      if (error) throw error;
      
      // Sort events by date (soonest first)
      const sortedEvents = data.events.sort((a: Event, b: Event) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocationFound = async (latitude: number, longitude: number) => {
    // Create a temporary "event" to trigger the map transition
    const locationEvent: Event = {
      id: 'user-location',
      title: 'Your Location',
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      venue: 'Current Location',
      latitude,
      longitude,
      location: {
        address: 'Current Location',
        latitude,
        longitude
      },
      image: '',
      categories: [],
      source: 'user',
      price: null,
      url: ''
    };
    
    // Set this as the selected event to trigger the map transition
    setSelectedEvent(locationEvent);
    
    // Fetch events for this location
    await fetchEventsForLocation(latitude, longitude);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-background">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <SearchBar
            onLocationChange={(location) => location && handleLocationFound(location.latitude, location.longitude)}
            onSearch={() => {}} // Add empty handler to satisfy prop requirements
          />
        </div>

        {/* Sidebar */}
        <div
          className={`fixed md:relative z-40 w-full md:w-[400px] h-full bg-background/95 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <EventSidebar 
            events={events} 
            loading={loading}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map 
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
          />
        </div>

        {/* Mobile Overlay */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
}
