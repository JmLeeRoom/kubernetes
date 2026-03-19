import { useNodes, usePods } from '../api';
import { NodeStatusGrid } from '../components/NodeStatusGrid';
import { PodStatusSummary } from '../components/PodStatusSummary';
import { ResourceUsageGauge } from '../components/ResourceUsageGauge';

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
    </div>
  );
}
