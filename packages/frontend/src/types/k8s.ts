export interface K8sNode {
  name: string;
  status: 'Ready' | 'NotReady';
  cpu: { capacity: string; allocatable: string; usage: string };
  memory: { capacity: string; allocatable: string; usage: string };
  roles: string[];
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown';
  node: string;
  restarts: number;
  age: string;
}

export interface K8sEvent {
  type: string;
  object: {
    reason: string;
    message: string;
    namespace: string;
    name: string;
  };
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'firing' | 'resolved';
  summary: string;
}
