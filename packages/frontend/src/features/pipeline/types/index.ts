export interface Connection {
  connectionId: string;
  name: string;
  status: 'active' | 'inactive' | 'deprecated';
  sourceId: string;
  destinationId: string;
  schedule: { units: number; timeUnit: string } | null;
}

export interface SyncJob {
  id: number;
  configId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  attempts?: Array<{
    id: number;
    status: string;
    bytesSynced: number;
    recordsSynced: number;
  }>;
}

export interface Flow {
  id: string;
  name: string;
  created: string;
  tags: string[];
}

export interface FlowRun {
  id: string;
  name: string;
  flow_id: string;
  state: {
    type: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'CANCELLED' | 'PENDING' | 'SCHEDULED';
  };
  start_time: string | null;
  end_time: string | null;
}

export interface SparkJob {
  jobId: number;
  name: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
  submissionTime: string;
  completionTime?: string;
  numTasks: number;
  numCompletedTasks: number;
  numStages: number;
  numCompletedStages: number;
}

export type FlowRunState = FlowRun['state']['type'];
