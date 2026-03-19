import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

export const pipelineHandlers = [
  http.get('/api/v1/connections', () =>
    HttpResponse.json(
      Array.from({ length: 4 }, () => ({
        connectionId: faker.string.uuid(),
        name: `${faker.helpers.arrayElement(['postgres', 'mysql', 'bigquery'])}-to-${faker.helpers.arrayElement(['snowflake', 's3', 'redshift'])}`,
        status: faker.helpers.arrayElement(['active', 'inactive', 'deprecated']),
        sourceId: faker.string.uuid(),
        destinationId: faker.string.uuid(),
        schedule: faker.helpers.maybe(() => ({ units: 24, timeUnit: 'hours' })),
      }))
    )
  ),

  http.get('/api/v1/connections/:id/jobs', () =>
    HttpResponse.json(
      Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        configId: 'conn-1',
        status: faker.helpers.arrayElement(['succeeded', 'running', 'failed']),
        createdAt: Date.now() - i * 86400000,
        updatedAt: Date.now() - i * 86400000 + 3600000,
        attempts: [
          {
            id: 1,
            status: 'succeeded',
            bytesSynced: faker.number.int({ min: 100000, max: 50000000 }),
            recordsSynced: faker.number.int({ min: 100, max: 50000 }),
          },
        ],
      }))
    )
  ),

  http.post('/api/v1/connections/:id/sync', () =>
    HttpResponse.json({ job: { id: 42, status: 'pending' } })
  ),

  http.get('/api/v1/flows', () =>
    HttpResponse.json(
      Array.from({ length: 6 }, () => ({
        id: faker.string.uuid(),
        name: faker.helpers.arrayElement([
          'etl-daily-sales',
          'ml-feature-pipeline',
          'data-quality-check',
          'model-retraining',
          'log-aggregation',
          'report-generation',
        ]),
        created: faker.date.recent().toISOString(),
        tags: [faker.helpers.arrayElement(['production', 'staging', 'dev'])],
      }))
    )
  ),

  http.get('/api/v1/flows/runs', () =>
    HttpResponse.json(
      Array.from({ length: 10 }, () => ({
        id: faker.string.uuid(),
        name: `run-${faker.string.alphanumeric(6)}`,
        flow_id: faker.string.uuid(),
        state: {
          type: faker.helpers.arrayElement([
            'COMPLETED',
            'RUNNING',
            'FAILED',
            'CANCELLED',
          ]),
        },
        start_time: faker.date.recent().toISOString(),
        end_time: faker.helpers.maybe(() => faker.date.recent().toISOString()),
      }))
    )
  ),

  http.post('/api/v1/flows/runs/:id/cancel', () =>
    HttpResponse.json({ status: 'cancelling' })
  ),

  http.get('/api/v1/spark/jobs', () =>
    HttpResponse.json(
      Array.from({ length: 5 }, () => ({
        jobId: faker.number.int({ min: 1, max: 100 }),
        name: faker.helpers.arrayElement([
          'feature-engineering',
          'data-join',
          'aggregation',
          'etl-transform',
          'model-training',
        ]),
        status: faker.helpers.arrayElement(['RUNNING', 'SUCCEEDED', 'FAILED']),
        submissionTime: faker.date.recent().toISOString(),
        numTasks: faker.number.int({ min: 10, max: 200 }),
        numCompletedTasks: faker.number.int({ min: 0, max: 200 }),
        numStages: faker.number.int({ min: 2, max: 10 }),
        numCompletedStages: faker.number.int({ min: 0, max: 10 }),
      }))
    )
  ),
];
