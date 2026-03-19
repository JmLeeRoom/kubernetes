import { useState } from 'react';
import { useFlows, useFlowRuns, useCancelFlowRun } from '../api';
import { FlowRunList } from '../components/FlowRunList';
import { cn } from '@/lib/utils';

export default function FlowsPage() {
  const { data: flows = [], isLoading: flowsLoading } = useFlows();
  const [selectedFlowId, setSelectedFlowId] = useState<string>();
  const { data: runs = [], isLoading: runsLoading } = useFlowRuns(selectedFlowId);
  const cancelMutation = useCancelFlowRun();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flows</h1>
        <p className="text-sm text-muted-foreground">
          Prefect flows and run history
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Flows</h2>
          {flowsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))
          ) : flows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flows found.</p>
          ) : (
            flows.map((flow) => (
              <button
                key={flow.id}
                onClick={() => setSelectedFlowId(flow.id)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50',
                  selectedFlowId === flow.id && 'border-primary bg-accent/50'
                )}
              >
                <p className="font-medium">{flow.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  {flow.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {new Date(flow.created).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            Flow Runs {selectedFlowId ? '' : '(All)'}
          </h2>
          <FlowRunList
            runs={runs}
            isLoading={runsLoading}
            onCancel={(id) => cancelMutation.mutate(id)}
          />
        </div>
      </div>
    </div>
  );
}
