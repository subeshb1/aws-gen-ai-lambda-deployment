import React, { useState, useEffect, useRef } from 'react';
import { GenAIClient, getEndpoints } from '../../../shared/api-clients';
import { APIResponse } from '../../../shared/types/api';

export function GenAIChat() {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<{
    [key: string]: { text: string; latency?: number };
  }>({
    websocket: { text: '' },
    sse: { text: '' },
    rest: { text: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<GenAIClient | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const endpoints = getEndpoints();
      clientRef.current = new GenAIClient(endpoints);
    } catch (error) {
      setError('Failed to initialize API clients');
      console.error('Initialization error:', error);
    }

    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !clientRef.current || loading) return;

    setLoading(true);
    setError(null);
    setResponses({
      websocket: { text: '' },
      sse: { text: '' },
      rest: { text: '' },
    });

    try {
      await clientRef.current.generateAll(
        { prompt: input },
        {
          onChunk: (text) => {
            const match = text.match(/^\[(.*?)\]\s(.*)$/);
            if (match) {
              const [, source, content] = match;
              setResponses((prev) => ({
                ...prev,
                [source.toLowerCase()]: {
                  text: prev[source.toLowerCase()].text + content,
                },
              }));
            }
          },
          onError: (error) => {
            setError(error.message);
            setLoading(false);
          },
          onComplete: () => {
            setLoading(false);
            if (inputRef.current) {
              inputRef.current.focus();
            }
          },
        }
      );
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">GenAI Comparison</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(responses).map(([source, { text, latency }]) => (
            <div key={source} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{source}</h3>
                {loading && (
                  <div className="animate-pulse text-sm text-blue-500">
                    Generating...
                  </div>
                )}
                {latency && (
                  <div className="text-sm text-gray-500">
                    {latency}ms
                  </div>
                )}
              </div>
              <div className="h-[400px] overflow-y-auto bg-gray-50 rounded p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {text || 'Waiting for input...'}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt here... (Press Enter to send)"
            className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
