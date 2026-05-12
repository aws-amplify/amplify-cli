/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - backend-only', () => {
  it(
    'migrates the backend-only app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('backend-only');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
