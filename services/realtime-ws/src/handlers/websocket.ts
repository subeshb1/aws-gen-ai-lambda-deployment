import {
  WebSocketEvent,
  WebSocketResult,
  WebSocketMessage,
  WebSocketResponse,
} from '../types';
import { getGenAIService } from '../../../shared/genai/service';
import { GenAIError } from '../../../shared/genai/types';

// Initialize GenAI service
const genAIService = getGenAIService(process.env.OPENAI_API_KEY || '');

// Helper function to send response back to the client
const sendResponse = async (
  domainName: string,
  stage: string,
  connectionId: string,
  response: WebSocketResponse
): Promise<void> => {
  const endpoint = `https://${domainName}/${stage}/@connections/${connectionId}`;

  // TODO: Implement actual posting to the WebSocket connection
  console.log('Would send to endpoint:', endpoint);
  console.log('Response:', JSON.stringify(response));
};

export const handleConnect = async (
  event: WebSocketEvent
): Promise<WebSocketResult> => {
  console.log('Client connected:', event.requestContext.connectionId);

  return {
    statusCode: 200,
    body: 'Connected',
  };
};

export const handleDisconnect = async (
  event: WebSocketEvent
): Promise<WebSocketResult> => {
  console.log('Client disconnected:', event.requestContext.connectionId);

  return {
    statusCode: 200,
    body: 'Disconnected',
  };
};

export const handleDefault = async (
  event: WebSocketEvent
): Promise<WebSocketResult> => {
  const connectionId = event.requestContext.connectionId;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  try {
    // Parse the message
    const message: WebSocketMessage = JSON.parse(event.body || '{}');

    if (message.action !== 'generate') {
      throw new Error('Invalid action');
    }

    // Generate AI response
    const aiResponse = await genAIService.generateResponse(message.payload);

    // Send response back to the client
    await sendResponse(domainName, stage, connectionId, {
      type: 'success',
      payload: aiResponse,
    });

    return {
      statusCode: 200,
      body: 'Message processed',
    };
  } catch (error) {
    const errorResponse: WebSocketResponse = {
      type: 'error',
      payload: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };

    await sendResponse(domainName, stage, connectionId, errorResponse);

    return {
      statusCode: 500,
      body: 'Error processing message',
    };
  }
};
