/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - product-catalog', () => {
  it(
    'migrates the product-catalog app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('product-catalog');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
