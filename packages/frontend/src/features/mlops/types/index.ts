export interface Experiment {
  experiment_id: string;
  name: string;
  artifact_location: string;
  lifecycle_stage: string;
  tags: Record<string, string>;
}

export interface Run {
  run_id: string;
  experiment_id: string;
  status: string;
  start_time: number;
  end_time: number | null;
  metrics: Record<string, number>;
  params: Record<string, string>;
  tags: Record<string, string>;
}

export interface RegisteredModel {
  name: string;
  latest_versions: ModelVersion[];
  description: string | null;
  tags: Record<string, string>;
}

export interface ModelVersion {
  name: string;
  version: string;
  current_stage: string;
  status: string;
  source: string;
  run_id: string | null;
}

export interface DAG {
  dag_id: string;
  description: string | null;
  is_paused: boolean;
  is_active: boolean;
  schedule_interval: string | null;
  next_dagrun: string | null;
}

export interface DAGRun {
  dag_run_id: string;
  dag_id: string;
  state: string;
  execution_date: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface DAGTask {
  task_id: string;
  downstream_task_ids: string[];
  task_type: string | null;
}

export interface DAGGraph {
  dag_id: string;
  tasks: DAGTask[];
}
