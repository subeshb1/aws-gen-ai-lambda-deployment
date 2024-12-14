import { SSEEvent, SSERequest, formatSSEMessage } from '../types';
import { getGenAIService } from '../../../shared/genai/service';
import { GenAIError } from '../../../shared/genai/types';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

declare const awslambda: {
  streamifyResponse(
    handler: (event: any, responseStream: any, context: any) => Promise<void>
  ): (event: any, context: any) => Promise<void>;
  HttpResponseStream: any;
};

// Initialize GenAI service
const genAIService = getGenAIService();

// Create a readable stream from async generator
function createReadableFromGenerator(generator: AsyncGenerator<string>) {
  return new Readable({
    async read() {
      try {
        const { value, done } = await generator.next();
        if (done) {
          this.push(null);
        } else {
          const message = formatSSEMessage({
            id: Date.now().toString(),
            event: 'chunk',
            data: JSON.stringify({ text: value }),
          });
          this.push(message);
        }
      } catch (error) {
        const errorMessage = formatSSEMessage({
          id: Date.now().toString(),
          event: 'error',
          data: JSON.stringify({
            error: {
              message: 'Stream processing error',
              code: 'STREAM_ERROR',
              statusCode: 500,
            },
          }),
        });
        this.push(errorMessage);
        this.push(null);
      }
    },
  });
}

export const handler = awslambda.streamifyResponse(
  async (event: SSEEvent, responseStream, _context) => {
    const httpResponseMetadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    };
    responseStream = awslambda.HttpResponseStream.from(
      responseStream,
      httpResponseMetadata
    );

    try {
      // Get prompt from query parameters
      const prompt = event.queryStringParameters?.prompt;

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      // Create readable stream from generator
      const generator = genAIService.streamResponse({ prompt });
      const readableStream = createReadableFromGenerator(generator);

      // Add completion message at the end
      readableStream.on('end', () => {
        const completionMessage = formatSSEMessage({
          id: Date.now().toString(),
          event: 'complete',
          data: JSON.stringify({ status: 'done' }),
        });
        responseStream.write(completionMessage);
        responseStream.end();
      });

      // Use pipeline to handle streaming
      await pipeline(readableStream, responseStream);
    } catch (error) {
      console.error('Error:', error);

      const errorMessage = formatSSEMessage({
        id: Date.now().toString(),
        event: 'error',
        data: JSON.stringify({
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        }),
      });

      responseStream.write(errorMessage);
      responseStream.end();
    }
  }
);
