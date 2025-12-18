import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * AmplifyMigrationCleanupStep handles cleanup operations after Gen1 to Gen2 migration.
 * Note: This is currently a stub implementation. Full cleanup functionality is planned for a future release.
 */
export class AmplifyMigrationCleanupStep extends AmplifyMigrationStep {
  public implications(): string[] {
    throw new Error('Method not implemented.');
  }

  public async validate(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async execute(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }
}
