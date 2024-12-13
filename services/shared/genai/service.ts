import { GenAIRequest, GenAIResponse, GenAIError } from './types';

export class GenAIService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Generator function for streaming responses
  async *streamResponse(request: GenAIRequest): AsyncGenerator<string, GenAIResponse, unknown> {
    try {
      // Mock response broken into chunks
      const mockWords = [
        "I'm", "a", "mock", "AI", "response,", 
        "simulating", "streaming", "for", "your", "prompt:", 
        request.prompt, "...", "This", "is", "just", 
        "a", "test", "implementation", "that", "will", 
        "be", "replaced", "with", "actual", "LLM", 
        "integration", "later."
      ];

      let totalText = '';
      const startTime = Date.now();

      // Simulate streaming word by word
      for (const word of mockWords) {
        // Add random delay between 100-300ms
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 200 + 100)
        );

        totalText += word + ' ';
        yield word + ' ';
      }

      // Return final response with metadata
      return {
        text: totalText.trim(),
        usage: {
          promptTokens: request.prompt.length,
          completionTokens: totalText.length,
          totalTokens: request.prompt.length + totalText.length,
        },
      };
    } catch (error) {
      const apiError: GenAIError = {
        message: (error as Error).message || 'Failed to generate AI response',
        code: 'GENAI_ERROR',
        statusCode: 500,
      };
      throw apiError;
    }
  }

  // Non-streaming response (for backward compatibility)
  async generateResponse(request: GenAIRequest): Promise<GenAIResponse> {
    try {
      let fullText = '';
      
      // Use the generator to accumulate the full response
      for await (const chunk of this.streamResponse(request)) {
        fullText += chunk;
      }

      return {
        text: fullText.trim(),
        usage: {
          promptTokens: request.prompt.length,
          completionTokens: fullText.length,
          totalTokens: request.prompt.length + fullText.length,
        },
      };
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
