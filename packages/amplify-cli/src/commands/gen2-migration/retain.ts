import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation, Validation } from './_common/operation';
import { paginateListStackResources } from '@aws-sdk/client-cloudformation';

export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      //TODO
      describe: function (): Promise<string[]> {
        throw new Error('Function not implemented.');
      },
      validate: function (): Validation | undefined {
        throw new Error('Function not implemented.');
      },
      execute: function (): Promise<void> {
        throw new Error('Function not implemented.');
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: ['Set DeletionPolicy and UpdateReplacePolicy to Retain for every resource in Gen1 CloudFormation stacks'],
    });
  }

  public rollback(): Promise<Plan> {
    throw new Error('Method not implemented.');
  }

  private async walkStackHierarchy(stackId: string): Promise<string[]> {
    const result: string[] = [];

    const pages = paginateListStackResources({ client: this.gen1App.clients.cloudFormation }, { StackName: stackId });

    for await (const page of pages) {
      for (const resource of page.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          const children = await this.walkStackHierarchy(resource.PhysicalResourceId);
          result.push(...children);
        }
      }
    }

    result.push(stackId);
    return result;
  }
}
