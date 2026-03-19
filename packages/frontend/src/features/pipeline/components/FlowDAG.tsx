import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface DAGTask {
  task_id: string;
  downstream_task_ids: string[];
  state?: 'success' | 'running' | 'failed' | 'queued' | 'none';
}

interface FlowDAGProps {
  tasks: DAGTask[];
}

const STATE_COLORS: Record<string, string> = {
  success: '#22c55e',
  running: '#3b82f6',
  failed: '#ef4444',
  queued: '#f59e0b',
  none: '#6b7280',
};

function buildGraph(tasks: DAGTask[]): { nodes: Node[]; edges: Edge[] } {
  const nodeWidth = 160;
  const nodeHeight = 40;

  const nodes: Node[] = tasks.map((t, i) => ({
    id: t.task_id,
    position: {
      x: (i % 4) * (nodeWidth + 40),
      y: Math.floor(i / 4) * (nodeHeight + 50),
    },
    data: { label: t.task_id },
    style: {
      background: STATE_COLORS[t.state ?? 'none'],
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      width: nodeWidth,
      padding: '8px',
      textAlign: 'center' as const,
    },
  }));

  const edges: Edge[] = tasks.flatMap((t) =>
    t.downstream_task_ids.map((target) => ({
      id: `${t.task_id}->${target}`,
      source: t.task_id,
      target,
      animated: t.state === 'running',
      style: { stroke: '#475569' },
    }))
  );

  return { nodes, edges };
}

export function FlowDAG({ tasks }: FlowDAGProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border text-sm text-muted-foreground">
        No DAG structure available
      </div>
    );
  }

  const { nodes, edges } = buildGraph(tasks);

  return (
    <div style={{ height: 400 }} className="rounded-lg border">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false}>
        <Background color="#94a3b8" gap={16} size={0.5} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
}
