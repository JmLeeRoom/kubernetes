import { useState, useMemo } from 'react';
import { useLogs } from '../api';
import { LogViewer } from '../components/LogViewer';
import { TimeRangePicker, rangeToEpoch } from '../components/TimeRangePicker';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { LogStreamMessage, TimeRange } from '../types';

function buildWsUrl(query: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/v1/monitoring/logs/stream?query=${encodeURIComponent(query)}`;
}

export default function LogViewerPage() {
  const [logql, setLogql] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [range, setRange] = useState<TimeRange>('1h');
  const [limit, setLimit] = useState(500);
  const [streaming, setStreaming] = useState(false);

  const { start, end } = rangeToEpoch(range);
  const { data, isLoading, error } = useLogs({
    query: submitted,
    start,
    end,
    limit,
    enabled: !!submitted && !streaming,
  });

  const wsUrl = useMemo(
    () => (streaming && submitted ? buildWsUrl(submitted) : null),
    [streaming, submitted]
  );
  const { messages: streamMessages, status: wsStatus } = useWebSocket<LogStreamMessage>(wsUrl);

  const latestStreamData = streamMessages.length > 0 ? streamMessages[streamMessages.length - 1] : null;
  const viewerData = streaming && latestStreamData?.data ? { status: 'success', data: latestStreamData.data } : data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Log Viewer</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="logql" className="mb-1 block text-sm font-medium">
            LogQL Query
          </label>
          <div className="flex gap-2">
            <input
              id="logql"
              type="text"
              value={logql}
              onChange={(e) => setLogql(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSubmitted(logql)}
              placeholder='{namespace="mlops-system"}'
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <button
              onClick={() => setSubmitted(logql)}
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TimeRangePicker value={range} onChange={setRange} />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={5000}>5000</option>
          </select>
          <button
            onClick={() => setStreaming((v) => !v)}
            disabled={!submitted}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              streaming
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {streaming ? `Tail (${wsStatus})` : 'Tail'}
          </button>
        </div>
      </div>

      {error && !streaming && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}

      <LogViewer data={viewerData} isLoading={isLoading && !streaming} />
    </div>
  );
}
