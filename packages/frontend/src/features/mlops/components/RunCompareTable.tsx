import type { Run } from '../types';

interface RunCompareTableProps {
  runs: Run[];
}

export function RunCompareTable({ runs }: RunCompareTableProps) {
  if (runs.length === 0) return null;

  const allParamKeys = [...new Set(runs.flatMap((r) => Object.keys(r.params)))];
  const allMetricKeys = [...new Set(runs.flatMap((r) => Object.keys(r.metrics)))];

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left text-muted-foreground font-medium">Property</th>
            {runs.map((r) => (
              <th key={r.run_id} className="p-2 text-left font-mono text-xs">
                {r.run_id.slice(0, 8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-medium text-muted-foreground">Status</td>
            {runs.map((r) => (
              <td key={r.run_id} className="p-2">
                {r.status}
              </td>
            ))}
          </tr>
          {allParamKeys.length > 0 && (
            <tr className="border-b bg-muted/30">
              <td colSpan={runs.length + 1} className="p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parameters
              </td>
            </tr>
          )}
          {allParamKeys.map((key) => (
            <tr key={`p-${key}`} className="border-b">
              <td className="p-2 text-muted-foreground">{key}</td>
              {runs.map((r) => (
                <td key={r.run_id} className="p-2 font-mono text-xs">
                  {r.params[key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
          {allMetricKeys.length > 0 && (
            <tr className="border-b bg-muted/30">
              <td colSpan={runs.length + 1} className="p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metrics
              </td>
            </tr>
          )}
          {allMetricKeys.map((key) => {
            const values = runs.map((r) => r.metrics[key]);
            const best = Math.max(...values.filter((v) => v != null));
            return (
              <tr key={`m-${key}`} className="border-b">
                <td className="p-2 text-muted-foreground">{key}</td>
                {runs.map((r) => {
                  const val = r.metrics[key];
                  const isBest = val === best;
                  return (
                    <td
                      key={r.run_id}
                      className={`p-2 font-mono text-xs ${isBest ? 'font-bold text-green-600' : ''}`}
                    >
                      {val != null ? Number(val).toFixed(4) : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
