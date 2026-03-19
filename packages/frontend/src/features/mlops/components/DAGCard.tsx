import type { DAG } from '../types';

interface DAGCardProps {
  dag: DAG;
  isSelected: boolean;
  onSelect: (dagId: string) => void;
  onTogglePause: (dagId: string, isPaused: boolean) => void;
  onTrigger: (dagId: string) => void;
}

export function DAGCard({ dag, isSelected, onSelect, onTogglePause, onTrigger }: DAGCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={() => onSelect(dag.dag_id)}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-sm truncate">{dag.dag_id}</h3>
        <span
          className={`shrink-0 ml-2 inline-block w-2 h-2 rounded-full mt-1.5 ${
            dag.is_paused ? 'bg-yellow-500' : dag.is_active ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={dag.is_paused ? 'Paused' : dag.is_active ? 'Active' : 'Inactive'}
        />
      </div>

      {dag.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{dag.description}</p>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        {dag.schedule_interval ?? 'No schedule'}
      </div>

      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onTogglePause(dag.dag_id, !dag.is_paused)}
          className={`text-xs px-2 py-1 rounded border transition-colors ${
            dag.is_paused
              ? 'border-green-300 text-green-700 hover:bg-green-50'
              : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
          }`}
        >
          {dag.is_paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => onTrigger(dag.dag_id)}
          className="text-xs px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
        >
          Trigger
        </button>
      </div>
    </div>
  );
}
