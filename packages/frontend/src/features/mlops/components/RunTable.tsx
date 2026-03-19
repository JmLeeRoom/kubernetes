import type { Run } from '../types';

const STATUS_COLORS: Record<string, string> = {
  FINISHED: 'bg-green-100 text-green-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  KILLED: 'bg-gray-100 text-gray-800',
};

interface RunTableProps {
  runs: Run[];
  selectedRunIds: Set<string>;
  onToggleRun: (runId: string) => void;
}

export function RunTable({ runs, selectedRunIds, onToggleRun }: RunTableProps) {
  const allParamKeys = [...new Set(runs.flatMap((r) => Object.keys(r.params)))];
  const allMetricKeys = [...new Set(runs.flatMap((r) => Object.keys(r.metrics)))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-2 w-8" />
            <th className="p-2">Run ID</th>
            <th className="p-2">Status</th>
            <th className="p-2">Started</th>
            {allParamKeys.map((k) => (
              <th key={`p-${k}`} className="p-2">
                {k}
              </th>
            ))}
            {allMetricKeys.map((k) => (
              <th key={`m-${k}`} className="p-2">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.run_id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedRunIds.has(run.run_id)}
                  onChange={() => onToggleRun(run.run_id)}
                  className="rounded"
                />
              </td>
              <td className="p-2 font-mono text-xs">{run.run_id.slice(0, 8)}</td>
              <td className="p-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_COLORS[run.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {run.status}
                </span>
              </td>
              <td className="p-2 text-xs">
                {new Date(run.start_time).toLocaleString()}
              </td>
              {allParamKeys.map((k) => (
                <td key={`p-${k}`} className="p-2 text-xs">
                  {run.params[k] ?? '-'}
                </td>
              ))}
              {allMetricKeys.map((k) => (
                <td key={`m-${k}`} className="p-2 text-xs font-mono">
                  {run.metrics[k] != null ? Number(run.metrics[k]).toFixed(4) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {runs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No runs found. Select an experiment to view its runs.
        </p>
      )}
    </div>
  );
}
