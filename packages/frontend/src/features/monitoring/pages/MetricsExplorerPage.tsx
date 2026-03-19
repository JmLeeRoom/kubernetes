import { useState } from 'react';
import { useMetricsRange } from '../api';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { TimeRangePicker, rangeToEpoch } from '../components/TimeRangePicker';
import type { TimeRange } from '../types';

export default function MetricsExplorerPage() {
  const [promql, setPromql] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [range, setRange] = useState<TimeRange>('1h');
  const [step, setStep] = useState('15s');

  const { start, end } = rangeToEpoch(range);
  const { data, isLoading, error } = useMetricsRange({
    query: submitted,
    start,
    end,
    step,
    enabled: !!submitted,
  });

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
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}

      {isLoading && <div className="h-80 animate-pulse rounded-lg bg-muted" />}

      {data && <TimeSeriesChart series={data.result} height={400} />}
    </div>
  );
}
