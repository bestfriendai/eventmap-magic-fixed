import { getChatCompletion } from './openrouter';
import { getClaudeCompletion } from './claude';

export type RecommendationType = 'restaurants' | 'attractions' | 'activities' | 'nightlife' | 'cultural';

interface RecommendationParams {
  latitude: number;
  longitude: number;
  type: RecommendationType;
  radius?: number;
  preferences?: string[];
}

export async function getAIRecommendations(params: RecommendationParams) {
  const prompt = `Find ${params.type} recommendations within ${params.radius || 5} miles of coordinates (${params.latitude}, ${params.longitude})${
    params.preferences ? ` that match these preferences: ${params.preferences.join(', ')}` : ''
  }. Format each recommendation as an event.`;

  try {
    // Try OpenRouter with Claude 3.7 first
    const openRouterResponse = await getChatCompletion([{
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    }]);

    return openRouterResponse;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    
    // Fall back to Claude
    try {
      const claudeResponse = await getClaudeCompletion([{
        id: Date.now().toString(),
        role: 'user',
        content: prompt
      }]);

      return claudeResponse;
    } catch (claudeError) {
      console.error('Claude API Error:', claudeError);
      throw new Error('Failed to get recommendations from both AI services');
    }
  }
}