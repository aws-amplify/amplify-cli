// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  ARCHIVED: 'ARCHIVED',
};

const { Project, Todo, QuoteResponse } = initSchema(schema);

export { Project, Todo, ProjectStatus, QuoteResponse };
