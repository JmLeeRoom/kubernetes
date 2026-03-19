import { useState } from 'react';
import { useDAGs, useDAGGraph, useDAGRuns, useTriggerDAG, useTogglePause } from '../api';
import { DAGCard } from '../components/DAGCard';
import { DAGGraphView } from '../components/DAGGraphView';
import { DAGRunsTable } from '../components/DAGRunsTable';
import { TriggerDAGDialog } from '../components/TriggerDAGDialog';

export default function DAGListPage() {
  const [selectedDagId, setSelectedDagId] = useState<string>();
  const [triggerDagId, setTriggerDagId] = useState<string>();

  const { data: dags, isLoading } = useDAGs();
  const { data: graph } = useDAGGraph(selectedDagId);
  const { data: dagRuns } = useDAGRuns(selectedDagId);
  const triggerMutation = useTriggerDAG();
  const pauseMutation = useTogglePause();

  const handleTogglePause = (dagId: string, isPaused: boolean) => {
    pauseMutation.mutate({ dagId, isPaused });
  };

  const handleTrigger = (dagId: string, conf: Record<string, unknown>) => {
    triggerMutation.mutate({ dagId, conf });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">DAG Pipelines</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dags ?? []).map((dag) => (
            <DAGCard
              key={dag.dag_id}
              dag={dag}
              isSelected={selectedDagId === dag.dag_id}
              onSelect={setSelectedDagId}
              onTogglePause={handleTogglePause}
              onTrigger={setTriggerDagId}
            />
          ))}
          {dags?.length === 0 && (
            <p className="text-muted-foreground col-span-full py-8 text-center">
              No DAGs found.
            </p>
          )}
        </div>
      )}

      {selectedDagId && graph && (
        <DAGGraphView dagId={graph.dag_id} tasks={graph.tasks} />
      )}

      {selectedDagId && (
        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Recent Runs — {selectedDagId}
          </h2>
          <DAGRunsTable runs={dagRuns ?? []} />
        </div>
      )}

      <TriggerDAGDialog
        dagId={triggerDagId ?? ''}
        open={!!triggerDagId}
        onClose={() => setTriggerDagId(undefined)}
        onTrigger={handleTrigger}
      />
    </div>
  );
}
