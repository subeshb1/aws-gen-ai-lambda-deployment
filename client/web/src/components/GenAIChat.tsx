import React, { useState, useEffect, useRef } from 'react';
import { GenAIClient, getEndpoints } from '../../../shared/api-clients';

interface ResponseMetrics {
  text: string;
  firstChunkLatency?: number;
  totalDuration?: number;
  chunkCount?: number;
  avgChunkLatency?: number;
  totalTokens?: number;
}

const formatDuration = (ms?: number): string => {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const MetricItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center bg-white rounded-lg p-2 shadow-sm">
    <span className="text-xs text-gray-500 mb-1">{label}</span>
    <span className="font-mono font-medium text-gray-800">{value}</span>
  </div>
);

const MetricsDisplay = ({ metrics }: { metrics: ResponseMetrics }) => (
  <div className="flex gap-2 mb-3 p-2 bg-gray-50 rounded-lg text-sm">
    <div className="flex-1 flex gap-2">
      <MetricItem
        label="First Chunk"
        value={formatDuration(metrics.firstChunkLatency)}
      />
      <MetricItem
        label="Total Time"
        value={formatDuration(metrics.totalDuration)}
      />
      <MetricItem
        label="Avg Latency"
        value={formatDuration(metrics.avgChunkLatency)}
      />
    </div>
    <div className="flex gap-2 border-l pl-2">
      <MetricItem
        label="Chunks"
        value={metrics.chunkCount?.toLocaleString() || '0'}
      />
      <MetricItem
        label="Tokens"
        value={metrics.totalTokens?.toLocaleString() || '0'}
      />
    </div>
  </div>
);

export function GenAIChat() {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<{
    [key: string]: ResponseMetrics;
  }>({
    websocket: { text: '' },
    sse: { text: '' },
    rest: { text: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<GenAIClient | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startTimes = useRef<{ [key: string]: number }>({});
  const chunkTimes = useRef<{ [key: string]: number[] }>({});

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

    const requestStartTime = Date.now();

    setResponses({
      websocket: { text: '', firstChunkLatency: undefined },
      sse: { text: '', firstChunkLatency: undefined },
      rest: {
        text: '',
        firstChunkLatency: 0, // For sync API, first chunk is same as total time
        totalDuration: 0,
        chunkCount: 0,
      },
    });

    // Reset metrics
    startTimes.current = {
      websocket: requestStartTime,
      sse: requestStartTime,
      rest: requestStartTime,
    };
    chunkTimes.current = {};

    try {
      await clientRef.current.generateAll(
        { prompt: input },
        {
          onChunk: (text) => {
            const match = text.match(/^\[(.*?)\]\s(.*)$/);
            if (match) {
              const [, source, content] = match;
              const key = source.toLowerCase();
              const now = Date.now();

              // Track chunk arrival time
              if (!chunkTimes.current[key]) {
                chunkTimes.current[key] = [];
              }
              chunkTimes.current[key].push(now);

              setResponses((prev) => {
                const totalDuration = now - startTimes.current[key];
                const chunkCount = chunkTimes.current[key].length;

                // Calculate average chunk latency
                const avgChunkLatency =
                  chunkCount > 1
                    ? totalDuration / (chunkCount - 1)
                    : totalDuration;

                // Rough token count (simple word count * 1.3)
                const totalTokens = Math.round(
                  (prev[key].text + content).split(/\s+/).length * 1.3
                );

                return {
                  ...prev,
                  [key]: {
                    text: prev[key].text + content,
                    // Only set firstChunkLatency if it hasn't been set yet
                    firstChunkLatency:
                      prev[key].firstChunkLatency ??
                      chunkTimes.current[key][0] - startTimes.current[key],
                    totalDuration,
                    chunkCount,
                    avgChunkLatency,
                    totalTokens,
                  },
                };
              });
            }
          },
          onError: (error) => {
            setError(error.message);
            setLoading(false);
          },
          onComplete: () => {
            // Update final metrics for sync API
            setResponses((prev) => {
              const now = Date.now();
              const totalDuration = now - startTimes.current.rest;
              return {
                ...prev,
                rest: {
                  ...prev.rest,
                  firstChunkLatency: totalDuration,
                  totalDuration,
                  chunkCount: 1,
                  avgChunkLatency: totalDuration,
                  totalTokens: Math.round(
                    prev.rest.text.split(/\s+/).length * 1.3
                  ),
                },
              };
            });
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            GenAI Comparison
          </h1>
          <p className="text-gray-600">
            Compare different streaming implementations in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(responses).map(([source, metrics]) => (
            <div
              key={source}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white capitalize">
                  {source}
                </h3>
                {loading && (
                  <div className="flex items-center text-blue-100 text-sm">
                    <div className="w-2 h-2 bg-blue-200 rounded-full mr-2 animate-pulse"></div>
                    Generating...
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <MetricsDisplay metrics={metrics} />

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none hidden"></div>
                  <div className="h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                    <div className="bg-gray-50 p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap">
                      {metrics.text || (
                        <span className="text-gray-400 italic">
                          Waiting for input...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full p-3 border rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Press Enter to send
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         disabled:bg-gray-300 disabled:cursor-not-allowed 
                         transition-colors duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
