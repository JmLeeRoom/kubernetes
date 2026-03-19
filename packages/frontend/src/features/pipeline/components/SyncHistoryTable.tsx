import { cn } from '@/lib/utils';
import type { SyncJob } from '../types';

interface SyncHistoryTableProps {
  jobs: SyncJob[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  succeeded: 'text-green-600 dark:text-green-400',
  running: 'text-blue-600 dark:text-blue-400',
  failed: 'text-red-600 dark:text-red-400',
  pending: 'text-yellow-600 dark:text-yellow-400',
  cancelled: 'text-gray-600 dark:text-gray-400',
};

export function SyncHistoryTable({ jobs, isLoading }: SyncHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No sync history.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Job ID</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Records</th>
            <th className="px-3 py-2 text-left font-medium">Bytes</th>
            <th className="px-3 py-2 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const attempt = job.attempts?.[0];
            return (
              <tr key={job.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{job.id}</td>
                <td className={cn('px-3 py-2 font-medium', STATUS_STYLES[job.status])}>
                  {job.status}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {attempt?.recordsSynced?.toLocaleString() ?? '-'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {attempt?.bytesSynced
                    ? `${(attempt.bytesSynced / 1024 / 1024).toFixed(1)} MB`
                    : '-'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
