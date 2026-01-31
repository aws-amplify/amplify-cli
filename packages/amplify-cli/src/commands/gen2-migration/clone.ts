import { AmplifyMigrationOperation, AmplifyMigrationStep } from './_step';

export class AmplifyMigrationCloneStep extends AmplifyMigrationStep {
  public async executeImplications(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  public async rollbackImplications(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  public async executeValidate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async rollbackValidate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Method not implemented.');
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }
}
