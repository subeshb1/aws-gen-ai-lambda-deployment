import { GenAIRequest, GenAIResponse } from './types';
export declare class GenAIService {
    private readonly apiKey;
    constructor(apiKey: string);
    streamResponse(request: GenAIRequest): AsyncGenerator<string, GenAIResponse, unknown>;
    generateResponse(request: GenAIRequest): Promise<GenAIResponse>;
}
export declare const getGenAIService: (apiKey: string) => GenAIService;
