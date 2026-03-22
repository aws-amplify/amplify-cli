import {
  CloudFormationClient,
  CloudFormationServiceException,
  CreateChangeSetCommand,
  CreateStackRefactorCommand,
  CreateStackRefactorCommandInput,
  DeleteChangeSetCommand,
  DeleteStackCommand,
  DescribeChangeSetCommand,
  DescribeChangeSetOutput,
  DescribeStacksCommand,
  ExecuteStackRefactorCommand,
  Parameter,
  Stack,
  UpdateStackCommand,
  UpdateStackCommandInput,
  waitUntilChangeSetCreateComplete,
  waitUntilStackCreateComplete,
  waitUntilStackDeleteComplete,
  waitUntilStackRefactorCreateComplete,
  waitUntilStackRefactorExecuteComplete,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNTemplate } from '../cfn-template';
import { extractStackNameFromId } from './utils';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const MAX_WAIT_TIME_SECONDS = 3600;
const NO_UPDATES_MESSAGE = 'No updates are to be performed';
const CFN_IAM_CAPABILITY = 'CAPABILITY_NAMED_IAM';
export const OUTPUT_DIRECTORY = '.amplify/refactor.operations';

/**
 * Centralized CloudFormation operations for the refactor workflow.
 * Wraps update, refactor, and change set APIs behind a single client instance.
 */
export class Cfn {
  constructor(private readonly client: CloudFormationClient) {
    if (!fs.existsSync(OUTPUT_DIRECTORY)) {
      fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    }
  }

