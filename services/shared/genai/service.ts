import { GenAIRequest, GenAIResponse, GenAIError } from './types';

export class GenAIService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(request: GenAIRequest): Promise<GenAIResponse> {
    try {
      // TODO: Replace with actual API implementation
      // This is a mock implementation for now
      const mockResponse: GenAIResponse = {
        text: `Mock response for prompt: ${request.prompt}`,
        usage: {
          promptTokens: request.prompt.length,
          completionTokens: 50,
          totalTokens: request.prompt.length + 50,
        },
      };

      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return mockResponse;
    } catch (error) {
      const apiError: GenAIError = {
        message: (error as Error).message || 'Failed to generate AI response',
        code: 'GENAI_ERROR',
        statusCode: 500,
      };
      throw apiError;
    }
  }
}

// Create singleton instance
let instance: GenAIService | null = null;

export const getGenAIService = (apiKey: string): GenAIService => {
  if (!instance) {
    instance = new GenAIService(apiKey);
  }
  return instance;
};
