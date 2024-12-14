export interface GenAIRequest {
  prompt: string;
}

export interface StreamMetrics {
  firstChunkLatency: number;
  totalDuration: number;
  chunkCount: number;
  avgChunkLatency: number;
  totalTokens: number;
}

export type StreamCallback = (text: string, metrics?: StreamMetrics) => void;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = (source?: string) => void;

export interface StreamCallbacks {
  onChunk?: StreamCallback;
  onError?: ErrorCallback;
  onComplete?: CompleteCallback;
}

export interface APIResponse {
  source: 'WebSocket' | 'SSE' | 'rest';
  text: string;
  metrics: StreamMetrics;
}

export interface APIEndpoints {
  websocket: string;
  sse: string;
  rest: string;
  cloudfront: string;
} 
