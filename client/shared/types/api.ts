export interface GenAIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenAIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface APIEndpoints {
  websocket: string;
  sse: string;
  rest: string;
  cloudfront: string;
}

export type StreamCallback = (text: string) => void;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = () => void;

export interface StreamCallbacks {
  onChunk?: StreamCallback;
  onError?: ErrorCallback;
  onComplete?: CompleteCallback;
}

export interface APIResponse {
  source: 'websocket' | 'sse' | 'rest';
  text: string;
  latency: number;
} 
