import { Message } from '../types/chat';
import { getChatCompletion } from './openrouter';

export class AIManager {
  private retryLimit = 2;
  private failureCount = 0;

  async getCompletion(messages: Message[]) {
    // Add system message if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        id: 'system',
        role: 'system',
        content: `You are an AI assistant helping users plan dates and find events. 
        When suggesting events or places, always include specific details like:
        - Full address
        - Date and time
        - Price range
        - Category (e.g., restaurant, entertainment, activity)
        - Brief description
        Format event details consistently for easy parsing.`
      });
    }

    try {
      const response = await getChatCompletion(messages);
      // Reset failure count on success
      this.failureCount = 0;
      return response;
    } catch (error) {
      console.error(`OpenRouter Claude API Error:`, error);
      this.failureCount++;

      if (this.failureCount >= this.retryLimit) {
        throw new Error('AI service failed after multiple attempts. Please try again later.');
      }

      // Retry once more
      try {
        console.log('Retrying OpenRouter Claude API request...');
        return await getChatCompletion(messages);
      } catch (retryError) {
        console.error(`OpenRouter Claude API Retry Error:`, retryError);
        throw new Error('AI service failed. Please try again later.');
      }
    }
  }
}