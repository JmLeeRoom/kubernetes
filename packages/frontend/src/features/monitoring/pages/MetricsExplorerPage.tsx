import { useState, useMemo } from 'react';
import { useMetricsRange } from '../api';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { TimeRangePicker, rangeToEpoch } from '../components/TimeRangePicker';
import { useSSE } from '@/hooks/useSSE';
import type { MetricsRangeResult, TimeRange } from '../types';

export default function MetricsExplorerPage() {
  const [promql, setPromql] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [range, setRange] = useState<TimeRange>('1h');
  const [step, setStep] = useState('15s');
  const [liveMode, setLiveMode] = useState(false);

  const { start, end } = rangeToEpoch(range);
  const { data, isLoading, error } = useMetricsRange({
    query: submitted,
    start,
    end,
    step,
    enabled: !!submitted && !liveMode,
  });

  const sseUrl = useMemo(
    () =>
      liveMode && submitted
        ? `/api/v1/monitoring/metrics/stream?query=${encodeURIComponent(submitted)}&interval=5`
        : null,
    [liveMode, submitted]
  );
  const { data: liveData } = useSSE<MetricsRangeResult>(sseUrl);

  const chartData = liveMode ? liveData : data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metrics Explorer</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="promql" className="mb-1 block text-sm font-medium">
            PromQL Query
          </label>
          <div className="flex gap-2">
            <input
              id="promql"
              type="text"
              value={promql}
              onChange={(e) => setPromql(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSubmitted(promql)}
              placeholder='e.g. rate(http_requests_total[5m])'
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <button
              onClick={() => setSubmitted(promql)}
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Run
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TimeRangePicker value={range} onChange={setRange} />
          <select
            value={step}
            onChange={(e) => setStep(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="15s">15s</option>
            <option value="30s">30s</option>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
          </select>
          <button
            onClick={() => setLiveMode((v) => !v)}
            disabled={!submitted}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              liveMode
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {liveMode ? 'Live' : 'Static'}
          </button>
        </div>
      </div>

      {error && !liveMode && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}

      {isLoading && !liveMode && <div className="h-80 animate-pulse rounded-lg bg-muted" />}

      {chartData && <TimeSeriesChart series={chartData.result} height={400} />}
    </div>
  );
}
