import { GenAIRequest, StreamCallbacks, APIResponse, StreamMetrics } from '../types/api';

export class RestClient {
  constructor(private readonly endpoint: string) {}

  private calculateMetrics(text: string, startTime: number): StreamMetrics {
    const now = Date.now();
    const totalDuration = now - startTime;
    
    // For REST API, we only get one chunk
    return {
      firstChunkLatency: totalDuration,
      totalDuration,
      chunkCount: 1,
      avgChunkLatency: totalDuration,
      totalTokens: Math.round(text.split(/\s+/).length * 1.3)
    };
  }

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
      const text = data.data.text;
      
      const metrics = this.calculateMetrics(text, startTime);
      callbacks?.onChunk?.(text, metrics);
      callbacks?.onComplete?.();

      return {
        source: 'rest',
        text: text.trim(),
        metrics
      };
    } catch (error) {
      callbacks?.onError?.(error as Error);
      throw error;
    }
  }
} 
