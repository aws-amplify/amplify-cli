import { migrateProject } from '../migrate-project';

export const run = async context => {
  await migrateProject(context);
};
