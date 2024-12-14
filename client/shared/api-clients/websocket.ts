import {
  GenAIRequest,
  StreamCallbacks,
  APIResponse,
  StreamMetrics,
} from '../types/api';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: StreamCallbacks = {};
  private accumulatedText = '';
  private metrics: {
    startTime?: number;
    firstChunkTime?: number;
    chunkTimes: number[];
  } = {
    chunkTimes: [],
  };
  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;

  constructor(private readonly endpoint: string) {}

  private resetState() {
    this.accumulatedText = '';
    this.metrics = {
      startTime: Date.now(),
      chunkTimes: [],
    };
  }

  private async ensureConnection(): Promise<void> {
    // If already connected, return immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // If connection is in progress, wait for it
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start new connection
    this.isConnecting = true;
    this.connectionPromise = this.connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://${this.endpoint}/`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.callbacks.onError?.(new Error('WebSocket connection error'));
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const now = Date.now();

          switch (response.type) {
            case 'chunk':
              // Handle streaming chunk
              const chunkText = response.payload.text;
              if (!this.metrics.firstChunkTime) {
                this.metrics.firstChunkTime = now;
              }
              this.metrics.chunkTimes.push(now);
              this.accumulatedText += chunkText;
              // Calculate and emit current metrics with each chunk
              const currentMetrics = this.calculateMetrics();
              this.callbacks.onChunk?.('WebSocket', chunkText, currentMetrics);
              break;

            case 'success':
              // Handle completion with final response
              this.callbacks.onComplete?.('WebSocket');
              break;

            case 'error':
              // Handle error response
              this.callbacks.onError?.(new Error(response.payload.message));
              break;

            default:
              console.warn('Unknown message type:', response.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.callbacks.onError?.(
            new Error('Failed to parse WebSocket message')
          );
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        // Clear connection state
        this.isConnecting = false;
        this.connectionPromise = null;
      };
    });
  }

  async generate(
    request: GenAIRequest,
    callbacks: StreamCallbacks
  ): Promise<APIResponse> {
    this.callbacks = callbacks;
    this.resetState();

    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      try {
        // Send the generation request
        this.ws?.send(
          JSON.stringify({
            action: 'generate',
            payload: request,
          })
        );

        // Set up message handler for this request
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'success') {
              // Resolve with final response
              const response: APIResponse = {
                source: 'WebSocket',
                text: this.accumulatedText.trim(),
                metrics: this.calculateMetrics(),
              };
              resolve(response);
              this.ws?.removeEventListener('message', messageHandler);
            } else if (data.type === 'error') {
              // Handle error
              reject(new Error(data.payload.message));
              this.ws?.removeEventListener('message', messageHandler);
            }
          } catch (error) {
            reject(error);
            this.ws?.removeEventListener('message', messageHandler);
          }
        };

        this.ws?.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.accumulatedText = '';
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private calculateMetrics(): StreamMetrics {
    const now = Date.now();
    const totalDuration = now - (this.metrics.startTime || now);
    const chunkCount = this.metrics.chunkTimes.length;

    // Calculate average chunk latency (time between chunks)
    let avgChunkLatency = 0;
    if (chunkCount > 1) {
      const latencies = this.metrics.chunkTimes
        .slice(1)
        .map((time, i) => time - this.metrics.chunkTimes[i]);
      avgChunkLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }

    // Estimate tokens (can be replaced with actual token count from the API if available)
    const totalTokens = Math.round(
      this.accumulatedText.split(/\s+/).length * 1.3
    );

    return {
      firstChunkLatency: this.metrics.firstChunkTime
        ? this.metrics.firstChunkTime - (this.metrics.startTime || 0)
        : totalDuration,
      totalDuration,
      chunkCount,
      avgChunkLatency,
      totalTokens,
    };
  }
}
