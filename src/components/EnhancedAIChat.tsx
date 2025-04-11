import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Loader2,
  Send,
  Calendar,
  MapPin,
  Clock,
  Menu,
  Bookmark,
  BookmarkCheck,
  X,
  Sparkles,
  Lightbulb,
  Mic,
  Image,
  Paperclip,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Trash,
  Copy,
  Share,
  RefreshCw
} from 'lucide-react';
import { EnhancedButton } from './ui/enhanced-button';
import { EnhancedInput } from './ui/enhanced-input';
import { EnhancedBadge } from './ui/enhanced-badge';
import { Card, CardContent } from './ui/enhanced-card';
import { cn } from '@/lib/utils';
import { Message } from '../types/chat';
import { Event } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AIManager } from '../services/ai-manager';
import { toast } from 'sonner';
// Simple markdown-like rendering function
const renderMarkdown = (text: string) => {
  return text
    .split('\n')
    .map((line, i) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-bold my-2">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-bold my-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-md font-bold my-2">{line.substring(4)}</h3>;
      }

      // Lists
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.substring(2)}</li>;
      }
      if (line.startsWith('* ')) {
        return <li key={i} className="ml-4">{line.substring(2)}</li>;
      }

      // Bold
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="my-1">
            {parts.map((part, j) => j % 2 === 0 ? part : <strong key={j}>{part}</strong>)}
          </p>
        );
      }

      // Italic
      if (line.includes('*')) {
        const parts = line.split('*');
        return (
          <p key={i} className="my-1">
            {parts.map((part, j) => j % 2 === 0 ? part : <em key={j}>{part}</em>)}
          </p>
        );
      }

      // Links
      if (line.includes('[') && line.includes('](')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        const parts = [];
        let match;
        let partIndex = 0;

        while ((match = linkRegex.exec(line)) !== null) {
          // Add text before the link
          if (match.index > lastIndex) {
            parts.push(<span key={`text-${partIndex++}`}>{line.substring(lastIndex, match.index)}</span>);
          }

          // Add the link
          parts.push(
            <a
              key={`link-${partIndex++}`}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {match[1]}
            </a>
          );

          lastIndex = match.index + match[0].length;
        }

        // Add any remaining text
        if (lastIndex < line.length) {
          parts.push(<span key={`text-${partIndex++}`}>{line.substring(lastIndex)}</span>);
        }

        return <p key={i} className="my-1">{parts}</p>;
      }

      // Regular paragraph
      return line.trim() ? <p key={i} className="my-1">{line}</p> : <br key={i} />;
    });
};

interface EnhancedAIChatProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  events: Event[];
  onEventSelect: (event: Event) => void;
  onClearChat: () => void;
  onSaveChat?: () => void;
  isSaved?: boolean;
  className?: string;
}

const TYPING_INDICATORS = [
  "Searching for the perfect recommendations...",
  "Analyzing local events and venues...",
  "Crafting personalized suggestions...",
  "Finding the best options for you..."
];

