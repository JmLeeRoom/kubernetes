import { useState } from 'react';
import { useExperiments, useExperimentRuns, useCompareRuns } from '../api';
import { ExperimentList } from '../components/ExperimentList';
import { RunTable } from '../components/RunTable';
import { RunCompareTable } from '../components/RunCompareTable';
import { MetricChart } from '../components/MetricChart';
import type { Run } from '../types';

export default function ExperimentsPage() {
  const [selectedExpId, setSelectedExpId] = useState<string>();
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
  const [comparedRuns, setComparedRuns] = useState<Run[]>([]);

  const { data: experiments, isLoading: loadingExps } = useExperiments();
  const { data: runs } = useExperimentRuns(selectedExpId);
  const compareMutation = useCompareRuns();

  const handleToggleRun = (runId: string) => {
    setSelectedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  const handleCompare = () => {
    const ids = [...selectedRunIds];
    if (ids.length < 2) return;
    compareMutation.mutate(ids, {
      onSuccess: (data) => setComparedRuns(data),
    });
  };

  const metricKeys = runs
    ? [...new Set(runs.flatMap((r) => Object.keys(r.metrics)))]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Experiments</h1>
        {selectedRunIds.size >= 2 && (
          <button
            onClick={handleCompare}
            disabled={compareMutation.isPending}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {compareMutation.isPending ? 'Comparing...' : `Compare ${selectedRunIds.size} Runs`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-3">
            Experiments
          </h2>
          {loadingExps ? (
            <div className="space-y-2 px-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <ExperimentList
              experiments={experiments ?? []}
              selectedId={selectedExpId}
              onSelect={(id) => {
                setSelectedExpId(id);
                setSelectedRunIds(new Set());
                setComparedRuns([]);
              }}
            />
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Runs</h2>
            <RunTable
              runs={runs ?? []}
              selectedRunIds={selectedRunIds}
              onToggleRun={handleToggleRun}
            />
          </div>

          {comparedRuns.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Run Comparison
              </h2>
              <RunCompareTable runs={comparedRuns} />
            </div>
          )}

          {runs && runs.length > 0 && metricKeys.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Metric Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricKeys.slice(0, 6).map((key) => (
                  <MetricChart
                    key={key}
                    label={key}
                    values={runs.map((r) => r.metrics[key]).filter((v) => v != null)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
