import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

const MODEL_NAMES = [
  'fraud-detector',
  'recommendation-v2',
  'sentiment-model',
  'churn-predictor',
];

export const servingHandlers = [
  http.get('/api/v1/serving/inference-services', () =>
    HttpResponse.json(
      MODEL_NAMES.map((name) => ({
        name,
        namespace: 'model-serving',
        framework: faker.helpers.arrayElement(['sklearn', 'pytorch', 'tensorflow']),
        ready: faker.datatype.boolean(),
        url: `http://${name}.model-serving.svc.cluster.local`,
        traffic: {
          default: faker.number.int({ min: 70, max: 100 }),
          canary: faker.number.int({ min: 0, max: 30 }),
        },
        created: faker.date.recent().toISOString(),
      }))
    )
  ),

  http.get('/api/v1/serving/inference-services/:name', ({ params }) =>
    HttpResponse.json({
      name: params.name,
      namespace: 'model-serving',
      framework: 'sklearn',
      ready: true,
      url: `http://${params.name as string}.model-serving.svc.cluster.local`,
      traffic: { default: 80, canary: 20 },
      created: faker.date.recent().toISOString(),
    })
  ),

  http.post('/api/v1/serving/inference-services', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { message: 'InferenceService created', name: (body as Record<string, string>).name, spec: body },
      { status: 201 }
    );
  }),

  http.delete('/api/v1/serving/inference-services/:name', () =>
    new HttpResponse(null, { status: 204 })
  ),

  http.patch('/api/v1/serving/inference-services/:name/traffic', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, number>;
    return HttpResponse.json({
      name: params.name,
      canary_percent: body.canary_percent,
      status: 'updated',
    });
  }),

  http.get('/api/v1/serving/inference-services/:name/metrics', ({ params }) =>
    HttpResponse.json({
      name: params.name,
      metrics: {
        rps: faker.number.float({ min: 10, max: 500 }),
        latency_p99_ms: faker.number.int({ min: 20, max: 300 }),
      },
    })
  ),
];