const EXAMPLE_PROMPTS = [
  "Find romantic restaurants in downtown",
  "What's happening this weekend?",
  "Plan a fun first date",
  "Suggest outdoor activities for two",
  "Find live music events near me",
  "What are some good date ideas on a budget?",
  "Where can I find good cocktail bars?",
  "Recommend a day trip itinerary"
];

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  events,
  onEventSelect,
  onClearChat,
  onSaveChat,
  isSaved = false,
  className
}) => {
  const [input, setInput] = useState('');
  const [typingIndicator, setTypingIndicator] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  // Rotate through typing indicators
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      const interval = setInterval(() => {
        setTypingIndicator(TYPING_INDICATORS[index]);
        index = (index + 1) % TYPING_INDICATORS.length;
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setShowExamples(false);

    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    setShowExamples(false);
    inputRef.current?.focus();
  };

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
    <Card
      key={event.id}
      variant="glass"
      hover="lift"
      className="cursor-pointer overflow-hidden mb-2"
      onClick={() => onEventSelect(event)}
    >
      <div className="flex">
        {/* Event image or icon */}
        <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-2xl">
          {event.categories && event.categories[0] ? (
            getCategoryIcon(event.categories[0])
          ) : (
            '📅'
          )}
        </div>

        {/* Event details */}
        <div className="flex-1 p-2">
          <h3 className="font-semibold text-sm">{event.title}</h3>

          <div className="mt-1 space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
              <span className="mx-1">•</span>
              <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>{formatTime(event.time)}</span>
            </div>

            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const getCategoryIcon = (category: string): string => {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('music')) return '🎵';
    if (lowerCategory.includes('comedy')) return '😄';
    if (lowerCategory.includes('sport')) return '⚽';
    if (lowerCategory.includes('art')) return '🎨';
    if (lowerCategory.includes('theatre') || lowerCategory.includes('theater')) return '🎭';
    if (lowerCategory.includes('food') || lowerCategory.includes('drink')) return '🍽️';
    if (lowerCategory.includes('cultural')) return '🏛️';
    if (lowerCategory.includes('social') || lowerCategory.includes('community')) return '👥';
    if (lowerCategory.includes('education')) return '📚';
    if (lowerCategory.includes('outdoor')) return '🌲';
    if (lowerCategory.includes('festival')) return '🎪';
    if (lowerCategory.includes('film') || lowerCategory.includes('movie')) return '🎬';

    return '✨'; // Default icon
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex w-full mb-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div className={cn(
          "flex max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "ml-2 bg-primary text-primary-foreground" : "mr-2 bg-muted text-muted-foreground"
          )}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>

          {/* Message Content */}
          <div className={cn(
            "rounded-lg p-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border"
          )}>
            {/* Render markdown for assistant messages */}
            {!isUser ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderMarkdown(message.content)}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Render events if available */}
            {message.events && message.events.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Suggested Events:</h4>
                <div className="space-y-2">
                  {message.events.map(event => renderEventCard(event))}
                </div>
              </div>
            )}

            {/* Message actions */}
            {!isUser && (
              <div className="mt-2 pt-2 border-t border-border flex justify-end gap-1">
                <EnhancedButton
                  size="icon-sm"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Copy to clipboard"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    toast.success('Copied to clipboard');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </EnhancedButton>

                {isLastMessage && (
                  <EnhancedButton
                    size="icon-sm"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Regenerate response"
                    onClick={() => {
                      // Find the last user message
                      const lastUserMessage = [...messages]
                        .reverse()
                        .find(m => m.role === 'user');

                      if (lastUserMessage) {
                        onSendMessage(lastUserMessage.content);
                      }
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </EnhancedButton>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AI Date Planner</h2>
            <p className="text-xs text-muted-foreground">Powered by Claude 3.7</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSaveChat && (
            <EnhancedButton
              size="sm"
              variant="ghost"
              onClick={onSaveChat}
              leftIcon={isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            >
              {isSaved ? 'Saved' : 'Save'}
            </EnhancedButton>
          )}

          <EnhancedButton
            size="sm"
            variant="ghost"
            onClick={onClearChat}
            leftIcon={<Trash className="h-4 w-4" />}
          >
            Clear
          </EnhancedButton>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => renderMessage(message, index))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex w-full mb-4">
            <div className="flex max-w-[80%]">
              <div className="mr-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="rounded-lg p-3 bg-card border border-border">
                <div className="flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{typingIndicator}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="relative">
          <EnhancedInput
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="pr-24"
            icon={<User className="h-4 w-4" />}
            onFocus={() => !messages.length && setShowExamples(true)}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <EnhancedButton
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setShowExamples(!showExamples)}
              title={showExamples ? "Hide examples" : "Show examples"}
            >
              <Lightbulb className="h-4 w-4" />
            </EnhancedButton>

            <EnhancedButton
              type="submit"
              size="icon-sm"
              variant="primary"
              disabled={!input.trim() || isLoading}
              className="text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </EnhancedButton>
          </div>
        </form>

        {/* Example prompts */}
        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <div className="p-2 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium">Example prompts</h3>
                  <button
                    onClick={() => setShowExamples(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <EnhancedBadge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleExampleClick(prompt)}
                    >
                      {prompt}
                    </EnhancedBadge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
