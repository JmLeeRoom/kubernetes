import { cn } from '@/lib/utils';
import type { Connection } from '../types';

interface ConnectionCardProps {
  connection: Connection;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onSync?: (id: string) => void;
  isSyncing?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function ConnectionCard({
  connection,
  isSelected,
  onSelect,
  onSync,
  isSyncing,
}: ConnectionCardProps) {
  const [source, destination] = connection.name.split('-to-');

  return (
    <div
      className={cn(
        'cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary/50',
        isSelected && 'border-primary bg-accent/50'
      )}
      onClick={() => onSelect?.(connection.connectionId)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{connection.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{source || 'source'}</span>
            <span className="text-xs">&rarr;</span>
            <span>{destination || 'destination'}</span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
            STATUS_STYLES[connection.status] || STATUS_STYLES.inactive
          )}
        >
          {connection.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {connection.schedule
            ? `Every ${connection.schedule.units} ${connection.schedule.timeUnit}`
            : 'Manual'}
        </span>
        {connection.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSync?.(connection.connectionId);
            }}
            disabled={isSyncing}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
