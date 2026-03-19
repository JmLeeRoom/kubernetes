export interface InferenceService {
  name: string;
  namespace: string;
  framework: string;
  ready: boolean;
  url: string;
  traffic: {
    default: number;
    canary: number;
  };
  created: string;
}

export interface InferenceServiceSpec {
  name: string;
  framework: 'sklearn' | 'pytorch' | 'tensorflow' | 'onnx' | 'xgboost';
  model_uri: string;
  min_replicas?: number;
  max_replicas?: number;
  cpu_request?: string;
  cpu_limit?: string;
  memory_request?: string;
  memory_limit?: string;
  canary_percent?: number;
}

export interface ServiceMetrics {
  name: string;
  metrics: {
    rps: number;
    latency_p99_ms: number;
  };
}

export interface CanaryStatus {
  name: string;
  canary_percent: number;
  default_percent: number;
  canary_ready: boolean;
}
