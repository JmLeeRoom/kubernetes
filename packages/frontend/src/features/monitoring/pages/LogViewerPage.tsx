import { useState } from 'react';
import { useLogs } from '../api';
import { LogViewer } from '../components/LogViewer';
import { TimeRangePicker, rangeToEpoch } from '../components/TimeRangePicker';
import type { TimeRange } from '../types';

export default function LogViewerPage() {
  const [logql, setLogql] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [range, setRange] = useState<TimeRange>('1h');
  const [limit, setLimit] = useState(500);

  const { start, end } = rangeToEpoch(range);
  const { data, isLoading, error } = useLogs({
    query: submitted,
    start,
    end,
    limit,
    enabled: !!submitted,
  });

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
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}

      <LogViewer data={data} isLoading={isLoading} />
    </div>
  );
}
