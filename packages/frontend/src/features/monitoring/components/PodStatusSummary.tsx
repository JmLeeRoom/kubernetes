import { cn } from '@/lib/utils';
import type { K8sPod } from '../types';

interface PodStatusSummaryProps {
  pods: K8sPod[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Running: 'bg-green-500',
  Pending: 'bg-yellow-500',
  Succeeded: 'bg-blue-500',
  Failed: 'bg-red-500',
  Unknown: 'bg-gray-500',
};

export function PodStatusSummary({ pods, isLoading }: PodStatusSummaryProps) {
  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-lg bg-muted" />;
  }

  const counts = pods.reduce<Record<string, number>>((acc, pod) => {
    acc[pod.status] = (acc[pod.status] || 0) + 1;
    return acc;
  }, {});

  const total = pods.length;

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">Pod Status</h3>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-muted">
        {Object.entries(counts).map(([status, count]) => (
          <div
            key={status}
            className={cn('h-full transition-all', STATUS_COLORS[status] || 'bg-gray-500')}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${status}: ${count}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-block h-2.5 w-2.5 rounded-full',
                STATUS_COLORS[status] || 'bg-gray-500'
              )}
            />
            <span className="text-muted-foreground">
              {status}: {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
