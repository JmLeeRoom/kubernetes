import { cn } from '@/lib/utils';
import type { InferenceService } from '../types';

interface ISvcCardProps {
  service: InferenceService;
  onSelect?: (name: string) => void;
  isSelected?: boolean;
  onDelete?: (name: string) => void;
}

export function ISvcCard({ service, onSelect, isSelected, onDelete }: ISvcCardProps) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary/50',
        isSelected && 'border-primary bg-accent/50'
      )}
      onClick={() => onSelect?.(service.name)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{service.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{service.framework}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
            service.ready
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          )}
        >
          {service.ready ? 'Ready' : 'Not Ready'}
        </span>
      </div>

      {service.url && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{service.url}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>Default: {service.traffic.default}%</span>
          {service.traffic.canary > 0 && (
            <span className="text-blue-500">Canary: {service.traffic.canary}%</span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(service.name);
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
