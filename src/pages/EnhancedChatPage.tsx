import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import EnhancedAIChat from '../components/EnhancedAIChat';
import { Event } from '../types';
import { Message } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocation } from '../hooks/useLocation';
import { AIStreamingService } from '../services/ai-streaming';
import { toast } from 'sonner';

import { Card } from '@/components/ui/enhanced-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Bookmark, Clock, Plus, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

// Generate a unique ID
const generateId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const INITIAL_MESSAGE = {
  id: '1',
  role: 'assistant',
  content: `Hi! I'm your AI date planner. I can help you find events, restaurants, and activities for the perfect date.

Some things I can help with:
- Find events and activities nearby
- Suggest restaurants based on cuisine and atmosphere
- Create custom date itineraries
- Provide recommendations based on your preferences

For example, you can ask:
"Find romantic restaurants in downtown"
"What's happening this weekend?"
"Plan a fun first date"
"Suggest outdoor activities for two"

What kind of experience are you looking for?`
};

interface SavedChat {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  messages: Message[];
}

export default function EnhancedChatPage() {
  const { currentUser } = useAuth();
  const { location: userLocation } = useLocation();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [showSavedChats, setShowSavedChats] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const aiService = new AIStreamingService();

  // Load saved chats when user logs in
  useEffect(() => {
    if (currentUser) {
      loadSavedChats();
    }
  }, [currentUser]);

  // Check if current chat is saved
  useEffect(() => {
    if (currentChatId) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [currentChatId]);

  const loadSavedChats = async () => {
    if (!currentUser) return;

    try {
      const chatsRef = collection(db, 'users', currentUser.uid, 'chats');
      const q = query(chatsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const chats: SavedChat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SavedChat;
        chats.push({
          ...data,
          id: doc.id
        });
      });

      setSavedChats(chats);
    } catch (error) {
      console.error('Error loading saved chats:', error);
      toast.error('Failed to load saved chats');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create a function to update the assistant message as chunks arrive
      let assistantMessageId = generateId();
      let assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      };

      // Add an empty assistant message that will be updated
      setMessages(prev => [...prev, assistantMessage]);

      // Send the message to the AI service with streaming
      const response = await aiService.sendMessage(
        [...messages, userMessage],
        userLocation,
        {
          onChunk: (chunk) => {
            // Update the assistant message with the new chunk
            setMessages(prev => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;

              if (updated[lastIndex].id === assistantMessageId) {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: updated[lastIndex].content + chunk
                };
              }

              return updated;
            });
          },
          onEvents: (newEvents) => {
            if (newEvents.length > 0) {
              // Update the assistant message with the events
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (updated[lastIndex].id === assistantMessageId) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    events: newEvents
                  };
                }

                return updated;
              });

              // Update the events state
              setEvents(prev => [...prev, ...newEvents]);
            }
          },
          onError: (error) => {
            console.error('Error in AI response:', error);
            toast.error('Failed to get a response. Please try again.');
          }
        }
      );

      // The final message is already updated through streaming
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');

      // Remove the last assistant message if there was an error
      setMessages(prev => {
        if (prev[prev.length - 1].role === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setIsSaved(false);
      setCurrentChatId(null);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setEvents([]);
    setIsSaved(false);
    setCurrentChatId(null);
  };

  const handleSaveChat = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to save chats');
      return;
    }

    if (messages.length <= 1) {
      toast.error('Nothing to save yet');
      return;
    }

    try {
      // Generate a title from the first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : 'Saved Chat';

      // Generate a preview from the last assistant message
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      const preview = lastAssistantMessage
        ? lastAssistantMessage.content.substring(0, 100) + (lastAssistantMessage.content.length > 100 ? '...' : '')
        : '';

      const chatId = currentChatId || generateId();
      const chatRef = doc(db, 'users', currentUser.uid, 'chats', chatId);

      await setDoc(chatRef, {
        title,
        preview,
        timestamp: Date.now(),
        messages
      });

      setIsSaved(true);
      setCurrentChatId(chatId);
      toast.success('Chat saved successfully');

      // Refresh saved chats
      loadSavedChats();
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.error('Failed to save chat');
    }
  };

  const handleDeleteSavedChat = async (chatId: string) => {
    if (!currentUser) return;

    try {
      const chatRef = doc(db, 'users', currentUser.uid, 'chats', chatId);
      await deleteDoc(chatRef);

      // Update the saved chats list
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));

      // If the deleted chat is the current chat, clear it
      if (currentChatId === chatId) {
        handleClearChat();
      }

      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleLoadSavedChat = async (chatId: string) => {
    if (!currentUser) return;

    try {
      const chatRef = doc(db, 'users', currentUser.uid, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data() as SavedChat;
        setMessages(chatData.messages);

        // Extract events from messages
        const allEvents: Event[] = [];
        chatData.messages.forEach(message => {
          if (message.events) {
            allEvents.push(...message.events);
          }
        });

        setEvents(allEvents);
        setCurrentChatId(chatId);
        setIsSaved(true);
        setShowSavedChats(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Saved Chats Sidebar */}
        <AnimatePresence>
          {showSavedChats && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full border-r border-border overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Saved Conversations</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {savedChats.length > 0 ? (
                    <div className="space-y-2">
                      {savedChats.map(chat => (
                        <Card
                          key={chat.id}
                          hover="lift"
                          className={cn(
                            "p-3 cursor-pointer",
                            currentChatId === chat.id && "border-primary"
                          )}
                          onClick={() => handleLoadSavedChat(chat.id)}
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm line-clamp-1">{chat.title}</h3>
                            <EnhancedButton
                              size="icon-sm"
                              variant="ghost"
                              className="h-6 w-6 -mr-1 -mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSavedChat(chat.id);
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </EnhancedButton>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {chat.preview}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(chat.timestamp)}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Bookmark className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">No saved conversations</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your saved conversations will appear here
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-border">
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => {
                      handleClearChat();
                      setShowSavedChats(false);
                    }}
                  >
                    New Conversation
                  </EnhancedButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative">
          {/* Toggle Saved Chats Button */}
          <EnhancedButton
            size="icon-sm"
            variant="glass"
            className="absolute top-4 left-4 z-10"
            onClick={() => setShowSavedChats(!showSavedChats)}
          >
            <Bookmark className="h-4 w-4" />
          </EnhancedButton>

          <EnhancedAIChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            events={events}
            onEventSelect={setSelectedEvent}
            onClearChat={handleClearChat}
            onSaveChat={handleSaveChat}
            isSaved={isSaved}
          />
        </div>
      </div>
    </div>
  );
}
