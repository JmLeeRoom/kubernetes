import { useState } from 'react';
import { useInferenceServices } from '../api';
import { TrafficSlider } from '../components/TrafficSlider';
import { MetricsPreview } from '../components/MetricsPreview';
import { cn } from '@/lib/utils';

export default function TrafficSplitPage() {
  const { data: services = [], isLoading } = useInferenceServices();
  const [selectedName, setSelectedName] = useState<string>();

  const selected = services.find((s) => s.name === selectedName);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Traffic Split</h1>
        <p className="text-sm text-muted-foreground">
          Manage canary deployments and traffic routing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            Models
          </h2>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))
          ) : (
            services.map((svc) => (
              <button
                key={svc.name}
                onClick={() => setSelectedName(svc.name)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50',
                  selectedName === svc.name && 'border-primary bg-accent/50'
                )}
              >
                <p className="font-medium">{svc.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{svc.framework}</span>
                  <span>&middot;</span>
                  <span
                    className={svc.ready ? 'text-green-500' : 'text-yellow-500'}
                  >
                    {svc.ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Traffic: {selected.name}
                </h2>
                <TrafficSlider
                  name={selected.name}
                  currentCanary={selected.traffic.canary}
                />
              </div>
              <div>
                <h2 className="mb-3 text-lg font-semibold">Performance</h2>
                <MetricsPreview name={selected.name} />
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                Select a model to configure traffic split
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
