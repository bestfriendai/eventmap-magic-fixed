import { Event } from '../types';
import { searchAllEvents } from './events';

// Regular expression to extract event blocks from AI responses
const EVENT_REGEX = /EVENT_START\s+([\s\S]*?)EVENT_END/g;

/**
 * Extracts event information from formatted blocks in AI responses
 */
export async function extractEventsFromResponse(content: string): Promise<Event[]> {
  const events: Event[] = [];
  const matches = content.matchAll(EVENT_REGEX);
  
  for (const match of matches) {
    if (match[1]) {
      try {
        const eventData = parseEventBlock(match[1]);
        
        // Generate a unique ID for the event
        const id = `ai-event-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create an event object
        const event: Event = {
          id,
          title: eventData.title || 'Unnamed Event',
          date: eventData.date || new Date().toISOString().split('T')[0],
          time: eventData.time || '12:00 PM',
          venue: eventData.venue || 'TBD',
          address: eventData.address || '',
          description: eventData.description || '',
          categories: eventData.categories || ['Event'],
          price: eventData.price !== undefined ? parseFloat(eventData.price) : undefined,
          url: eventData.url || '',
          source: 'ai',
          // We'll need to geocode the address to get coordinates
          latitude: 0,
          longitude: 0
        };
        
        events.push(event);
      } catch (error) {
        console.error('Error parsing event block:', error);
      }
    }
  }
  
  return events;
}

/**
 * Parses a formatted event block into key-value pairs
 */
function parseEventBlock(block: string): Record<string, any> {
  const lines = block.trim().split('\n');
  const eventData: Record<string, any> = {};
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays (like categories)
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = value.substring(1, value.length - 1).split(',').map(v => v.trim());
        } catch (e) {
          // If parsing fails, keep as string
          console.error('Error parsing array value:', e);
        }
      }
      
      eventData[key] = value;
    }
  }
  
  return eventData;
}
