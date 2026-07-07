/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - store-locator', () => {
  it(
    'migrates the store-locator app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('store-locator');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
