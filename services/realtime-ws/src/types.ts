import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GenAIRequest } from '../../shared/genai/types';

export type WebSocketEvent = APIGatewayProxyWebsocketEventV2;
export type WebSocketResult = APIGatewayProxyResultV2;

export interface WebSocketMessage {
  action: 'generate';
  payload: GenAIRequest;
}

export interface WebSocketResponse {
  type: 'success' | 'error' | 'chunk';
  payload: any;
}
