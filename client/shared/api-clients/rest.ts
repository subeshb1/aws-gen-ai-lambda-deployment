import { GenAIRequest, StreamCallbacks, APIResponse } from '../types/api';

export class RestClient {
  constructor(private readonly endpoint: string) {}

  async generate(request: GenAIRequest, callbacks?: StreamCallbacks): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`https://${this.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      callbacks?.onChunk?.(data.data.text);
      callbacks?.onComplete?.();

      return {
        source: 'rest',
        text: data.data.text,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      callbacks?.onError?.(error as Error);
      throw error;
    }
  }
} 
