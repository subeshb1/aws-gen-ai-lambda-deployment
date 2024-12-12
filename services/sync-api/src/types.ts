import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GenAIRequest } from '../../shared/genai/types';

export type APIEvent = APIGatewayProxyEvent;
export type APIResult = APIGatewayProxyResult;

export interface APIRequest extends GenAIRequest {
  model?: string;
}

export interface APIErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export interface APISuccessResponse {
  data: any;
  meta?: {
    model?: string;
    latency?: number;
  };
}
