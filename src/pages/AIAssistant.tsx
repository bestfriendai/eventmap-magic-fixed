import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

const MemoizedMap = memo(Map);

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi! I'm your AI date planner. I can help you find events, restaurants, and activities for the perfect date.\n\nSome things I can help with:\n- Find events and activities nearby\n- Suggest restaurants based on cuisine and atmosphere\n- Create custom date itineraries\n- Provide recommendations based on your preferences\n\nFor example, you can ask:\n\"Find romantic restaurants in downtown\"\n\"What's happening this weekend?\"\n\"Plan a fun first date\"\n\"Suggest outdoor activities for two\"\n\nWhat kind of experience are you looking for?",
      role: "assistant"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const handleEventSelect = useCallback((event: Event | null) => {
    setSelectedEvent(event);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user"
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create a simple serializable object for the request
      const requestBody = {
        messageText: input.trim()
      };

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: JSON.stringify(requestBody)
      });

      if (error) throw error;
      if (!data) throw new Error('No response data received');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I could not process your request.',
        role: "assistant"
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.events && Array.isArray(data.events)) {
        const serializedEvents = data.events.map((event: Partial<Event>) => ({
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: event.title || "Untitled Event",
          date: event.date || new Date().toISOString().split('T')[0],
          time: event.time || "19:00",
          venue: event.venue || "TBA",
          latitude: Number(event.latitude) || 0,
          longitude: Number(event.longitude) || 0,
          image: event.image || "https://placehold.co/600x400?text=AI+Suggested+Event",
          categories: Array.isArray(event.categories) ? event.categories : ["Other"],
          source: "ai-suggested",
          price: null,
          url: ""
        }));
        
        setEvents(serializedEvents);
        if (serializedEvents.length > 0) {
          toast({
            title: "Events Found",
            description: `Found ${serializedEvents.length} suggested locations for your date!`,
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex h-screen pt-16">
        <div className="w-[450px] border-r border-white/10 p-4 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow ${
                      message.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl p-4 shadow bg-secondary text-secondary-foreground animate-pulse">
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex gap-2 pt-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about date ideas..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="flex-1 p-4">
          <MemoizedMap 
            events={events} 
            selectedEvent={selectedEvent} 
            onEventSelect={handleEventSelect} 
          />
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
