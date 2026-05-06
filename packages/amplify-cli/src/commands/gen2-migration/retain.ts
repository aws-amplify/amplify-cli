import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation } from './_common/operation';
import {
  DescribeChangeSetOutput,
  DescribeStacksCommand,
  paginateListStackResources,
  SetStackPolicyCommand,
} from '@aws-sdk/client-cloudformation';
import { Cfn } from './_common/cfn';
import { extractStackNameFromId } from './_common/utils';
import { AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { cfnChangesetConsoleUrl } from '../drift/services/drift-formatter';
import chalk from 'chalk';

const PERMISSIVE_STACK_POLICY = JSON.stringify({
  Statement: [{ Effect: 'Allow', Action: 'Update:*', Principal: '*', Resource: '*' }],
});

export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const stackIds = await this.walkStackHierarchy(this.gen1App.rootStackName);
    this.logger.info(`Discovered ${stackIds.length} stacks`);

    const operations: AmplifyMigrationOperation[] = [this.buildUnlockOperation()];
    for (const stackId of stackIds) {
      operations.push(this.buildRetainOperation(stackId));
    }

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        'DeletionPolicy and UpdateReplacePolicy will be set to Retain on every resource in Gen1 CloudFormation stacks',
        'This protects your Gen2 environment from unintended impact caused by changes to Gen1 stacks',
        'A stack-level deny policy was applied by gen2-migration lock, it will be replaced with a permissive one (no restore)',
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

  private buildUnlockOperation(): AmplifyMigrationOperation {
    return {
      describe: async () => [`Overwrite stack policy on '${this.gen1App.rootStackName}' with Allow Update:*`],
      validate: () => undefined,
      execute: async () => {
        await this.gen1App.clients.cloudFormation.send(
          new SetStackPolicyCommand({
            StackName: this.gen1App.rootStackName,
            StackPolicyBody: PERMISSIVE_STACK_POLICY,
          }),
        );
        this.logger.info(`Applied permissive stack policy to '${this.gen1App.rootStackName}'`);
      },
    };
  }

  private async walkStackHierarchy(stackId: string): Promise<string[]> {
    const result: string[] = [stackId];

    const pages = paginateListStackResources({ client: this.gen1App.clients.cloudFormation }, { StackName: stackId });

    for await (const page of pages) {
      for (const resource of page.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          const children = await this.walkStackHierarchy(resource.PhysicalResourceId);
          result.push(...children);
        }
      }
    }

    return result;
  }

  private buildRetainOperation(stackId: string): AmplifyMigrationOperation {
    const cfn = new Cfn(this.gen1App.clients.cloudFormation, this.logger);
    const stackName = extractStackNameFromId(stackId);

    return {
      describe: async () => [`Apply DeletionPolicy and UpdateReplacePolicy: Retain to resources in ${stackName}`],
      validate: () => undefined,
      execute: async () => {
        const template = await cfn.fetchTemplate(stackId);

        // Idempotence guard: if every non-nested resource already has retain,
        // skip the whole CFN round-trip. This keeps reruns safe — without it,
        // an already-retained parent stack could produce a changeset that
        // contains only Dynamic/Automatic re-evaluation entries on nested
        // children, which would clobber the children's retain state on execute.
        const needsChange = Object.entries(template.Resources).some(([, r]) => {
          if (r.Type === 'AWS::CloudFormation::Stack') return false;
          return r.DeletionPolicy !== 'Retain' || r.UpdateReplacePolicy !== 'Retain';
        });

        if (!needsChange) {
          this.logger.info(`${stackName} — no retain changes needed`);
          return;
        }

        for (const [logicalId, resource] of Object.entries(template.Resources)) {
          // Skip AWS::CloudFormation::Stack references. Adding Retain policies to them
          // would be ineffective anyway because CloudFormation reconciles nested stacks
          // from their TemplateURL during parent updates. We only retain the nested
          // stacks' internal resources via their own per-stack operations.
          if (resource.Type === 'AWS::CloudFormation::Stack') {
            this.logger.info(`Skipping nested-stack reference '${logicalId}' in ${stackName}`);
            continue;
          }
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
          this.logger.info(`${stackName} — no retain changes needed`);
          return;
        }

        if (!this.isAllowedRetainChangeset(changeset)) {
          throw new AmplifyError('MigrationError', {
            message: `Retain changeset for ${stackName} contains unexpected changes`,
            resolution: cfn.renderChangeSet(changeset),
          });
        }

        const url = cfnChangesetConsoleUrl(changeset.ChangeSetId ?? '', changeset.StackId);
        if (url) {
          this.logger.info(`Changeset URL: ${chalk.dim(url)}`);
        }

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

      // CloudFormation flags every child `AWS::CloudFormation::Stack` entry in a
      // parent template as a dynamic re-evaluation whenever the parent is
      // updated — even when our only change is adding Retain attributes. These
      // re-evaluations have `RequiresRecreation: 'Never'` and don't represent
      // a real property change, so we accept them as part of the retain
      // operation.
      if (rc.ResourceType === 'AWS::CloudFormation::Stack') {
        const allDynamicReEvaluation = details.every(
          (d) =>
            d.Target?.Attribute === 'Properties' &&
            d.Target?.RequiresRecreation === 'Never' &&
            d.Evaluation === 'Dynamic' &&
            d.ChangeSource === 'Automatic',
        );
        if (allDynamicReEvaluation) continue;
      }

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
