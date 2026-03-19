export interface K8sNode {
  name: string;
  status: 'Ready' | 'NotReady' | 'Unknown';
  roles: string[];
  cpu_capacity: string;
  memory_capacity: string;
  cpu_allocatable: string;
  memory_allocatable: string;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown';
  node: string;
  containers: string[];
  restarts: number;
}

export interface MetricSeries {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface MetricsRangeResult {
  resultType: 'matrix' | 'vector';
  result: MetricSeries[];
}

export interface LogEntry {
  timestamp: string;
  line: string;
  labels: Record<string, string>;
}

export interface LogQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      stream: Record<string, string>;
      values: [string, string][];
    }>;
  };
}

export interface TraceSpan {
  traceID: string;
  spanID: string;
  operationName: string;
  serviceName: string;
  duration: number;
  startTime: number;
  tags: Record<string, string>;
}

export interface TraceSummary {
  traceID: string;
  rootServiceName: string;
  rootTraceName: string;
  startTimeUnixNano: number;
  durationMs: number;
  spanSets?: Array<{ spans: TraceSpan[] }>;
}

export interface TraceSearchResult {
  traces: TraceSummary[];
}

export interface TraceDetail {
  batches: Array<{
    resource: { attributes: Array<{ key: string; value: { stringValue?: string } }> };
    scopeSpans: Array<{
      spans: Array<{
        traceId: string;
        spanId: string;
        parentSpanId?: string;
        name: string;
        startTimeUnixNano: string;
        endTimeUnixNano: string;
        attributes: Array<{ key: string; value: { stringValue?: string } }>;
      }>;
    }>;
  }>;
}

export interface Alert {
  alertname: string;
  severity: 'critical' | 'warning' | 'info';
  state: string;
  labels: Record<string, string>;
  value: string | null;
}

export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d';
