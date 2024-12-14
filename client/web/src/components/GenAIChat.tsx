import React, { useState, useEffect, useRef } from 'react';
import { GenAIClient, getEndpoints } from '../../../shared/api-clients';
import {
  StreamMetrics,
  ResponseSource,
  CompleteCallback,
} from '../../../shared/types/api';

interface ResponseState {
  text: string;
  metrics?: StreamMetrics;
  isComplete?: boolean;
}

const formatDuration = (ms?: number): string => {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const PLACEHOLDER_METRICS: StreamMetrics = {
  firstChunkLatency: 0,
  totalDuration: 0,
  chunkCount: 0,
  avgChunkLatency: 0,
  totalTokens: 0,
};

const MetricItem = ({
  label,
  value,
  isWinner,
  isPlaceholder = false,
}: {
  label: string;
  value: string | number;
  isWinner?: boolean;
  isPlaceholder?: boolean;
}) => (
  <div
    className={`flex flex-col items-center px-2 py-1 rounded-lg relative min-w-[70px]
    ${isWinner ? 'bg-green-50 ring-1 ring-green-400' : 'bg-white'} 
    ${
      isPlaceholder ? 'opacity-50' : ''
    } transition-all duration-200 hover:scale-105`}
  >
    {isWinner && !isPlaceholder && (
      <div className="absolute -top-1.5 -right-1.5 bg-green-400 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center text-[10px] shadow-lg transform hover:scale-110 transition-transform">
        🏆
      </div>
    )}
    <span className="text-[10px] text-gray-500 mb-0.5">{label}</span>
    <span
      className={`font-mono text-xs font-medium ${
        isWinner && !isPlaceholder ? 'text-green-600' : 'text-gray-800'
      }`}
    >
      {isPlaceholder ? '-' : value}
    </span>
  </div>
);

interface MetricsDisplayProps {
  metrics?: StreamMetrics;
  allMetrics: { [key: string]: ResponseState };
  source: string;
}

const MetricsDisplay = ({
  metrics,
  allMetrics,
  source,
}: MetricsDisplayProps) => {
  const currentMetrics = metrics || PLACEHOLDER_METRICS;
  const isPlaceholder = !metrics;
  const isComplete = allMetrics[source]?.isComplete;

  // Find winners for each latency metric
  const findWinner = (metricKey: keyof StreamMetrics): string[] => {
    const validMetrics = Object.entries(allMetrics)
      .filter(([_, r]) => {
        // Basic validation for all metrics
        const hasValidMetric =
          r?.metrics?.[metricKey] !== undefined && r.metrics[metricKey] > 0;

        // For total duration, also require completion
        if (metricKey === 'totalDuration') {
          return hasValidMetric && r.isComplete;
        }

        return hasValidMetric;
      })
      .map(([src, r]) => ({ source: src, value: r.metrics![metricKey] }));

    if (validMetrics.length === 0) return [];

    const bestValue = Math.min(...validMetrics.map((m) => m.value));
    return validMetrics
      .filter((m) => m.value === bestValue)
      .map((m) => m.source);
  };

  const firstChunkWinners = findWinner('firstChunkLatency');
  const totalDurationWinners = findWinner('totalDuration');
  const avgLatencyWinners = findWinner('avgChunkLatency');

  return (
    <div className="mb-2 p-1.5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg text-sm border border-blue-100/50 backdrop-blur-sm">
      <div className="flex gap-1 items-center justify-between flex-wrap">
        <MetricItem
          label="First Chunk"
          value={formatDuration(currentMetrics.firstChunkLatency)}
          isWinner={firstChunkWinners.includes(source)}
          isPlaceholder={isPlaceholder}
        />
        <MetricItem
          label="Total Time"
          value={formatDuration(currentMetrics.totalDuration)}
          isWinner={isComplete && totalDurationWinners.includes(source)}
          isPlaceholder={isPlaceholder}
        />
        <MetricItem
          label="Avg Latency"
          value={formatDuration(currentMetrics.avgChunkLatency)}
          isWinner={avgLatencyWinners.includes(source)}
          isPlaceholder={isPlaceholder}
        />
        <MetricItem
          label="Chunks"
          value={currentMetrics.chunkCount.toLocaleString()}
          isPlaceholder={isPlaceholder}
        />
        <MetricItem
          label="Tokens"
          value={currentMetrics.totalTokens.toLocaleString()}
          isPlaceholder={isPlaceholder}
        />
      </div>
    </div>
  );
};

export function GenAIChat() {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<
    Record<ResponseSource, ResponseState>
  >({
    WebSocket: { text: '' },
    SSE: { text: '' },
    rest: { text: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<GenAIClient | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get all metrics for comparison
  const allMetrics = Object.fromEntries(
    Object.entries(responses).map(([key, response]) => [key, response.metrics])
  );

  // Initialize clients and establish WebSocket connection on mount
  useEffect(() => {
    try {
      const endpoints = getEndpoints();
      clientRef.current = new GenAIClient(endpoints);

      // Pre-establish WebSocket connection
      const wsClient = clientRef.current.getWebSocketClient();
      wsClient.connect().catch((error) => {
        console.warn('Initial WebSocket connection failed:', error);
        // Don't set error state here as it's just the initial connection
      });
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

    // Reset responses
    setResponses({
      WebSocket: { text: '' },
      SSE: { text: '' },
      rest: { text: '' },
    });

    try {
      const completionStatus: Record<ResponseSource, boolean> = {
        WebSocket: false,
        SSE: false,
        rest: false,
      };

      const results = await clientRef.current.generateAll(
        { prompt: input },
        {
          onChunk: (
            source: ResponseSource,
            text: string,
            metrics?: StreamMetrics
          ) => {
            if (source in completionStatus && !completionStatus[source]) {
              setResponses((prev) => ({
                ...prev,
                [source]: {
                  ...prev[source],
                  text: prev[source].text + text,
                  ...(metrics && { metrics }),
                },
              }));
            }
          },
          onComplete: ((source: ResponseSource) => {
            console.log({ source });
            completionStatus[source] = true;

            setResponses((prev) => ({
              ...prev,
              [source]: {
                ...prev[source],
                isComplete: true,
              },
            }));

            if (Object.values(completionStatus).every((status) => status)) {
              setLoading(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }
          }) satisfies CompleteCallback,
        }
      );

      // Only update final metrics for sources that haven't completed
      results.forEach((result) => {
        const source = result.source as ResponseSource;
        if (!completionStatus[source]) {
          setResponses((prev) => ({
            ...prev,
            [source]: {
              text: result.text,
              metrics: result.metrics,
              isComplete: true,
            },
          }));
        }
      });
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 max-w-7xl flex-1 flex flex-col overflow-hidden">
        <div className="text-center my-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AWS Lambda GenAI Response Strategies
          </h1>
          <p className="text-gray-600 text-sm">
            Explore different patterns for Large Language Model responses:
            Real-time streaming with WebSocket & SSE, or single-response with
            REST
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Compare how each strategy handles AI text generation in terms of
            latency, token delivery, and overall response time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {Object.entries(responses).map(([source, response]) => (
            <div
              key={source}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-blue-100/50 transition-transform duration-300 hover:shadow-xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2 flex items-center justify-between shadow-sm">
                <h3 className="text-base font-semibold text-white capitalize">
                  {source}
                </h3>
                {loading && (
                  <div className="flex items-center text-blue-100 text-sm">
                    <div className="w-2 h-2 bg-blue-200 rounded-full mr-2 animate-ping"></div>
                    Generating...
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-2 flex flex-col h-full">
                <MetricsDisplay
                  metrics={response.metrics}
                  allMetrics={responses}
                  source={source}
                />

                <div className="flex-1 min-h-0">
                  <div className="h-full overflow-y-auto rounded-lg border border-blue-100/50 bg-white/50">
                    <div className="p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap">
                      {response.text || (
                        <span className="text-gray-400 italic animate-pulse">
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
        <div className="max-w-3xl mx-auto w-full py-4">
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
            className="bg-white rounded-xl shadow-md p-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full p-2 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
                         transition-colors duration-200 flex items-center text-sm"
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
