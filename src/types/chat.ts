import type { Event } from './index';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  events?: Event[];
}

export type AIService = 'claude';
