import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
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
