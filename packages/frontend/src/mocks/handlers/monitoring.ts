import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

const generateNode = () => ({
  name: faker.helpers.arrayElement(['node-01', 'node-02', 'node-03']),
  status: faker.helpers.arrayElement(['Ready', 'Ready', 'NotReady']) as 'Ready' | 'NotReady',
  roles: ['worker'],
  cpu_capacity: '4',
  memory_capacity: '16Gi',
  cpu_allocatable: '3800m',
  memory_allocatable: '15Gi',
});

const generatePod = () => ({
  name: `${faker.word.adjective()}-${faker.string.alphanumeric(5)}`,
  namespace: faker.helpers.arrayElement(['mlops-system', 'monitoring', 'default']),
  status: faker.helpers.arrayElement(['Running', 'Running', 'Pending', 'Failed']) as
    | 'Running'
    | 'Pending'
    | 'Failed',
  node: faker.helpers.arrayElement(['node-01', 'node-02', 'node-03']),
  containers: ['main'],
  restarts: faker.number.int({ min: 0, max: 5 }),
});

export const monitoringHandlers = [
  http.get('/api/v1/k8s/nodes', () => HttpResponse.json(Array.from({ length: 3 }, generateNode))),

  http.get('/api/v1/k8s/pods', () => HttpResponse.json(Array.from({ length: 10 }, generatePod))),

  http.get('/api/v1/metrics/query_range', () =>
    HttpResponse.json({
      resultType: 'matrix',
      result: [
        {
          metric: { __name__: 'cpu_usage', instance: 'node-01:9100' },
          values: Array.from({ length: 60 }, (_, i) => [
            Math.floor(Date.now() / 1000) - (60 - i) * 30,
            String(faker.number.float({ min: 0.1, max: 0.9 })),
          ]),
        },
      ],
    })
  ),

  http.get('/api/v1/alerts', () =>
    HttpResponse.json([
      {
        alertname: 'HighCPUUsage',
        severity: 'warning',
        state: 'firing',
        labels: { alertname: 'HighCPUUsage', severity: 'warning' },
        value: '1',
      },
      {
        alertname: 'PodCrashLooping',
        severity: 'critical',
        state: 'firing',
        labels: { alertname: 'PodCrashLooping', severity: 'critical' },
        value: '1',
      },
    ])
  ),

  http.post('/api/v1/alerts/:id/silence', () =>
    HttpResponse.json({ status: 'silenced', alert_id: 'test' })
  ),

  http.get('/api/v1/logs/query', () =>
    HttpResponse.json({
      status: 'success',
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { app: 'api-gateway' },
            values: Array.from({ length: 20 }, () => [
              String(Date.now() * 1e6),
              faker.lorem.sentence(),
            ]),
          },
        ],
      },
    })
  ),

  http.get('/api/v1/traces/search', () =>
    HttpResponse.json({
      traces: Array.from({ length: 5 }, () => ({
        traceID: faker.string.hexadecimal({ length: 32, prefix: '' }),
        rootServiceName: faker.helpers.arrayElement(['api-gateway', 'serving-svc']),
        rootTraceName: faker.helpers.arrayElement(['GET /health', 'POST /predict']),
        durationMs: faker.number.int({ min: 5, max: 2000 }),
        startTimeUnixNano: Date.now() * 1e6,
      })),
    })
  ),
];
