import { $TSContext } from 'amplify-cli-core';
import { inAppMessagingMigrationCheck } from './in-app-messaging-migration';

/**
 * Analytics plugin migrations
 * @param context amplify CLI context
 */
export const analyticsMigrations = async (context: $TSContext): Promise<void> => {
  await inAppMessagingMigrationCheck(context);
};

/**
 * checks if the project has been migrated to the latest version
 */
export const migrationCheck = async (context: $TSContext): Promise<void> => {
  await analyticsMigrations(context);
};
