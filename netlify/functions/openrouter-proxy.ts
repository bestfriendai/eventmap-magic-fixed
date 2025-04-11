import { Handler } from '@netlify/functions';

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY || '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';
const API_TIMEOUT = 60000; // 60 seconds timeout for Claude 3.7 which can be slower

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!OPENROUTER_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'OpenRouter API key is not configured'
      })
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    // Parse the request body to modify it for OpenRouter
    const requestBody = JSON.parse(event.body || '{}');
    
    // Ensure the model is set to Claude 3.7 Sonnet
    requestBody.model = 'anthropic/claude-3-sonnet-20240229';
    
    // Add HTTP_REFERER and HTTP_USER_AGENT headers required by OpenRouter
    const openRouterHeaders = {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP_REFERER': 'https://dateapril.netlify.app/',
      'X-Title': 'EventMap Magic'
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: openRouterHeaders,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'OpenRouter API error',
          message: errorText
        })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('OpenRouter Proxy Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({
          error: 'Gateway timeout',
          message: 'Request took too long to complete'
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};