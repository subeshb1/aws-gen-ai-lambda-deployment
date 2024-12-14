import {
  GenAIRequest,
  StreamCallbacks,
  APIResponse,
  StreamMetrics,
} from '../types/api';

export class SSEClient {
  private eventSource: EventSource | null = null;
  private metrics: {
    startTime?: number;
    firstChunkTime?: number;
    chunkTimes: number[];
    accumulatedText: string;
  } = {
    chunkTimes: [],
    accumulatedText: '',
  };

  constructor(private readonly endpoint: string) {}

  private resetState() {
    this.metrics = {
      startTime: Date.now(),
      chunkTimes: [],
      accumulatedText: '',
    };
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
      this.metrics.accumulatedText.split(/\s+/).length * 1.3
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

  async generate(
    request: GenAIRequest,
    callbacks: StreamCallbacks
  ): Promise<APIResponse> {
    this.resetState();

    return new Promise((resolve, reject) => {
      const url = `https://${this.endpoint}/?prompt=${request.prompt}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        callbacks.onError?.(new Error('SSE connection error'));
        this.eventSource?.close();
        reject(error);
      };

      this.eventSource.addEventListener('chunk', (event) => {
        try {
          const now = Date.now();
          const chunk = JSON.parse(event.data);

          if (!this.metrics.firstChunkTime) {
            this.metrics.firstChunkTime = now;
          }
          this.metrics.chunkTimes.push(now);
          this.metrics.accumulatedText += chunk.text;

          // Calculate and emit current metrics with each chunk
          const currentMetrics = this.calculateMetrics();
          callbacks.onChunk?.('SSE', chunk.text, currentMetrics);
        } catch (error) {
          console.error('Error parsing SSE chunk:', error);
        }
      });

      this.eventSource.addEventListener('complete', (event) => {
        try {
          const response: APIResponse = {
            source: 'SSE',
            text: this.metrics.accumulatedText.trim(),
            metrics: this.calculateMetrics(),
          };

          callbacks.onComplete?.('SSE');
          resolve(response);
          this.eventSource?.close();
        } catch (error) {
          console.error('Error parsing SSE complete event:', error);
          reject(error);
        }
      });

      this.eventSource.addEventListener('error', (event) => {
        try {
          const error = JSON.parse((event as MessageEvent).data);
          callbacks.onError?.(new Error(error.message));
          reject(error);
          this.eventSource?.close();
        } catch (error) {
          console.error('Error parsing SSE error event:', error);
          reject(error);
        }
      });
    });
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
