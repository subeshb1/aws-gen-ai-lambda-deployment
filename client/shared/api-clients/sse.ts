import { GenAIRequest, StreamCallbacks, APIResponse } from '../types/api';

export class SSEClient {
  private eventSource: EventSource | null = null;

  constructor(private readonly endpoint: string) {}

  async generate(
    request: GenAIRequest,
    callbacks: StreamCallbacks
  ): Promise<APIResponse> {
    const startTime = Date.now();
    let response: APIResponse = {
      source: 'sse',
      text: '',
      latency: 0,
    };

    return new Promise((resolve, reject) => {
      const url = `https://${this.endpoint}/`;
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
          const chunk = JSON.parse(event.data);
          callbacks.onChunk?.(chunk.text);
          response.text += chunk.text;
        } catch (error) {
          console.error('Error parsing SSE chunk:', error);
        }
      });

      this.eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse(event.data);
          response.latency = Date.now() - startTime;
          callbacks.onComplete?.();
          resolve(response);
          this.eventSource?.close();
        } catch (error) {
          console.error('Error parsing SSE complete event:', error);
          reject(error);
        }
      });

      this.eventSource.addEventListener('error', (event) => {
        try {
          const error = JSON.parse(event.data);
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
