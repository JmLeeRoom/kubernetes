import { useState } from 'react';
import { useConnections, useConnectionJobs, useTriggerSync } from '../api';
import { ConnectionCard } from '../components/ConnectionCard';
import { SyncHistoryTable } from '../components/SyncHistoryTable';

export default function ConnectionsPage() {
  const { data: connections = [], isLoading } = useConnections();
  const [selectedId, setSelectedId] = useState<string>();
  const syncMutation = useTriggerSync();
  const { data: jobs = [], isLoading: jobsLoading } = useConnectionJobs(selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-sm text-muted-foreground">
          {connections.length} Airbyte connections
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.connectionId}
              connection={conn}
              isSelected={selectedId === conn.connectionId}
              onSelect={setSelectedId}
              onSync={(id) => syncMutation.mutate(id)}
              isSyncing={syncMutation.isPending}
            />
          ))}
        </div>
      )}

      {selectedId && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Sync History</h2>
          <SyncHistoryTable jobs={jobs} isLoading={jobsLoading} />
        </div>
      )}
    </div>
  );
}
