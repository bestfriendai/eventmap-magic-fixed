import { Event } from '../../types';
import { 
  Music2, Trophy, Utensils, Theater, Users, Palette,
  MapPin, Calendar, Clock, MapPinned, Ticket, Star,
  PartyPopper, Mic2, Film, Gamepad2, BookOpen, Tent, Heart
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import { Card, CardBody, CardHeader, CardFooter, Button, Chip, Divider } from "@nextui-org/react";

const getEventIcon = (event: Event) => {
  const categories = event.categories.map(c => c.toLowerCase());

  if (categories.includes('music')) return <Music2 className="event-marker-icon" />;
  if (categories.includes('sports')) return <Trophy className="event-marker-icon" />;
  if (categories.includes('food')) return <Utensils className="event-marker-icon" />;
  if (categories.includes('arts')) return <Palette className="event-marker-icon" />;
  if (categories.includes('theatre') || categories.includes('theater')) return <Theater className="event-marker-icon" />;
  if (categories.includes('community')) return <Users className="event-marker-icon" />;
  if (categories.includes('entertainment')) return <Star className="event-marker-icon" />;
  if (categories.includes('festival')) return <PartyPopper className="event-marker-icon" />;
  if (categories.includes('comedy')) return <Mic2 className="event-marker-icon" />;
  if (categories.includes('film')) return <Film className="event-marker-icon" />;
  if (categories.includes('gaming')) return <Gamepad2 className="event-marker-icon" />;
  if (categories.includes('literary')) return <BookOpen className="event-marker-icon" />;
  if (categories.includes('outdoor')) return <Tent className="event-marker-icon" />;
  if (categories.includes('family')) return <Heart className="event-marker-icon" />;
  return <MapPin className="event-marker-icon" />;
};

export const createEventMarker = (event: Event) => {
  const markerElement = document.createElement('div');
  markerElement.className = `event-marker ${event.source === 'realtime' ? 'realtime' : ''}`;
  
  const root = createRoot(markerElement);
  root.render(getEventIcon(event));
  
  return markerElement;
};

export const createEventPopup = (event: Event) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'event-popup';
  
  const root = createRoot(popupContent);
  root.render(
    <Card className="w-[400px] border-none bg-background/95 backdrop-blur-md shadow-2xl animate-fade-in">
      <CardHeader className="relative p-0">
        <div className="relative w-full h-52">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Chip
              variant="shadow"
              classNames={{
                base: event.source === 'realtime' ? 
                  "bg-blue-500/20 border-blue-500/30" : 
                  "bg-primary/20 border-primary/30",
                content: event.source === 'realtime' ? 
                  "text-blue-500" : 
                  "text-primary"
              }}
            >
              {event.source === 'realtime' ? 'RealTime' : 'Ticketmaster'}
            </Chip>
            <h3 className="font-semibold text-xl mt-2 leading-tight text-white">{event.title}</h3>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="gap-4">
        <div className="flex flex-wrap gap-2">
          {event.categories.map(category => (
            <Chip
              key={category}
              variant="flat"
              size="sm"
              classNames={{
                base: "bg-default-100",
                content: "text-default-600"
              }}
            >
              {category}
            </Chip>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-default-100 p-3 rounded-lg">
            <Calendar className="w-4 h-4 text-default-500" />
            <span className="text-sm">{event.date}</span>
          </div>
          
          <div className="flex items-center gap-3 bg-default-100 p-3 rounded-lg">
            <Clock className="w-4 h-4 text-default-500" />
            <span className="text-sm">{event.time}</span>
          </div>
          
          <div className="flex items-center gap-3 bg-default-100 p-3 rounded-lg">
            <MapPinned className="w-4 h-4 text-default-500 shrink-0" />
            <span className="text-sm line-clamp-2">{event.venue}</span>
          </div>
          
          {event.price && (
            <div className="flex items-center gap-3 bg-default-100 p-3 rounded-lg">
              <Ticket className="w-4 h-4 text-default-500" />
              <span className="text-sm">Starting from ${event.price}</span>
            </div>
          )}
        </div>
      </CardBody>

      {event.url && (
        <>
          <Divider />
          <CardFooter>
            <Button
              as="a"
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              size="lg"
              className="w-full"
            >
              Get Tickets
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );

  return new mapboxgl.Popup({
    offset: {
      'top': [0, 10],
      'top-left': [0, 10],
      'top-right': [0, 10],
      'bottom': [0, -40],
      'bottom-left': [0, -40],
      'bottom-right': [0, -40],
      'left': [10, 0],
      'right': [-10, 0]
    },
    closeButton: true,
    closeOnClick: false,
    maxWidth: 'none',
    className: 'event-popup-container',
    anchor: 'bottom',
    focusAfterOpen: false
  }).setDOMContent(popupContent);
};
