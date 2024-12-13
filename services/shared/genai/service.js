"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenAIService = exports.GenAIService = void 0;
class GenAIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    // Generator function for streaming responses
    async *streamResponse(request) {
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
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
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
    // Non-streaming response (for backward compatibility)
    async generateResponse(request) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxZQUFZO0lBR3ZCLFlBQVksTUFBYztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsNkNBQTZDO0lBQzdDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFxQjtRQUN6QyxJQUFJO1lBQ0YsbUNBQW1DO1lBQ25DLE1BQU0sU0FBUyxHQUFHO2dCQUNoQixLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVztnQkFDckMsWUFBWSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVM7Z0JBQ25ELE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTTtnQkFDM0MsR0FBRyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsTUFBTTtnQkFDN0MsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUs7Z0JBQ3pDLGFBQWEsRUFBRSxRQUFRO2FBQ3hCLENBQUM7WUFFRixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDbkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRTdCLGtDQUFrQztZQUNsQyxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsRUFBRTtnQkFDNUIscUNBQXFDO2dCQUNyQyxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQzFCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FDL0MsQ0FBQztnQkFFRixTQUFTLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztnQkFDeEIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDO2FBQ2xCO1lBRUQsc0NBQXNDO1lBQ3RDLE9BQU87Z0JBQ0wsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3RCLEtBQUssRUFBRTtvQkFDTCxZQUFZLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNO29CQUNuQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsTUFBTTtvQkFDbEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO2lCQUN0RDthQUNGLENBQUM7U0FDSDtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsTUFBTSxRQUFRLEdBQWU7Z0JBQzNCLE9BQU8sRUFBRyxLQUFlLENBQUMsT0FBTyxJQUFJLGdDQUFnQztnQkFDckUsSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFVBQVUsRUFBRSxHQUFHO2FBQ2hCLENBQUM7WUFDRixNQUFNLFFBQVEsQ0FBQztTQUNoQjtJQUNILENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQXFCO1FBQzFDLElBQUk7WUFDRixJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFFbEIsb0RBQW9EO1lBQ3BELElBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3RELFFBQVEsSUFBSSxLQUFLLENBQUM7YUFDbkI7WUFFRCxPQUFPO2dCQUNMLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFO2dCQUNyQixLQUFLLEVBQUU7b0JBQ0wsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTTtvQkFDbkMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLE1BQU07b0JBQ2pDLFdBQVcsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTTtpQkFDckQ7YUFDRixDQUFDO1NBQ0g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE1BQU0sUUFBUSxHQUFlO2dCQUMzQixPQUFPLEVBQUcsS0FBZSxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0M7Z0JBQ3JFLElBQUksRUFBRSxhQUFhO2dCQUNuQixVQUFVLEVBQUUsR0FBRzthQUNoQixDQUFDO1lBQ0YsTUFBTSxRQUFRLENBQUM7U0FDaEI7SUFDSCxDQUFDO0NBQ0Y7QUFoRkQsb0NBZ0ZDO0FBRUQsNEJBQTRCO0FBQzVCLElBQUksUUFBUSxHQUF3QixJQUFJLENBQUM7QUFFbEMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFjLEVBQWdCLEVBQUU7SUFDOUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQztJQUNELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQUxXLFFBQUEsZUFBZSxtQkFLMUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHZW5BSVJlcXVlc3QsIEdlbkFJUmVzcG9uc2UsIEdlbkFJRXJyb3IgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEdlbkFJU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBpS2V5OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYXBpS2V5OiBzdHJpbmcpIHtcbiAgICB0aGlzLmFwaUtleSA9IGFwaUtleTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRvciBmdW5jdGlvbiBmb3Igc3RyZWFtaW5nIHJlc3BvbnNlc1xuICBhc3luYyAqc3RyZWFtUmVzcG9uc2UocmVxdWVzdDogR2VuQUlSZXF1ZXN0KTogQXN5bmNHZW5lcmF0b3I8c3RyaW5nLCBHZW5BSVJlc3BvbnNlLCB1bmtub3duPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIE1vY2sgcmVzcG9uc2UgYnJva2VuIGludG8gY2h1bmtzXG4gICAgICBjb25zdCBtb2NrV29yZHMgPSBbXG4gICAgICAgIFwiSSdtXCIsIFwiYVwiLCBcIm1vY2tcIiwgXCJBSVwiLCBcInJlc3BvbnNlLFwiLCBcbiAgICAgICAgXCJzaW11bGF0aW5nXCIsIFwic3RyZWFtaW5nXCIsIFwiZm9yXCIsIFwieW91clwiLCBcInByb21wdDpcIiwgXG4gICAgICAgIHJlcXVlc3QucHJvbXB0LCBcIi4uLlwiLCBcIlRoaXNcIiwgXCJpc1wiLCBcImp1c3RcIiwgXG4gICAgICAgIFwiYVwiLCBcInRlc3RcIiwgXCJpbXBsZW1lbnRhdGlvblwiLCBcInRoYXRcIiwgXCJ3aWxsXCIsIFxuICAgICAgICBcImJlXCIsIFwicmVwbGFjZWRcIiwgXCJ3aXRoXCIsIFwiYWN0dWFsXCIsIFwiTExNXCIsIFxuICAgICAgICBcImludGVncmF0aW9uXCIsIFwibGF0ZXIuXCJcbiAgICAgIF07XG5cbiAgICAgIGxldCB0b3RhbFRleHQgPSAnJztcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgIC8vIFNpbXVsYXRlIHN0cmVhbWluZyB3b3JkIGJ5IHdvcmRcbiAgICAgIGZvciAoY29uc3Qgd29yZCBvZiBtb2NrV29yZHMpIHtcbiAgICAgICAgLy8gQWRkIHJhbmRvbSBkZWxheSBiZXR3ZWVuIDEwMC0zMDBtc1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IFxuICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgTWF0aC5yYW5kb20oKSAqIDIwMCArIDEwMClcbiAgICAgICAgKTtcblxuICAgICAgICB0b3RhbFRleHQgKz0gd29yZCArICcgJztcbiAgICAgICAgeWllbGQgd29yZCArICcgJztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIGZpbmFsIHJlc3BvbnNlIHdpdGggbWV0YWRhdGFcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IHRvdGFsVGV4dC50cmltKCksXG4gICAgICAgIHVzYWdlOiB7XG4gICAgICAgICAgcHJvbXB0VG9rZW5zOiByZXF1ZXN0LnByb21wdC5sZW5ndGgsXG4gICAgICAgICAgY29tcGxldGlvblRva2VuczogdG90YWxUZXh0Lmxlbmd0aCxcbiAgICAgICAgICB0b3RhbFRva2VuczogcmVxdWVzdC5wcm9tcHQubGVuZ3RoICsgdG90YWxUZXh0Lmxlbmd0aCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGFwaUVycm9yOiBHZW5BSUVycm9yID0ge1xuICAgICAgICBtZXNzYWdlOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBnZW5lcmF0ZSBBSSByZXNwb25zZScsXG4gICAgICAgIGNvZGU6ICdHRU5BSV9FUlJPUicsXG4gICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIH07XG4gICAgICB0aHJvdyBhcGlFcnJvcjtcbiAgICB9XG4gIH1cblxuICAvLyBOb24tc3RyZWFtaW5nIHJlc3BvbnNlIChmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSlcbiAgYXN5bmMgZ2VuZXJhdGVSZXNwb25zZShyZXF1ZXN0OiBHZW5BSVJlcXVlc3QpOiBQcm9taXNlPEdlbkFJUmVzcG9uc2U+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGZ1bGxUZXh0ID0gJyc7XG4gICAgICBcbiAgICAgIC8vIFVzZSB0aGUgZ2VuZXJhdG9yIHRvIGFjY3VtdWxhdGUgdGhlIGZ1bGwgcmVzcG9uc2VcbiAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgdGhpcy5zdHJlYW1SZXNwb25zZShyZXF1ZXN0KSkge1xuICAgICAgICBmdWxsVGV4dCArPSBjaHVuaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dDogZnVsbFRleHQudHJpbSgpLFxuICAgICAgICB1c2FnZToge1xuICAgICAgICAgIHByb21wdFRva2VuczogcmVxdWVzdC5wcm9tcHQubGVuZ3RoLFxuICAgICAgICAgIGNvbXBsZXRpb25Ub2tlbnM6IGZ1bGxUZXh0Lmxlbmd0aCxcbiAgICAgICAgICB0b3RhbFRva2VuczogcmVxdWVzdC5wcm9tcHQubGVuZ3RoICsgZnVsbFRleHQubGVuZ3RoLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgYXBpRXJyb3I6IEdlbkFJRXJyb3IgPSB7XG4gICAgICAgIG1lc3NhZ2U6IChlcnJvciBhcyBFcnJvcikubWVzc2FnZSB8fCAnRmFpbGVkIHRvIGdlbmVyYXRlIEFJIHJlc3BvbnNlJyxcbiAgICAgICAgY29kZTogJ0dFTkFJX0VSUk9SJyxcbiAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgfTtcbiAgICAgIHRocm93IGFwaUVycm9yO1xuICAgIH1cbiAgfVxufVxuXG4vLyBDcmVhdGUgc2luZ2xldG9uIGluc3RhbmNlXG5sZXQgaW5zdGFuY2U6IEdlbkFJU2VydmljZSB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgZ2V0R2VuQUlTZXJ2aWNlID0gKGFwaUtleTogc3RyaW5nKTogR2VuQUlTZXJ2aWNlID0+IHtcbiAgaWYgKCFpbnN0YW5jZSkge1xuICAgIGluc3RhbmNlID0gbmV3IEdlbkFJU2VydmljZShhcGlLZXkpO1xuICB9XG4gIHJldHVybiBpbnN0YW5jZTtcbn07XG4iXX0=