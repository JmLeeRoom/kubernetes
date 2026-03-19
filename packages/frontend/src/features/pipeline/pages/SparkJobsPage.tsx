import { useState } from 'react';
import { useSparkJobs } from '../api';
import { SparkJobTable } from '../components/SparkJobTable';
import type { SparkJob } from '../types';

const STATUS_FILTERS = ['ALL', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;

export default function SparkJobsPage() {
  const { data: jobs = [], isLoading } = useSparkJobs();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = statusFilter === 'ALL'
    ? jobs
    : jobs.filter((j: SparkJob) => j.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spark Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} total jobs &middot; auto-refreshes every 30s
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <SparkJobTable jobs={filtered} isLoading={isLoading} />
    </div>
  );
}
