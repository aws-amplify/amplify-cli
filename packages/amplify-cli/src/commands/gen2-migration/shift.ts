import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';

export class AmplifyMigrationShiftStep extends AmplifyMigrationStep {
  public details(): string[] {
    return [];
  }

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
