import { WebSocketClient } from './websocket';
import { SSEClient } from './sse';
import { RestClient } from './rest';
import {
  GenAIRequest,
  StreamCallbacks,
  APIResponse,
  APIEndpoints,
} from '../types/api';

export class GenAIClient {
  private wsClient: WebSocketClient;
  private sseClient: SSEClient;
  private restClient: RestClient;
  private readonly cloudfrontDomain: string;

  constructor(endpoints: APIEndpoints) {
    this.cloudfrontDomain = endpoints.cloudfront;

    // Initialize clients with CloudFront paths
    this.wsClient = new WebSocketClient(`${this.cloudfrontDomain}/ws`);
    this.sseClient = new SSEClient(`${this.cloudfrontDomain}/sse`);
    this.restClient = new RestClient(`${this.cloudfrontDomain}/api`);
  }

  // Get WebSocket client for early connection
  getWebSocketClient(): WebSocketClient {
    return this.wsClient;
  }

  async generateAll(
    request: GenAIRequest,
    callbacks?: StreamCallbacks
  ): Promise<APIResponse[]> {
    const results = await Promise.allSettled([
      this.wsClient.generate(request, {
        onChunk: (text, metrics) =>
          callbacks?.onChunk?.(`[WebSocket] ${text}`, metrics),
        onError: callbacks?.onError,
        onComplete: () => callbacks?.onComplete?.('WebSocket'),
      }),
      this.sseClient.generate(request, {
        onChunk: (text, metrics) =>
          callbacks?.onChunk?.(`[SSE] ${text}`, metrics),
        onError: callbacks?.onError,
        onComplete: () => callbacks?.onComplete?.('SSE'),
      }),
      this.restClient.generate(request, {
        onChunk: (text, metrics) =>
          callbacks?.onChunk?.(`[REST] ${text}`, metrics),
        onError: callbacks?.onError,
        onComplete: () => callbacks?.onComplete?.('REST'),
      }),
    ]);

    return results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`API ${index} failed:`, result.reason);
          return null;
        }
      })
      .filter((result): result is APIResponse => result !== null);
  }

  disconnect() {
    this.wsClient.disconnect();
    this.sseClient.disconnect();
  }
}

// Get endpoints from environment variables
export function getEndpoints(): APIEndpoints {
  const cloudfront = import.meta.env.VITE_CLOUDFRONT_DOMAIN;
  if (!cloudfront) {
    throw new Error('CloudFront domain is not configured');
  }

  return {
    websocket: `${cloudfront}/ws`,
    sse: `${cloudfront}/sse`,
    rest: `${cloudfront}/api`,
    cloudfront,
  };
}
