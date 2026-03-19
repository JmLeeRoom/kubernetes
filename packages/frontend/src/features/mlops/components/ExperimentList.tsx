import type { Experiment } from '../types';

interface ExperimentListProps {
  experiments: Experiment[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

export function ExperimentList({ experiments, selectedId, onSelect }: ExperimentListProps) {
  return (
    <div className="space-y-1">
      {experiments.map((exp) => (
        <button
          key={exp.experiment_id}
          onClick={() => onSelect(exp.experiment_id)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selectedId === exp.experiment_id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <div className="font-medium truncate">{exp.name}</div>
          <div className="text-xs opacity-70 flex items-center gap-2 mt-0.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                exp.lifecycle_stage === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            {exp.lifecycle_stage}
          </div>
        </button>
      ))}
      {experiments.length === 0 && (
        <p className="text-sm text-muted-foreground px-3 py-4">No experiments found.</p>
      )}
    </div>
  );
}
