import { SSEEvent, SSEResult, SSERequest, formatSSEMessage } from '../types';
import { getGenAIService } from '../../../shared/genai/service';
import { GenAIError } from '../../../shared/genai/types';

// Initialize GenAI service
const genAIService = getGenAIService(process.env.OPENAI_API_KEY || '');

// CORS headers for SSE
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event: SSEEvent): Promise<SSEResult> => {
  // Handle OPTIONS request for CORS
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Parse request body
    const request: SSERequest = event.body ? JSON.parse(event.body) : {};

    if (!request.prompt) {
      throw new Error('Prompt is required');
    }

    // Generate response
    const response = await genAIService.generateResponse(request);

    // Format as SSE message
    const message = formatSSEMessage({
      id: event.requestContext.requestId,
      event: 'message',
      data: JSON.stringify(response),
    });

    // If streaming is requested, simulate chunks
    if (request.stream) {
      const words = response.text.split(' ');
      let streamResponse = '';

      // Simulate streaming by sending words in chunks
      for (let i = 0; i < words.length; i++) {
        const chunk = formatSSEMessage({
          id: `${event.requestContext.requestId}-${i}`,
          event: 'chunk',
          data: JSON.stringify({ text: words[i] + ' ' }),
        });
        streamResponse += chunk;
      }

      // Send completion message
      streamResponse += formatSSEMessage({
        id: `${event.requestContext.requestId}-complete`,
        event: 'complete',
        data: JSON.stringify({ usage: response.usage }),
      });

      return {
        statusCode: 200,
        headers,
        body: streamResponse,
      };
    }

    // Non-streaming response
    return {
      statusCode: 200,
      headers,
      body: message,
    };
  } catch (error) {
    console.error('Error:', error);

    const errorMessage = formatSSEMessage({
      id: event.requestContext.requestId,
      event: 'error',
      data: JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      }),
    });

    return {
      statusCode: 200, // Keep 200 for SSE even on error
      headers,
      body: errorMessage,
    };
  }
};
