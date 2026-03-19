import type { ModelVersion } from '../types';

const STAGE_COLORS: Record<string, string> = {
  Production: 'bg-green-100 text-green-800',
  Staging: 'bg-yellow-100 text-yellow-800',
  Archived: 'bg-gray-100 text-gray-800',
  None: 'bg-blue-100 text-blue-800',
};

const STAGES = ['None', 'Staging', 'Production', 'Archived'];

interface VersionTableProps {
  versions: ModelVersion[];
  onTransition: (name: string, version: string, stage: string) => void;
}

export function VersionTable({ versions, onTransition }: VersionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-2">Version</th>
            <th className="p-2">Stage</th>
            <th className="p-2">Status</th>
            <th className="p-2">Source</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.version} className="border-b hover:bg-muted/50">
              <td className="p-2 font-mono">v{v.version}</td>
              <td className="p-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    STAGE_COLORS[v.current_stage] ?? STAGE_COLORS.None
                  }`}
                >
                  {v.current_stage}
                </span>
              </td>
              <td className="p-2 text-xs">{v.status}</td>
              <td className="p-2 font-mono text-xs truncate max-w-[200px]">{v.source}</td>
              <td className="p-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onTransition(v.name, v.version, e.target.value);
                    }
                  }}
                  className="text-xs border rounded px-2 py-1 bg-background"
                >
                  <option value="">Move to...</option>
                  {STAGES.filter((s) => s !== v.current_stage).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {versions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No versions found.</p>
      )}
    </div>
  );
}
