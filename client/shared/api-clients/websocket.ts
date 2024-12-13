import { GenAIRequest, StreamCallbacks, APIResponse } from '../types/api';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: StreamCallbacks = {};
  private accumulatedText = '';

  constructor(private readonly endpoint: string) {}

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
          
          switch (response.type) {
            case 'chunk':
              // Handle streaming chunk
              const chunkText = response.payload.text;
              this.accumulatedText += chunkText;
              this.callbacks.onChunk?.(chunkText);
              break;

            case 'success':
              // Handle completion with final response
              this.callbacks.onComplete?.();
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
          this.callbacks.onError?.(new Error('Failed to parse WebSocket message'));
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    });
  }

  async generate(request: GenAIRequest, callbacks: StreamCallbacks): Promise<APIResponse> {
    this.callbacks = callbacks;
    this.accumulatedText = '';
    const startTime = Date.now();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      try {
        // Send the generation request
        this.ws?.send(JSON.stringify({
          action: 'generate',
          payload: request,
        }));

        // Set up message handler for this request
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'success') {
              // Resolve with final response
              const response: APIResponse = {
                source: 'websocket',
                text: this.accumulatedText.trim(),
                latency: Date.now() - startTime,
              };
              resolve(response);
              this.ws?.removeEventListener('message', messageHandler);
            } else if (data.type === 'error') {
              // Handle error
              reject(new Error(data.payload.message));
              this.ws?.removeEventListener('message', messageHandler);
            }
            // Chunks are handled by the main onmessage handler
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
    }
  }
} 
