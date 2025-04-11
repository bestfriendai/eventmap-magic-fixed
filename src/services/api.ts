import { supabase } from '@/integrations/supabase/client';
import { Event } from '../types';

export const setSecrets = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('set-secrets');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting secrets:', error);
    throw error;
  }
};

export const fetchEvents = async (location?: { latitude: number; longitude: number }): Promise<Event[]> => {
  try {
    // Use provided location or default to Washington DC
    const coordinates = location || {
      latitude: 38.8689,
      longitude: -77.0129
    };

    const { data, error } = await supabase.functions.invoke('fetch-events', {
      body: coordinates
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    if (!data?.events) {
      console.warn('No events data in response');
      return [];
    }

    return data.events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const sendAIMessage = async (message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message }
    });

    if (error) {
      console.error('AI chat error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No response data received');
    }

    return data;
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
};