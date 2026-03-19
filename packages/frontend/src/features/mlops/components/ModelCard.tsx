import type { RegisteredModel } from '../types';

const STAGE_COLORS: Record<string, string> = {
  Production: 'bg-green-100 text-green-800',
  Staging: 'bg-yellow-100 text-yellow-800',
  Archived: 'bg-gray-100 text-gray-800',
  None: 'bg-blue-100 text-blue-800',
};

interface ModelCardProps {
  model: RegisteredModel;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const latestVersion = model.latest_versions?.[0];

  return (
    <button
      onClick={() => onSelect(model.name)}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold truncate">{model.name}</h3>
        {latestVersion && (
          <span
            className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              STAGE_COLORS[latestVersion.current_stage] ?? STAGE_COLORS.None
            }`}
          >
            {latestVersion.current_stage}
          </span>
        )}
      </div>
      {model.description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{model.description}</p>
      )}
      <div className="mt-2 text-xs text-muted-foreground">
        {model.latest_versions.length} version{model.latest_versions.length !== 1 ? 's' : ''}
      </div>
    </button>
  );
}
