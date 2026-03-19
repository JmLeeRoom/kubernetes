import type { DAGRun } from '../types';

const STATE_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800',
  queued: 'bg-yellow-100 text-yellow-800',
};

interface DAGRunsTableProps {
  runs: DAGRun[];
}

export function DAGRunsTable({ runs }: DAGRunsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-2">Run ID</th>
            <th className="p-2">State</th>
            <th className="p-2">Execution Date</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.dag_run_id} className="border-b hover:bg-muted/50">
              <td className="p-2 font-mono text-xs">{run.dag_run_id}</td>
              <td className="p-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATE_COLORS[run.state] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {run.state}
                </span>
              </td>
              <td className="p-2 text-xs">
                {run.execution_date
                  ? new Date(run.execution_date).toLocaleString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {runs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No runs found.</p>
      )}
    </div>
  );
}
