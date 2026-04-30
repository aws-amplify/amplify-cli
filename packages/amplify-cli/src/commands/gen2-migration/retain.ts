import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation } from './_common/operation';
import { DescribeChangeSetOutput, DescribeStacksCommand, paginateListStackResources } from '@aws-sdk/client-cloudformation';
import { Cfn } from './_common/cfn';
import { extractStackNameFromId } from './_common/utils';

export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    const stackIds = await this.walkStackHierarchy(this.gen1App.rootStackName);
    for (const stackId of stackIds) {
      operations.push(await this.buildRetainOperation(stackId));
    }

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        'DeletionPolicy and UpdateReplacePolicy will be set to Retain on every resource in Gen1 CloudFormation stacks',
        'This protects your Gen2 environment from unintended impact caused by changes to Gen1 stacks',
      ],
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
      validate: () => ({
        description: `Ensure only retain changes for ${stackName}`,
        run: async () => {
          const valid = this.isAllowedRetainChangeset(changeset);
          return {
            valid,
            report: valid ? undefined : cfn.renderChangeSet(changeset),
          };
        },
      }),
      execute: async () => {
        await cfn.executeChangeSet({
          changeSet: changeset,
          templateBody: template,
          captureSnapshot: false,
        });
      },
    };
  }

  private isAllowedRetainChangeset(changeSet: DescribeChangeSetOutput): boolean {
    const changes = changeSet.Changes ?? [];

    if (changes.length === 0) return true;

    for (const change of changes) {
      const rc = change.ResourceChange;

      if (!rc) return false;
      if (rc.Action !== 'Modify') return false;
      if (rc.Replacement === 'True') return false;

      const details = rc.Details ?? [];
      if (details.length === 0) return false;

      for (const detail of details) {
        const attr = detail.Target?.Attribute;
        const after = detail.Target?.AfterValue;
        if (attr !== 'DeletionPolicy' && attr !== 'UpdateReplacePolicy') return false;
        if (after !== 'Retain') return false;
      }
    }

    return true;
  }
}
