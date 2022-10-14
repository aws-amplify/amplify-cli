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
<<<<<<< HEAD
  if (['add', 'update', 'push'].includes(context.input.command)) {
    await analyticsMigrations(context);
  }
=======
  await analyticsMigrations(context);
>>>>>>> 84cc86823 (feat: migrates analytics category to support in app messaging channel notifications (#11158))
};
