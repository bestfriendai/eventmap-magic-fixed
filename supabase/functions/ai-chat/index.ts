import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENROUTER_API_KEY = Deno.env.get('API_KEY_OPENROUTER') || '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';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    let messageText: string;

    try {
      // Try to parse the request body if it's a string
      const parsedBody = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
      messageText = parsedBody.messageText;
    } catch {
      // If parsing fails, try to use the request data directly
      messageText = requestData.messageText;
    }
    
    if (!messageText || typeof messageText !== 'string') {
      throw new Error('Invalid or missing message in request body');
    }

    console.log('Processing AI chat request:', { messageText });

    const systemPrompt = `You are an AI date planner assistant. Your goal is to help users plan perfect dates by suggesting activities and places.
When suggesting specific places or events, ALWAYS include them in a structured format at the end of your response like this:

EVENT_START
Title: [Event Title]
Date: [Event Date in MM/DD/YYYY format]
Time: [Event Time in HH:MM AM/PM format]
Location: [Full address including venue name, street, city, state]
Category: [One of: live-music, comedy, sports-games, performing-arts, food-drink, cultural, social, educational, outdoor, special]
Price: [Price or price range if available]
Description: [Brief description]
EVENT_END`;

    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP_REFERER': 'https://dateapril.netlify.app/',
        'X-Title': 'EventMap Magic'
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-sonnet-20240229",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`OpenRouter API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const events: any[] = [];
    const eventRegex = /EVENT_START\n([\s\S]*?)EVENT_END/g;
    const matches = content.matchAll(eventRegex);
    
    for (const match of matches) {
      try {
        const eventText = match[1];
        const event = {
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: "",
          date: "",
          time: "",
          venue: "",
          categories: ["special"],
          source: "ai-suggested"
        };
        
        // Extract fields
        const titleMatch = eventText.match(/Title:\s*(.+)(?:\n|$)/i);
        if (titleMatch?.[1]) event.title = titleMatch[1].trim();
        
        const dateMatch = eventText.match(/Date:\s*(.+)(?:\n|$)/i);
        if (dateMatch?.[1]) event.date = dateMatch[1].trim();
        
        const timeMatch = eventText.match(/Time:\s*(.+)(?:\n|$)/i);
        if (timeMatch?.[1]) event.time = timeMatch[1].trim();
        
        const locationMatch = eventText.match(/Location:\s*(.+)(?:\n|$)/i);
        if (locationMatch?.[1]) {
          const location = locationMatch[1].trim();
          event.venue = location.split(',')[0].trim();
        }
        
        const categoryMatch = eventText.match(/Category:\s*(.+)(?:\n|$)/i);
        if (categoryMatch?.[1]) {
          const category = categoryMatch[1].trim().toLowerCase();
          if (["live-music", "comedy", "sports-games", "performing-arts", "food-drink",
               "cultural", "social", "educational", "outdoor", "special"].includes(category)) {
            event.categories = [category];
          }
        }
        
        // Only add events with at least a title
        if (event.title) {
          events.push(event);
        }
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    }

    const cleanResponse = content.replace(/EVENT_START\n[\s\S]*?EVENT_END/g, '').trim();

    const responseBody = {
      response: cleanResponse,
      events: events
    };

    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
      }
    );
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
      }
    );
  }
});