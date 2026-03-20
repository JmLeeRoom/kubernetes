import { useState } from 'react';
import { useNodes, usePods } from '../api';
import { NodeStatusGrid } from '../components/NodeStatusGrid';
import { PodStatusSummary } from '../components/PodStatusSummary';
import { ResourceUsageGauge } from '../components/ResourceUsageGauge';
import { useSSE } from '@/hooks/useSSE';
import type { K8sEvent } from '../types';

function parseResource(value: string): number {
  if (value.endsWith('m')) return parseInt(value) / 1000;
  if (value.endsWith('Gi')) return parseFloat(value);
  if (value.endsWith('Mi')) return parseFloat(value) / 1024;
  if (value.endsWith('Ki')) return parseFloat(value) / (1024 * 1024);
  return parseFloat(value) || 0;
}

export default function ClusterOverviewPage() {
  const { data: nodes = [], isLoading: nodesLoading } = useNodes();
  const { data: pods = [], isLoading: podsLoading } = usePods();
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const [events, setEvents] = useState<K8sEvent[]>([]);

  const sseUrl = eventsEnabled ? '/api/v1/monitoring/k8s/events' : null;
  useSSE<K8sEvent>(sseUrl, {
    onMessage: (event) => {
      setEvents((prev) => [event as K8sEvent, ...prev].slice(0, 100));
    },
  });

  const totalCpu = nodes.reduce((sum, n) => sum + parseResource(n.cpu_capacity), 0);
  const allocCpu = nodes.reduce((sum, n) => sum + parseResource(n.cpu_allocatable), 0);
  const usedCpu = Math.max(0, totalCpu - allocCpu);

  const totalMem = nodes.reduce((sum, n) => sum + parseResource(n.memory_capacity), 0);
  const allocMem = nodes.reduce((sum, n) => sum + parseResource(n.memory_allocatable), 0);
  const usedMem = Math.max(0, totalMem - allocMem);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cluster Overview</h1>
        <p className="text-sm text-muted-foreground">
          {nodes.length} nodes, {pods.length} pods
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResourceUsageGauge
          label="CPU"
          used={Math.round(usedCpu * 10) / 10}
          total={Math.round(totalCpu * 10) / 10}
          unit=" cores"
        />
        <ResourceUsageGauge
          label="Memory"
          used={Math.round(usedMem * 10) / 10}
          total={Math.round(totalMem * 10) / 10}
          unit=" Gi"
        />
        <PodStatusSummary pods={pods} isLoading={podsLoading} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Nodes</h2>
        <NodeStatusGrid nodes={nodes} isLoading={nodesLoading} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cluster Events</h2>
          <button
            onClick={() => {
              setEventsEnabled((v) => !v);
              if (eventsEnabled) setEvents([]);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              eventsEnabled
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {eventsEnabled ? 'Streaming...' : 'Start Stream'}
          </button>
        </div>
        {events.length > 0 ? (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-3">
            {events.map((evt, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="shrink-0 text-muted-foreground">
                  {evt.involvedObject?.kind}/{evt.involvedObject?.name}
                </span>
                <span className="font-medium">{evt.reason}</span>
                <span className="truncate text-muted-foreground">{evt.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              {eventsEnabled ? 'Waiting for events...' : 'Click "Start Stream" to watch cluster events'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
