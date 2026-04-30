import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation, Validation } from './_common/operation';
import { DescribeStacksCommand, paginateListStackResources } from '@aws-sdk/client-cloudformation';
import { Cfn } from './_common/cfn';
import { extractStackNameFromId } from './_common/utils';

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

  private async buildRetainOperation(stackId: string): Promise<AmplifyMigrationOperation> {
    const cfn = new Cfn(this.gen1App.clients.cloudFormation, this.logger);
    const stackName = extractStackNameFromId(stackId);

    const template = await cfn.fetchTemplate(stackId);
    for (const resource of Object.values(template.Resources)) {
      resource.DeletionPolicy = 'Retain';
      resource.UpdateReplacePolicy = 'Retain';
    }

    const describeResponse = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: stackId }));

    const parameters = (describeResponse.Stacks?.[0].Parameters ?? []).map((p) => ({
      ParameterKey: p.ParameterKey,
      UsePreviousValue: true,
    }));

    const changeset = await cfn.createChangeSet({ stackName: stackId, parameters, templateBody: template });

    if (!changeset) {
      return {
        describe: async () => [`${stackName} already retained`],
        validate: () => undefined,
        execute: async () => {
          // no-op: stack is already fully retained
        },
      };
    }

    return {
      describe: async () => [`Apply DeletionPolicy: Retain to resources in ${stackName}`],
      validate: () => undefined,
      execute: async () => {
        await cfn.executeChangeSet({
          changeSet: changeset,
          templateBody: template,
          captureSnapshot: false,
        });
      },
    };
  }
}
