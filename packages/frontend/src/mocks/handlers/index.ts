import { authHandlers } from './auth';
import { monitoringHandlers } from './monitoring';
import { pipelineHandlers } from './pipeline';
import { servingHandlers } from './serving';
import { mlopsHandlers } from './mlops';

export const handlers = [
  ...authHandlers,
  ...monitoringHandlers,
  ...pipelineHandlers,
  ...servingHandlers,
  ...mlopsHandlers,
];
