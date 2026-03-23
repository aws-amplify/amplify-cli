import { AmplifyMigrationStep } from './_step';
import { Plan } from './_plan';

export class AmplifyMigrationCloneStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    throw new Error('Method not implemented.');
  }

  public async rollback(): Promise<Plan> {
    throw new Error('Not Implemented');
  }
}
