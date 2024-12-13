import {
  WebSocketEvent,
  WebSocketResult,
  WebSocketMessage,
  WebSocketResponse,
} from '../types';
import { getGenAIService } from '../../../shared/genai/service';
import { GenAIError } from '../../../shared/genai/types';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

// Initialize GenAI service
const genAIService = getGenAIService(process.env.OPENAI_API_KEY || '');

// Helper function to send response back to the client
const sendResponse = async (
  domainName: string,
  stage: string,
  connectionId: string,
  response: WebSocketResponse
): Promise<void> => {
  const endpoint = `https://${domainName}/${stage}`;
  const client = new ApiGatewayManagementApiClient({
    endpoint,
    region: process.env.AWS_REGION || 'ap-southeast-2',
  });

  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(response)),
    });

    await client.send(command);
  } catch (error) {
    console.error('Error sending message to WebSocket client:', error);
    if ((error as any).statusCode === 410) {
      console.log('Connection stale, client disconnected');
    }
    throw error;
  }
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

    // Start streaming response
    const generator = genAIService.streamResponse(message.payload);
    let fullText = '';

    // Stream each chunk to the client
    for await (const chunk of generator) {
      fullText += chunk;
      await sendResponse(domainName, stage, connectionId, {
        type: 'chunk',
        payload: { text: chunk },
      });
    }

    // Send final response
    await sendResponse(domainName, stage, connectionId, {
      type: 'success',
      payload: {
        text: fullText.trim(),
        usage: {
          promptTokens: message.payload.prompt.length,
          completionTokens: fullText.length,
          totalTokens: message.payload.prompt.length + fullText.length,
        },
      },
    });

    return {
      statusCode: 200,
      body: 'Message processed',
    };
  } catch (error) {
    console.error('Error processing message:', error);
    const errorResponse: WebSocketResponse = {
      type: 'error',
      payload: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };

    try {
      await sendResponse(domainName, stage, connectionId, errorResponse);
    } catch (sendError) {
      console.error('Error sending error response:', sendError);
    }

    return {
      statusCode: 500,
      body: 'Error processing message',
    };
  }
};
