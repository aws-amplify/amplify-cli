import { $TSContext } from 'amplify-cli-core';
import { invokeAnalyticsMigrations } from '../plugin-client-api-analytics';

/**
 * checks if the project has been migrated to the latest version
 */
export const migrationCheck = async (context: $TSContext): Promise<void> => {
  if (['add', 'update', 'push'].includes(context.input.command)) {
    await invokeAnalyticsMigrations(context);
  }
};
