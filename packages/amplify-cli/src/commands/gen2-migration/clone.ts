import { AmplifyMigrationOperation, AmplifyMigrationStep } from './_step';

export class AmplifyMigrationCloneStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Method not implemented.');
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }
}
