import {
  APIEvent,
  APIResult,
  APIRequest,
  APIErrorResponse,
  APISuccessResponse,
} from '../types';
import { getGenAIService } from '../../../shared/genai/service';
import { GenAIError } from '../../../shared/genai/types';

// Initialize GenAI service
const genAIService = getGenAIService(process.env.OPENAI_API_KEY || '');

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const handler = async (event: APIEvent): Promise<APIResult> => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    const errorResponse: APIErrorResponse = {
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        statusCode: 405,
      },
    };

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }

  try {
    const startTime = Date.now();

    // Parse request body
    const request: APIRequest = event.body ? JSON.parse(event.body) : {};

    if (!request.prompt) {
      throw new Error('Prompt is required');
    }

    // Generate response
    const response = await genAIService.generateResponse(request);

    // Format success response
    const successResponse: APISuccessResponse = {
      data: response,
      meta: {
        model: request.model || 'default',
        latency: Date.now() - startTime,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(successResponse),
    };
  } catch (error) {
    console.error('Error:', error);

    const errorResponse: APIErrorResponse = {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };

    return {
      statusCode: errorResponse.error.statusCode,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};
