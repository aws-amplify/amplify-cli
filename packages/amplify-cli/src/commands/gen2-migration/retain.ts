import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';

export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    return new Plan({
      operations: [],
      logger: this.logger,
      title: 'Execute',
      implications: ['Set DeletionPolicy and UpdateReplacePolicy to Retain for every resource in Gen1 CloudFormation stacks'],
    });
  }

  public rollback(): Promise<Plan> {
    throw new Error('Method not implemented.');
  }
}
