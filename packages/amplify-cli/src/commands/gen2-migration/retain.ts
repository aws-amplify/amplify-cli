import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation } from './_common/operation';
import { DescribeChangeSetOutput, DescribeStacksCommand, paginateListStackResources } from '@aws-sdk/client-cloudformation';
import { Cfn } from './_common/cfn';
import { extractStackNameFromId } from './_common/utils';
import { AmplifyFault } from '@aws-amplify/amplify-cli-core';

/** Internal: a built operation plus classification so `forward()` can produce a grouped summary. */
interface BuiltRetainOperation {
  readonly stackName: string;
  readonly alreadyRetained: boolean;
  readonly operation: AmplifyMigrationOperation;
}

export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const stackIds = await this.walkStackHierarchy(this.gen1App.rootStackName);
    this.logger.info(`Discovered ${stackIds.length} stacks to retain`);

    const built: BuiltRetainOperation[] = [];
    for (const stackId of stackIds) {
      built.push(await this.buildRetainOperation(stackId));
    }

    const toApply = built.filter((b) => !b.alreadyRetained);
    const alreadyRetained = built.filter((b) => b.alreadyRetained);

    // Produce one "summary" operation whose `describe()` emits the grouped bullet list
    // for all stacks, and replace each per-stack operation's `describe()` with an empty
    // list so Plan.describe() only renders the grouped view.
    const summaryOperation: AmplifyMigrationOperation = {
      describe: async () => this.renderOperationsSummary(toApply, alreadyRetained),
      validate: () => undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    };

    const silencedOperations = built.map<AmplifyMigrationOperation>((b) => ({
      describe: async () => [],
      validate: b.operation.validate,
      execute: b.operation.execute,
    }));

    return new Plan({
      operations: [summaryOperation, ...silencedOperations],
      logger: this.logger,
      title: 'Execute',
      implications: [
        'DeletionPolicy and UpdateReplacePolicy will be set to Retain on every resource in Gen1 CloudFormation stacks',
        'This protects your Gen2 environment from unintended impact caused by changes to Gen1 stacks',
      ],
    });
  }

  public rollback(): Promise<Plan> {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Rollback is not supported for the retain step',
      resolution:
        'Retain only marks resources with DeletionPolicy: Retain. If you need to undo it, manually update the CloudFormation templates to remove the policy.',
    });
  }

  private renderOperationsSummary(toApply: BuiltRetainOperation[], alreadyRetained: BuiltRetainOperation[]): string[] {
    const lines: string[] = [];
    if (toApply.length > 0) {
      const noun = toApply.length === 1 ? 'stack' : 'stacks';
      lines.push(`Apply DeletionPolicy: Retain to all resources in ${toApply.length} Gen1 CloudFormation ${noun}:`);
      for (const b of toApply) lines.push(`    • ${b.stackName}`);
    }
    if (alreadyRetained.length > 0) {
      if (lines.length > 0) lines.push('');
      const noun = alreadyRetained.length === 1 ? 'stack' : 'stacks';
      lines.push(`Skip ${alreadyRetained.length} ${noun} — resources are already retained:`);
      for (const b of alreadyRetained) lines.push(`    • ${b.stackName}`);
    }
    return lines;
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

  private async buildRetainOperation(stackId: string): Promise<BuiltRetainOperation> {
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

    this.logger.push(`${stackName} (Create ChangeSet)`);
    const changeset = await cfn.createChangeSet({ stackName: stackId, parameters, templateBody: template });
    this.logger.pop();

    if (!changeset) {
      return {
        stackName,
        alreadyRetained: true,
        operation: {
          describe: async () => [`${stackName} already retained`],
          validate: () => undefined,
          execute: async () => {
            // no-op: stack is already fully retained
          },
        },
      };
    }

    return {
      stackName,
      alreadyRetained: false,
      operation: {
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
