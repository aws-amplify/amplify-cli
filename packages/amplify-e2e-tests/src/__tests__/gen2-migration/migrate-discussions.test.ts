/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - discussions', () => {
  it(
    'migrates the discussions app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('discussions');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
