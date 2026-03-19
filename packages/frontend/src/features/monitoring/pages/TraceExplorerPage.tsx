import { useState } from 'react';
import { useTraceSearch } from '../api';
import { TraceTimeline } from '../components/TraceTimeline';

export default function TraceExplorerPage() {
  const [serviceName, setServiceName] = useState('');
  const [operation, setOperation] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [searching, setSearching] = useState(false);

  const { data, isLoading, error } = useTraceSearch({
    serviceName: serviceName || undefined,
    operation: operation || undefined,
    minDuration: minDuration || undefined,
    enabled: searching,
  });

  const handleSearch = () => setSearching(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trace Explorer</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="svc" className="mb-1 block text-sm font-medium">
            Service
          </label>
          <input
            id="svc"
            type="text"
            value={serviceName}
            onChange={(e) => { setServiceName(e.target.value); setSearching(false); }}
            placeholder="e.g. api-gateway"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="op" className="mb-1 block text-sm font-medium">
            Operation
          </label>
          <input
            id="op"
            type="text"
            value={operation}
            onChange={(e) => { setOperation(e.target.value); setSearching(false); }}
            placeholder="e.g. GET /health"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="dur" className="mb-1 block text-sm font-medium">
            Min Duration
          </label>
          <input
            id="dur"
            type="text"
            value={minDuration}
            onChange={(e) => { setMinDuration(e.target.value); setSearching(false); }}
            placeholder="e.g. 100ms"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Search Traces
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}

      <TraceTimeline traces={data?.traces ?? []} isLoading={isLoading} />
    </div>
  );
}
