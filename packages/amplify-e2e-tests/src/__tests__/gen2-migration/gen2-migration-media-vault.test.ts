/* eslint-disable spellcheck/spell-checker */
import { runMigrationE2E, MIGRATION_TEST_TIMEOUT_MS } from './run-migration-e2e';

describe('gen2 migration - media-vault', () => {
  it(
    'migrates the media-vault app from Gen1 to Gen2',
    async () => {
      await runMigrationE2E('media-vault');
    },
    MIGRATION_TEST_TIMEOUT_MS,
  );
});
