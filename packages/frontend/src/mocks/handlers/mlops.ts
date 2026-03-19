import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

const EXPERIMENT_NAMES = [
  'fraud-detection-v3',
  'recommendation-tuning',
  'churn-prediction',
  'text-classification',
  'image-segmentation',
];

const MODEL_NAMES = ['fraud-detector', 'recommendation-engine', 'churn-predictor'];

const DAG_IDS = [
  'ml-training-pipeline',
  'data-preprocessing',
  'model-evaluation',
  'feature-store-update',
  'ab-test-analysis',
  'batch-prediction',
];

function makeRun(experimentId: string) {
  return {
    run_id: faker.string.uuid(),
    experiment_id: experimentId,
    status: faker.helpers.arrayElement(['FINISHED', 'RUNNING', 'FAILED']),
    start_time: faker.date.recent().getTime(),
    end_time: faker.helpers.maybe(() => faker.date.recent().getTime()) ?? null,
    metrics: {
      accuracy: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 4 }),
      loss: faker.number.float({ min: 0.01, max: 0.5, fractionDigits: 4 }),
      f1_score: faker.number.float({ min: 0.6, max: 0.98, fractionDigits: 4 }),
    },
    params: {
      learning_rate: String(faker.helpers.arrayElement([0.001, 0.01, 0.1])),
      epochs: String(faker.number.int({ min: 10, max: 100 })),
      batch_size: String(faker.helpers.arrayElement([16, 32, 64, 128])),
    },
    tags: {},
  };
}

export const mlopsHandlers = [
  http.get('/api/v1/mlops/experiments', () =>
    HttpResponse.json(
      Array.from({ length: 5 }, (_, i) => ({
        experiment_id: String(i + 1),
        name: EXPERIMENT_NAMES[i],
        artifact_location: `s3://mlflow-artifacts/${faker.string.alphanumeric(8)}`,
        lifecycle_stage: 'active',
        tags: {},
      }))
    )
  ),

  http.get('/api/v1/mlops/experiments/:id/runs', ({ params }) =>
    HttpResponse.json(
      Array.from({ length: 8 }, () => makeRun(params.id as string))
    )
  ),

  http.post('/api/v1/mlops/experiments/runs/compare', async ({ request }) => {
    const body = (await request.json()) as { run_ids: string[] };
    return HttpResponse.json(
      body.run_ids.map((id) => ({
        ...makeRun('1'),
        run_id: id,
      }))
    );
  }),

  http.get('/api/v1/mlops/experiments/models', () =>
    HttpResponse.json(
      MODEL_NAMES.map((name) => ({
        name,
        latest_versions: [
          {
            name,
            version: String(faker.number.int({ min: 1, max: 10 })),
            current_stage: faker.helpers.arrayElement(['Production', 'Staging', 'Archived']),
            status: 'READY',
            source: `s3://models/${faker.string.alphanumeric(8)}`,
            run_id: faker.string.uuid(),
          },
        ],
        description: faker.lorem.sentence(),
        tags: {},
      }))
    )
  ),

  http.get('/api/v1/mlops/experiments/models/:name/versions', ({ params }) =>
    HttpResponse.json(
      Array.from({ length: 3 }, (_, i) => ({
        name: params.name,
        version: String(i + 1),
        current_stage: ['None', 'Staging', 'Production'][i],
        status: 'READY',
        source: `s3://models/${faker.string.alphanumeric(8)}`,
        run_id: faker.string.uuid(),
      }))
    )
  ),

  http.post('/api/v1/mlops/experiments/models/:name/versions/:version/stage', async ({ params, request }) => {
    const body = (await request.json()) as { stage: string };
    return HttpResponse.json({
      name: params.name,
      version: params.version,
      current_stage: body.stage,
      status: 'READY',
      source: 's3://models/updated',
      run_id: faker.string.uuid(),
    });
  }),

  http.get('/api/v1/mlops/dags', () =>
    HttpResponse.json(
      DAG_IDS.map((dag_id) => ({
        dag_id,
        description: faker.lorem.sentence(),
        is_paused: faker.datatype.boolean(),
        is_active: true,
        schedule_interval: faker.helpers.arrayElement(['@daily', '@hourly', '0 2 * * *']),
        next_dagrun: faker.date.soon().toISOString(),
      }))
    )
  ),

  http.get('/api/v1/mlops/dags/:dagId/graph', ({ params }) =>
    HttpResponse.json({
      dag_id: params.dagId,
      tasks: [
        { task_id: 'extract', downstream_task_ids: ['transform'], task_type: 'PythonOperator' },
        { task_id: 'transform', downstream_task_ids: ['validate', 'load'], task_type: 'PythonOperator' },
        { task_id: 'validate', downstream_task_ids: ['notify'], task_type: 'BranchOperator' },
        { task_id: 'load', downstream_task_ids: ['notify'], task_type: 'PythonOperator' },
        { task_id: 'notify', downstream_task_ids: [], task_type: 'EmailOperator' },
      ],
    })
  ),

  http.get('/api/v1/mlops/dags/:dagId/runs', () =>
    HttpResponse.json(
      Array.from({ length: 5 }, () => ({
        dag_run_id: `manual__${faker.string.alphanumeric(8)}`,
        dag_id: 'ml-pipeline',
        state: faker.helpers.arrayElement(['success', 'failed', 'running', 'queued']),
        execution_date: faker.date.recent().toISOString(),
        start_date: faker.date.recent().toISOString(),
        end_date: faker.helpers.maybe(() => faker.date.recent().toISOString()) ?? null,
      }))
    )
  ),

  http.post('/api/v1/mlops/dags/:dagId/trigger', ({ params }) =>
    HttpResponse.json({
      dag_run_id: `manual__${faker.string.alphanumeric(8)}`,
      dag_id: params.dagId,
      state: 'queued',
    })
  ),

  http.patch('/api/v1/mlops/dags/:dagId/pause', async ({ params, request }) => {
    const body = (await request.json()) as { is_paused: boolean };
    return HttpResponse.json({
      dag_id: params.dagId,
      is_paused: body.is_paused,
    });
  }),
];
