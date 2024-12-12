export interface GenAIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenAIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GenAIError {
  message: string;
  code: string;
  statusCode: number;
} 
