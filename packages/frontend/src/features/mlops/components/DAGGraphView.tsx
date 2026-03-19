import type { DAGTask } from '../types';

const TYPE_COLORS: Record<string, string> = {
  PythonOperator: 'bg-blue-50 border-blue-300',
  BranchOperator: 'bg-purple-50 border-purple-300',
  EmailOperator: 'bg-orange-50 border-orange-300',
};

interface DAGGraphViewProps {
  dagId: string;
  tasks: DAGTask[];
}

function buildLevels(tasks: DAGTask[]): DAGTask[][] {
  const taskMap = new Map(tasks.map((t) => [t.task_id, t]));
  const inDegree = new Map<string, number>();
  tasks.forEach((t) => inDegree.set(t.task_id, 0));
  tasks.forEach((t) =>
    t.downstream_task_ids.forEach((d) =>
      inDegree.set(d, (inDegree.get(d) ?? 0) + 1)
    )
  );

  const levels: DAGTask[][] = [];
  const remaining = new Set(tasks.map((t) => t.task_id));

  while (remaining.size > 0) {
    const level = [...remaining].filter((id) => (inDegree.get(id) ?? 0) === 0);
    if (level.length === 0) break;
    levels.push(level.map((id) => taskMap.get(id)!));
    level.forEach((id) => {
      remaining.delete(id);
      const task = taskMap.get(id);
      task?.downstream_task_ids.forEach((d) =>
        inDegree.set(d, (inDegree.get(d) ?? 0) - 1)
      );
    });
  }
  return levels;
}

export function DAGGraphView({ dagId, tasks }: DAGGraphViewProps) {
  const levels = buildLevels(tasks);

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-4">{dagId} Graph</h4>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {levels.map((level, li) => (
          <div key={li} className="flex flex-col gap-2 items-center">
            {level.map((task) => (
              <div
                key={task.task_id}
                className={`px-3 py-2 rounded border text-xs font-medium min-w-[120px] text-center ${
                  TYPE_COLORS[task.task_type ?? ''] ?? 'bg-gray-50 border-gray-300'
                }`}
              >
                <div>{task.task_id}</div>
                {task.task_type && (
                  <div className="text-[10px] opacity-60 mt-0.5">{task.task_type}</div>
                )}
              </div>
            ))}
            {li < levels.length - 1 && (
              <div className="text-muted-foreground text-lg">→</div>
            )}
          </div>
        ))}
      </div>
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No tasks found.</p>
      )}
    </div>
  );
}
