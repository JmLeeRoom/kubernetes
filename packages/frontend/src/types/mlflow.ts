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
  status: 'RUNNING' | 'FINISHED' | 'FAILED' | 'KILLED';
  start_time: number;
  end_time?: number;
  metrics: Record<string, number>;
  params: Record<string, string>;
  tags: Record<string, string>;
}

export interface RegisteredModel {
  name: string;
  latest_versions: ModelVersion[];
  description?: string;
  tags: Record<string, string>;
}

export interface ModelVersion {
  version: string;
  current_stage: 'None' | 'Staging' | 'Production' | 'Archived';
  status: string;
  source: string;
  run_id: string;
}