  /**
   * Updates a stack with the given template.
   * No-ops if no updates are needed. Throws on failure.
   */
  public async update(params: {
    readonly stackName: string;
    readonly parameters: Parameter[];
    readonly templateBody: CFNTemplate;
  }): Promise<void> {
    const { stackName, parameters, templateBody } = params;
    try {
      const input: UpdateStackCommandInput = {
        TemplateBody: JSON.stringify(templateBody),
        Parameters: parameters,
        StackName: stackName,
        Capabilities: [CFN_IAM_CAPABILITY],
        Tags: [],
      };
      writeUpdateSnapshot(input);
      await this.client.send(new UpdateStackCommand(input));
    } catch (e) {
      if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.includes(NO_UPDATES_MESSAGE)) {
        return;
      }
      throw e;
    }
    await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: stackName });
  }

  /**
   * Creates and executes a CloudFormation stack refactor.
   * Throws on failure.
   */
  public async refactor(input: CreateStackRefactorCommandInput): Promise<void> {
    input.Description = buildRefactorDescription(input);

    writeRefactorSnapshot(input);
    const { StackRefactorId } = await this.client.send(new CreateStackRefactorCommand(input));
    if (!StackRefactorId) {
      throw new AmplifyError('StackStateError', {
        message: 'CreateStackRefactor returned no StackRefactorId',
      });
    }

    await waitUntilStackRefactorCreateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackRefactorId });

    await this.client.send(new ExecuteStackRefactorCommand({ StackRefactorId }));

    await waitUntilStackRefactorExecuteComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackRefactorId });

    // Verify both stacks reached their final state
    const sourceStackName = input.StackDefinitions?.[0]?.StackName;
    const destStackName = input.StackDefinitions?.[1]?.StackName;
    if (!sourceStackName || !destStackName) {
      throw new AmplifyError('InvalidStackError', {
        message: 'Stack refactor input is missing source or destination stack name',
      });
    }

    await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: sourceStackName });

    // Destination may be newly created (EnableStackCreation) or updated
    try {
      await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: destStackName });
    } catch {
      await waitUntilStackCreateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: destStackName });
    }
  }

  /**
   * Creates a change set, waits for it, describes it, then deletes it.
   * Returns the described change set, or undefined if no changes were detected.
   */
  public async createChangeSet(params: {
    readonly stackName: string;
    readonly parameters: Parameter[];
    readonly templateBody: CFNTemplate;
  }): Promise<DescribeChangeSetOutput | undefined> {
    const { stackName, parameters, templateBody } = params;
    const changeSetName = `migration-preview-${Date.now()}`;

    await this.client.send(
      new CreateChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
        TemplateBody: JSON.stringify(templateBody),
        Parameters: parameters,
        Capabilities: [CFN_IAM_CAPABILITY],
      }),
    );

    try {
      try {
        await waitUntilChangeSetCreateComplete(
          { client: this.client, maxWaitTime: 120 },
          { StackName: stackName, ChangeSetName: changeSetName },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.message?.includes(`The submitted information didn't contain changes`)) {
          return undefined;
        }
        throw e;
      }

      return await this.client.send(
        new DescribeChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName, IncludePropertyValues: true }),
      );
    } finally {
      await this.client.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName }));
    }
  }

  /**
   * Finds a stack by name. Returns the stack if it exists, null if it doesn't
   * or has been deleted.
   */
  public async findStack(stackName: string): Promise<Stack | null> {
    try {
      const response = await this.client.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];
      if (stack && stack.StackStatus !== 'DELETE_COMPLETE') {
        return stack;
      }
      return null;
    } catch (error: unknown) {
      if (
        error instanceof CloudFormationServiceException &&
        error.name === 'ValidationError' &&
        error.message?.includes('does not exist')
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Deletes a stack and waits for deletion to complete.
   * No-ops if the stack does not exist.
   */
  public async deleteStack(stackName: string): Promise<void> {
    try {
      await this.client.send(new DeleteStackCommand({ StackName: stackName }));
      await waitUntilStackDeleteComplete({ client: this.client, maxWaitTime: 300 }, { StackName: stackName });
    } catch (error: unknown) {
      if (
        error instanceof CloudFormationServiceException &&
        error.name === 'ValidationError' &&
        error.message?.includes('does not exist')
      ) {
        return;
      }
      throw error;
    }
  }

  /**
   * Renders a human-readable report of property changes from a described change set.
   */
  public renderChangeSet(changeSet: DescribeChangeSetOutput): string | undefined {
    const changes = changeSet.Changes ?? [];
    if (changes.length === 0) return undefined;

    const lines: string[] = [];

    for (const change of changes) {
      const rc = change.ResourceChange;
      if (!rc) continue;

      const action = rc.Action ?? 'Unknown';
      const logicalId = rc.LogicalResourceId ?? 'Unknown';
      const resourceType = rc.ResourceType ?? 'Unknown';

      lines.push('');
      lines.push(`${chalk.bold(logicalId)} (${resourceType}) — ${chalk.yellow(action)}`);

      const details = rc.Details ?? [];
      const propDetails = details.filter((d) => d.Target?.Attribute === 'Properties' && d.Target?.Name);

      for (const detail of propDetails) {
        const target = detail.Target;
        const propertyPath = target.Path;
        const before = target.BeforeValue;
        const after = target.AfterValue;

        lines.push('');
        if (before && after) {
          lines.push(`  ${propertyPath}:`);
          lines.push(`    ${chalk.red(`- ${before}`)}`);
          lines.push(`    ${chalk.green(`+ ${after}`)}`);
        } else if (after) {
          lines.push(`  ${propertyPath}:`);
          lines.push(`    ${chalk.green(`+ ${after}`)}`);
        } else if (before) {
          lines.push(`  ${propertyPath}:`);
          lines.push(`    ${chalk.red(`- ${before}`)}`);
        } else {
          lines.push(`  ${propertyPath}: (changed)`);
        }
      }
    }

    return lines.join('\n');
  }
}

function buildRefactorDescription(input: CreateStackRefactorCommandInput): string {
  const logicalIds = input.ResourceMappings.map((m) => m.Source?.LogicalResourceId).join(', ');
  const source = extractStackNameFromId(input.StackDefinitions[0].StackName);
  const dest = extractStackNameFromId(input.StackDefinitions[1].StackName);
  return `Move [${logicalIds}] from ${source} to ${dest}`;
}

function formatTemplateBody(templateBody: string): string {
  return JSON.stringify(JSON.parse(templateBody), null, 2);
}

function writeUpdateSnapshot(input: UpdateStackCommandInput): void {
  const stackName = extractStackNameFromId(input.StackName);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `update.${stackName}.template.json`), formatTemplateBody(input.TemplateBody));
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `update.${stackName}.parameters.json`), JSON.stringify(input.Parameters ?? [], null, 2));
}

function writeRefactorSnapshot(input: CreateStackRefactorCommandInput): void {
  const source = input.StackDefinitions[0];
  const target = input.StackDefinitions[1];
  const sourceStackName = extractStackNameFromId(source.StackName);
  const targetStackName = extractStackNameFromId(target.StackName);
  const description = `refactor.__from__.${sourceStackName}.__to__.${targetStackName}`;
  const basePath = path.join(OUTPUT_DIRECTORY, description);
  fs.writeFileSync(`${basePath}.source.template.json`, formatTemplateBody(source.TemplateBody));
  fs.writeFileSync(`${basePath}.target.template.json`, formatTemplateBody(target.TemplateBody));
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `${description}.mappings.json`), JSON.stringify(input.ResourceMappings ?? [], null, 2));
}
