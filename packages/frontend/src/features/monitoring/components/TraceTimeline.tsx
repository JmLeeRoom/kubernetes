import { cn } from '@/lib/utils';
import type { TraceSummary } from '../types';

interface TraceTimelineProps {
  traces: TraceSummary[];
  isLoading?: boolean;
  onSelect?: (traceId: string) => void;
}

export function TraceTimeline({ traces, isLoading, onSelect }: TraceTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (traces.length === 0) {
    return <p className="text-sm text-muted-foreground">No traces found.</p>;
  }

  const maxDuration = Math.max(...traces.map((t) => t.durationMs));

  return (
    <div className="space-y-2">
      {traces.map((trace) => {
        const pct = maxDuration > 0 ? (trace.durationMs / maxDuration) * 100 : 0;
        return (
          <button
            key={trace.traceID}
            onClick={() => onSelect?.(trace.traceID)}
            className={cn(
              'flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors',
              'hover:border-primary/50 hover:bg-accent'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {trace.rootServiceName}{' '}
                <span className="font-normal text-muted-foreground">
                  {trace.rootTraceName}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {trace.traceID.slice(0, 16)}...
              </p>
            </div>
            <div className="w-48 shrink-0">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(trace.startTimeUnixNano / 1e6).toLocaleTimeString()}
                </span>
                <span className="font-medium">{trace.durationMs.toFixed(1)} ms</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    trace.durationMs > 1000 ? 'bg-red-500' : trace.durationMs > 500 ? 'bg-yellow-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
