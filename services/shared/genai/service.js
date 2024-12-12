"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenAIService = exports.GenAIService = void 0;
class GenAIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async generateResponse(request) {
        try {
            // TODO: Replace with actual API implementation
            // This is a mock implementation for now
            const mockResponse = {
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
        }
        catch (error) {
            const apiError = {
                message: error.message || 'Failed to generate AI response',
                code: 'GENAI_ERROR',
                statusCode: 500,
            };
            throw apiError;
        }
    }
}
exports.GenAIService = GenAIService;
// Create singleton instance
let instance = null;
const getGenAIService = (apiKey) => {
    if (!instance) {
        instance = new GenAIService(apiKey);
    }
    return instance;
};
exports.getGenAIService = getGenAIService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxZQUFZO0lBR3ZCLFlBQVksTUFBYztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQXFCO1FBQzFDLElBQUk7WUFDRiwrQ0FBK0M7WUFDL0Msd0NBQXdDO1lBQ3hDLE1BQU0sWUFBWSxHQUFrQjtnQkFDbEMsSUFBSSxFQUFFLDZCQUE2QixPQUFPLENBQUMsTUFBTSxFQUFFO2dCQUNuRCxLQUFLLEVBQUU7b0JBQ0wsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTTtvQkFDbkMsZ0JBQWdCLEVBQUUsRUFBRTtvQkFDcEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUU7aUJBQ3hDO2FBQ0YsQ0FBQztZQUVGLHVCQUF1QjtZQUN2QixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFMUQsT0FBTyxZQUFZLENBQUM7U0FDckI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE1BQU0sUUFBUSxHQUFlO2dCQUMzQixPQUFPLEVBQUcsS0FBZSxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0M7Z0JBQ3JFLElBQUksRUFBRSxhQUFhO2dCQUNuQixVQUFVLEVBQUUsR0FBRzthQUNoQixDQUFDO1lBQ0YsTUFBTSxRQUFRLENBQUM7U0FDaEI7SUFDSCxDQUFDO0NBQ0Y7QUFqQ0Qsb0NBaUNDO0FBRUQsNEJBQTRCO0FBQzVCLElBQUksUUFBUSxHQUF3QixJQUFJLENBQUM7QUFFbEMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFjLEVBQWdCLEVBQUU7SUFDOUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQztJQUNELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQUxXLFFBQUEsZUFBZSxtQkFLMUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHZW5BSVJlcXVlc3QsIEdlbkFJUmVzcG9uc2UsIEdlbkFJRXJyb3IgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEdlbkFJU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBpS2V5OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYXBpS2V5OiBzdHJpbmcpIHtcbiAgICB0aGlzLmFwaUtleSA9IGFwaUtleTtcbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlUmVzcG9uc2UocmVxdWVzdDogR2VuQUlSZXF1ZXN0KTogUHJvbWlzZTxHZW5BSVJlc3BvbnNlPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRPRE86IFJlcGxhY2Ugd2l0aCBhY3R1YWwgQVBJIGltcGxlbWVudGF0aW9uXG4gICAgICAvLyBUaGlzIGlzIGEgbW9jayBpbXBsZW1lbnRhdGlvbiBmb3Igbm93XG4gICAgICBjb25zdCBtb2NrUmVzcG9uc2U6IEdlbkFJUmVzcG9uc2UgPSB7XG4gICAgICAgIHRleHQ6IGBNb2NrIHJlc3BvbnNlIGZvciBwcm9tcHQ6ICR7cmVxdWVzdC5wcm9tcHR9YCxcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBwcm9tcHRUb2tlbnM6IHJlcXVlc3QucHJvbXB0Lmxlbmd0aCxcbiAgICAgICAgICBjb21wbGV0aW9uVG9rZW5zOiA1MCxcbiAgICAgICAgICB0b3RhbFRva2VuczogcmVxdWVzdC5wcm9tcHQubGVuZ3RoICsgNTAsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICAvLyBTaW11bGF0ZSBBUEkgbGF0ZW5jeVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpO1xuXG4gICAgICByZXR1cm4gbW9ja1Jlc3BvbnNlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBhcGlFcnJvcjogR2VuQUlFcnJvciA9IHtcbiAgICAgICAgbWVzc2FnZTogKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gZ2VuZXJhdGUgQUkgcmVzcG9uc2UnLFxuICAgICAgICBjb2RlOiAnR0VOQUlfRVJST1InLFxuICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICB9O1xuICAgICAgdGhyb3cgYXBpRXJyb3I7XG4gICAgfVxuICB9XG59XG5cbi8vIENyZWF0ZSBzaW5nbGV0b24gaW5zdGFuY2VcbmxldCBpbnN0YW5jZTogR2VuQUlTZXJ2aWNlIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBjb25zdCBnZXRHZW5BSVNlcnZpY2UgPSAoYXBpS2V5OiBzdHJpbmcpOiBHZW5BSVNlcnZpY2UgPT4ge1xuICBpZiAoIWluc3RhbmNlKSB7XG4gICAgaW5zdGFuY2UgPSBuZXcgR2VuQUlTZXJ2aWNlKGFwaUtleSk7XG4gIH1cbiAgcmV0dXJuIGluc3RhbmNlO1xufTtcbiJdfQ==