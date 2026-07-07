/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - fitness-tracker', () => {
  it(
    'migrates the fitness-tracker app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('fitness-tracker');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
