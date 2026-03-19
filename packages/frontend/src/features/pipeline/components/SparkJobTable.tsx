import { cn } from '@/lib/utils';
import type { SparkJob } from '../types';

interface SparkJobTableProps {
  jobs: SparkJob[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SUCCEEDED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  UNKNOWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function SparkJobTable({ jobs, isLoading }: SparkJobTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No Spark jobs found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Job ID</th>
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Stages</th>
            <th className="px-3 py-2 text-left font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.jobId} className="border-b last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{job.jobId}</td>
              <td className="px-3 py-2 font-medium">{job.name}</td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    STATUS_STYLES[job.status] || STATUS_STYLES.UNKNOWN
                  )}
                >
                  {job.status}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {job.numCompletedStages}/{job.numStages}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(job.submissionTime).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
