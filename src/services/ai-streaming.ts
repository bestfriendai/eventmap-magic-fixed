import { Event } from '../types';
import { Message } from '../types/chat';
import { searchAllEvents } from './events';
import { searchRestaurants } from './restaurants';
import { extractEventsFromResponse } from './ai-parser';

// Generate a unique ID
const generateId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  onEvents?: (events: Event[]) => void;
}

export class AIStreamingService {
  private apiUrl: string;
  private apiKey: string;
  private controller: AbortController | null = null;

  constructor() {
    this.apiUrl = 'https://api.openrouter.ai/api/v1/chat/completions';
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
  }

  public async sendMessage(
    messages: Message[],
    userLocation: { latitude: number; longitude: number } | null,
    options: StreamingOptions = {}
  ): Promise<Message> {
    // Abort any ongoing request
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();
    const signal = this.controller.signal;

    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system message with context
    const systemMessage = {
      role: 'system',
      content: this.buildSystemPrompt(userLocation)
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP_REFERER': 'https://dateapril.netlify.app/',
          'X-Title': 'DateAI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet-20240229',
          messages: [systemMessage, ...formattedMessages],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                fullResponse += content;
                options.onChunk?.(content);
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }

      options.onComplete?.(fullResponse);

      // Extract events from the response
      try {
        const events = await this.extractEventsFromResponse(fullResponse, userLocation);
        options.onEvents?.(events);

        // Create and return the assistant message
        return {
          id: generateId(),
          role: 'assistant',
          content: fullResponse,
          events: events.length > 0 ? events : undefined
        };
      } catch (error) {
        console.error('Error extracting events:', error);

        return {
          id: uuidv4(),
          role: 'assistant',
          content: fullResponse
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          console.error('Error in AI request:', error);
          options.onError?.(error);
        }
      }

      throw error;
    } finally {
      this.controller = null;
    }
  }

  public cancelRequest(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private buildSystemPrompt(userLocation: { latitude: number; longitude: number } | null): string {
    let locationContext = '';

    if (userLocation) {
      locationContext = `The user's current location is: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude}.`;
    }

    return `You are an AI assistant specialized in helping users plan dates and find events and activities.

${locationContext}

Your goal is to provide helpful, accurate, and personalized recommendations for date ideas, events, and activities.

When suggesting events or activities:
1. Be specific and provide details like venue names, times, and descriptions
2. Consider the user's preferences and constraints
3. Suggest a variety of options when appropriate
4. Be conversational and friendly

If the user asks about events, restaurants, or activities in a specific location, provide relevant suggestions.
If the user doesn't specify a location, use their current location if available.

When you mention specific events, format them like this:
EVENT_START
title: Event Title
date: YYYY-MM-DD
time: HH:MM AM/PM
venue: Venue Name
address: Full Address
description: Brief description
categories: [category1, category2]
price: Price (use 0 for free events)
url: Ticket or event URL (if available)
EVENT_END

Current date: ${new Date().toISOString().split('T')[0]}
Current time: ${new Date().toLocaleTimeString()}`;
  }

  private async extractEventsFromResponse(
    content: string,
    userLocation: { latitude: number; longitude: number } | null
  ): Promise<Event[]> {
    // First try to extract events from the formatted blocks
    const extractedEvents = await extractEventsFromResponse(content);

    if (extractedEvents.length > 0) {
      return extractedEvents;
    }

    // If no events were found in the formatted blocks, try to search for events
    // based on keywords in the response
    if (userLocation) {
      const keywords = this.extractKeywords(content);

      if (keywords.length > 0) {
        try {
          const searchResults = await searchAllEvents({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            keyword: keywords.join(' '),
            radius: 30
          });

          return searchResults.slice(0, 5); // Limit to 5 events
        } catch (error) {
          console.error('Error searching for events:', error);
        }
      }
    }

    return [];
  }

  private extractKeywords(content: string): string[] {
    // Extract potential event keywords from the response
    const keywords: string[] = [];

    // Look for event types
    const eventTypes = [
      'concert', 'music', 'festival', 'show', 'performance', 'theater',
      'exhibition', 'gallery', 'museum', 'comedy', 'standup', 'movie',
      'film', 'screening', 'sports', 'game', 'match', 'tournament',
      'workshop', 'class', 'seminar', 'lecture', 'tour', 'tasting'
    ];

    for (const type of eventTypes) {
      if (content.toLowerCase().includes(type)) {
        keywords.push(type);
      }
    }

    return keywords;
  }
}
