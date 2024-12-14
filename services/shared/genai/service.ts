import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { GenAIRequest, GenAIResponse, GenAIError } from './types';

export class GenAIService {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    // Change to your region where you have models enabled
    this.client = new BedrockRuntimeClient({ region: 'us-west-2' });
  }

  // Generator function for streaming responses
  async *streamResponse(
    request: GenAIRequest
  ): AsyncGenerator<string, GenAIResponse, unknown> {
    try {
      const command = new ConverseStreamCommand({
        modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        messages: [
          {
            role: 'user',
            content: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
      });
      const response = await this.client.send(command);

      if (!response.stream) {
        throw new Error('No response stream received');
      }

      let totalText = '';

      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          const textDelta = event.contentBlockDelta.delta.text;
          totalText += textDelta;
          yield textDelta;
        }
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

export const getGenAIService = (): GenAIService => {
  if (!instance) {
    instance = new GenAIService();
  }
  return instance;
};
