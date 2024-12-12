import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GenAIRequest } from '../../shared/genai/types';

export type SSEEvent = APIGatewayProxyEventV2;
export type SSEResult = APIGatewayProxyStructuredResultV2;

export interface SSERequest extends GenAIRequest {
  stream?: boolean;
}

export interface SSEMessage {
  id: string;
  event?: string;
  data: string;
  retry?: number;
}

export const formatSSEMessage = (message: SSEMessage): string => {
  let formatted = '';
  if (message.id) formatted += `id: ${message.id}\n`;
  if (message.event) formatted += `event: ${message.event}\n`;
  formatted += `data: ${message.data}\n\n`;
  if (message.retry) formatted += `retry: ${message.retry}\n`;
  return formatted;
};
