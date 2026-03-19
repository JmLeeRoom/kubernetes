import { cn } from '@/lib/utils';
import type { FlowRun, FlowRunState } from '../types';

interface FlowRunListProps {
  runs: FlowRun[];
  isLoading?: boolean;
  onCancel?: (runId: string) => void;
}

const STATE_STYLES: Record<FlowRunState, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  SCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '-';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const sec = Math.floor((e - s) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

export function FlowRunList({ runs, isLoading, onCancel }: FlowRunListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No flow runs found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">State</th>
            <th className="px-3 py-2 text-left font-medium">Started</th>
            <th className="px-3 py-2 text-left font-medium">Duration</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{run.name}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    STATE_STYLES[run.state.type] || STATE_STYLES.PENDING
                  )}
                >
                  {run.state.type}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {run.start_time ? new Date(run.start_time).toLocaleString() : '-'}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatDuration(run.start_time, run.end_time)}
              </td>
              <td className="px-3 py-2 text-right">
                {run.state.type === 'RUNNING' && (
                  <button
                    onClick={() => onCancel?.(run.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
