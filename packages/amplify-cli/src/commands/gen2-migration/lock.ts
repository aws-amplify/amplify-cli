import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  public async validate(): Promise<boolean> {
    printer.warn('Not implemented');
    return true;
  }

  public async execute(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }
}
