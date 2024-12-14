import { GenAIRequest, GenAIResponse, GenAIError } from './types';

const generateMockResponse = () => {
  const paragraphs = [
    "I'm a sophisticated AI language model designed to assist with various tasks and provide detailed responses. Let me demonstrate my capabilities with a comprehensive response that showcases different aspects of natural language generation.",

    // "First, let's talk about the technical aspects of AI and language models. These systems are built on complex neural networks that process and generate human-like text through sophisticated pattern recognition and statistical analysis. The technology behind this involves transformer architectures, attention mechanisms, and deep learning principles.",

    // 'Moving on to practical applications, AI systems like myself can help with tasks such as: writing and editing content, answering questions, explaining complex topics, analyzing text, and even generating creative content. Each of these applications requires careful consideration of context, accuracy, and relevance.',

    // "It's also worth noting that AI technology continues to evolve rapidly. New developments in areas like few-shot learning, prompt engineering, and model compression are pushing the boundaries of what's possible. These advancements are making AI systems more efficient, more accurate, and more accessible.",

    // 'When it comes to real-world implementation, there are several factors to consider: model size and computational requirements, latency and response time, accuracy and reliability, and ethical considerations. Each of these aspects plays a crucial role in developing effective AI solutions.',

    // 'Let me also demonstrate some formatting capabilities:\n• Bullet points for organization\n• Structured information\n• Clear paragraph breaks\n• Natural flow of ideas',

    // "Furthermore, I can adapt my tone and style based on the context. Whether it's technical documentation, casual conversation, or formal business communication, the response can be tailored appropriately.",

    // "To conclude, this response showcases various aspects of AI language generation: coherent structure, relevant content, natural flow, and appropriate formatting. It's designed to test different aspects of the streaming implementation, including handling longer responses and various text patterns.",

    // "Thank you for this opportunity to demonstrate these capabilities. I hope this response helps in testing the system's performance with longer, more complex content streams.",
  ];

  // Return array of words for streaming simulation
  return paragraphs.join(' ').split(/\s+/);
};

export class GenAIService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async mockResponse(request: GenAIRequest): Promise<string[]> {
    return generateMockResponse();
  }

  // Generator function for streaming responses
  async *streamResponse(
    request: GenAIRequest
  ): AsyncGenerator<string, GenAIResponse, unknown> {
    try {
      // Mock response broken into chunks
      const mockWords = await this.mockResponse(request);

      let totalText = '';
      const startTime = Date.now();

      // Simulate streaming word by word
      for (const word of mockWords) {
        // Add random delay between 100-300ms
        await new Promise((resolve) =>
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
