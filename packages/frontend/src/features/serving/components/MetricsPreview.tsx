import { useServiceMetrics } from '../api';

interface MetricsPreviewProps {
  name: string | undefined;
}

export function MetricsPreview({ name }: MetricsPreviewProps) {
  const { data, isLoading } = useServiceMetrics(name);

  if (!name) {
    return (
      <p className="text-sm text-muted-foreground">Select a model to view metrics.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const rps = data?.metrics.rps ?? 0;
  const latency = data?.metrics.latency_p99_ms ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Requests/sec</p>
        <p className="mt-1 text-2xl font-bold">{rps.toFixed(1)}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Latency P99</p>
        <p className="mt-1 text-2xl font-bold">{latency.toFixed(0)} ms</p>
      </div>
    </div>
  );
}
