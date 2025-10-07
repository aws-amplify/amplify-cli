import { AmplifyMigrationStep } from './_step';

export class AmplifyMigrationCloneStep extends AmplifyMigrationStep {
  public validate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public execute(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public rollback(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
