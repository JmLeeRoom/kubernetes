import { cn } from '@/lib/utils';
import type { K8sNode } from '../types';

interface NodeStatusGridProps {
  nodes: K8sNode[];
  isLoading?: boolean;
}

export function NodeStatusGrid({ nodes, isLoading }: NodeStatusGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No nodes found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node, idx) => (
        <div
          key={`${node.name}-${idx}`}
          className={cn(
            'rounded-lg border p-4 transition-colors',
            node.status === 'Ready'
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-red-500/30 bg-red-500/5'
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="truncate font-medium" title={node.name}>
              {node.name}
            </h3>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                node.status === 'Ready'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {node.status}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>Roles: {node.roles.length > 0 ? node.roles.join(', ') : 'worker'}</p>
            <p>CPU: {node.cpu_allocatable} / {node.cpu_capacity}</p>
            <p>Memory: {node.memory_allocatable} / {node.memory_capacity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
