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
  GetTemplateCommand,
  Parameter,
  ResourceMapping,
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
import { CFNResource, CFNTemplate } from '../cfn-template';
import { extractStackNameFromId } from './utils';
import { SpinningLogger } from '../_spinning-logger';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveredResource } from '../generate/_infra/gen1-app';

const MAX_WAIT_TIME_SECONDS = 900;
const NO_UPDATES_MESSAGE = 'No updates are to be performed';
const CFN_IAM_CAPABILITY = 'CAPABILITY_NAMED_IAM';
export const OUTPUT_DIRECTORY = '.amplify/refactor.operations';

const EMPTY_HOLDING_TEMPLATE: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Temporary holding stack for Gen2 migration',
  Resources: {},
  Outputs: {},
};

export const HOLDING_STACK_NAME_SUFFIX = '-holding';
export const MIGRATION_PLACEHOLDER_LOGICAL_ID = 'MigrationPlaceholder';
export const MIGRATION_PLACEHOLDER_RESOURCE: CFNResource = { Type: 'AWS::CloudFormation::WaitConditionHandle', Properties: {} };

/**
 * Centralized CloudFormation operations for the refactor workflow.
 * Wraps update, refactor, and change set APIs behind a single client instance.
 */
export class Cfn {
  /**
   * Stack IDs claimed for update at plan time. Prevents duplicate update operations
   * when multiple refactorers share a stack.
   */
  private readonly updateStackClaims = new Set<string>();

  constructor(private readonly client: CloudFormationClient, private readonly logger: SpinningLogger) {
    if (!fs.existsSync(OUTPUT_DIRECTORY)) {
      fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    }
  }

  /**
   * Returns true if the stack has been claimed for update by a refactorer.
   */
  public isUpdateClaimed(stackName: string): boolean {
    return this.updateStackClaims.has(stackName);
  }

  /**
   * Marks a stack as claimed for update. Call at plan time to prevent
   * duplicate update operations across refactorers sharing a stack.
   */
  public claimUpdate(stackName: string): void {
    this.updateStackClaims.add(stackName);
  }

  /**
   * Updates a stack with the given template.
   * No-ops if no updates are needed. Throws on failure.
   */
  public async update(params: {
    readonly stackName: string;
    readonly parameters: Parameter[];
    readonly templateBody: CFNTemplate;
    readonly resource?: DiscoveredResource;
  }): Promise<void> {
    const { stackName, parameters, templateBody, resource } = params;
    try {
      const input: UpdateStackCommandInput = {
        TemplateBody: JSON.stringify(templateBody),
        Parameters: parameters,
        StackName: stackName,
        Capabilities: [CFN_IAM_CAPABILITY],
        Tags: [],
      };
      writeUpdateSnapshot(input);
      this.info(`Updating stack: ${extractStackNameFromId(stackName)}`, resource);
      await this.client.send(new UpdateStackCommand(input));
    } catch (e) {
      if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.includes(NO_UPDATES_MESSAGE)) {
        return;
      }
      throw e;
    }
    this.info(`Waiting for stack update to complete: ${extractStackNameFromId(stackName)}`, resource);
    await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: stackName });
  }

  /**
   * Creates and executes a CloudFormation stack refactor.
   * Throws on failure.
   */
  public async refactor(resourceMappings: ResourceMapping[], resource?: DiscoveredResource): Promise<void> {
    const sourceStackId = resourceMappings[0].Source.StackName;
    const targetStackId = resourceMappings[0].Destination.StackName;

    const sourceStackName = extractStackNameFromId(sourceStackId);
    const targetStackName = extractStackNameFromId(targetStackId);

    this.info(`Refactoring ${sourceStackName} → ${targetStackName}`, resource);

    const targetStack = await this.findStack(targetStackId);
    const sourceStack = await this.findStack(sourceStackId);

    if (!targetStack && !targetStackName.endsWith(HOLDING_STACK_NAME_SUFFIX)) {
      // only holding stacks may be absent because they don't exist prior
      // to refactor.
      throw new AmplifyError('MigrationError', { message: `Target stack ${targetStackName} does not exist` });
    }

    if (!sourceStack) {
      // should never happen
      throw new AmplifyError('MigrationError', { message: `Source stack ${sourceStackName} does not exist` });
    }

    const sourceTemplate = await this.fetchTemplate(sourceStackId);
    const sourceTemplateClone = JSON.parse(JSON.stringify(sourceTemplate)) as CFNTemplate;
    const targetTemplate = targetStack ? await this.fetchTemplate(targetStackId) : JSON.parse(JSON.stringify(EMPTY_HOLDING_TEMPLATE));

    for (const mapping of resourceMappings) {
      targetTemplate.Resources[mapping.Destination.LogicalResourceId] = sourceTemplate.Resources[mapping.Source.LogicalResourceId];
      delete sourceTemplate.Resources[mapping.Source.LogicalResourceId];
    }

    if (Object.keys(sourceTemplate.Resources).length === 0) {
      // the refactor will remove all resources from the source.
      // CloudFormation doesn't allow this so we need a placeholder resource first.
      sourceTemplateClone.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = MIGRATION_PLACEHOLDER_RESOURCE;
      sourceTemplate.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = MIGRATION_PLACEHOLDER_RESOURCE;
      this.info(`Adding placeholder resource to source stack '${sourceStackName}'`);
      await this.update({
        stackName: sourceStackId,
        templateBody: sourceTemplateClone,
        parameters: sourceStack.Parameters ?? [],
        resource,
      });
      this.info(`Finished adding placeholder to source stack '${sourceStackName}'`);
    }

    const input: CreateStackRefactorCommandInput = {
      StackDefinitions: [
        { TemplateBody: JSON.stringify(sourceTemplate), StackName: sourceStackId },
        { TemplateBody: JSON.stringify(targetTemplate), StackName: targetStackId },
      ],
      ResourceMappings: resourceMappings,
      EnableStackCreation: true,
    };

    input.Description = buildRefactorDescription(input);

    writeRefactorSnapshot(input);

    this.info(`Creating stack refactor: ${extractStackNameFromId(sourceStackId)} → ${extractStackNameFromId(targetStackId)}`, resource);

    const { StackRefactorId } = await this.client.send(new CreateStackRefactorCommand(input));
    if (!StackRefactorId) {
      throw new AmplifyError('StackStateError', {
        message: 'CreateStackRefactor returned no StackRefactorId',
      });
    }

    this.info(`Waiting for stack refactor creation to complete: ${StackRefactorId}`, resource);
    await waitUntilStackRefactorCreateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackRefactorId });

    await this.client.send(new ExecuteStackRefactorCommand({ StackRefactorId }));

    this.info(`Waiting for stack refactor execution to complete: ${StackRefactorId}`, resource);
    await waitUntilStackRefactorExecuteComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackRefactorId });

    this.info(`Waiting for source stack update: ${extractStackNameFromId(sourceStackId)}`, resource);
    await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: sourceStackId });

    // Destination may be newly created (EnableStackCreation) or updated
    this.info(`Waiting for destination stack: ${extractStackNameFromId(targetStackId)}`, resource);
    if (targetStack) {
      await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: targetStackId });
    } else {
      await waitUntilStackCreateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: targetStackId });
    }

    this.info(`Finished refactoring ${sourceStackName} → ${targetStackName}`, resource);
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
   * Describes a stack by name. Throws if the stack does not exist or has been deleted.
   */
  public async describeStack(stackName: string): Promise<Stack> {
    const stack = await this.findStack(stackName);
    if (!stack) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack '${extractStackNameFromId(stackName)}' does not exist`,
      });
    }
    return stack;
  }

  /**
   * Fetches and parses the original template for a stack.
   * Throws if the stack returns an empty template.
   */
  public async fetchTemplate(stackName: string): Promise<CFNTemplate> {
    const response = await this.client.send(new GetTemplateCommand({ StackName: stackName, TemplateStage: 'Original' }));
    if (!response.TemplateBody) {
      throw new AmplifyError('InvalidStackError', {
        message: `Stack '${extractStackNameFromId(stackName)}' returned an empty template`,
      });
    }
    return JSON.parse(response.TemplateBody) as CFNTemplate;
  }

  /**
   * Deletes a stack and waits for deletion to complete.
   * No-ops if the stack does not exist.
   */
  public async deleteStack(stackName: string, resource?: DiscoveredResource): Promise<void> {
    try {
      this.info(`Deleting stack: ${extractStackNameFromId(stackName)}`, resource);
      await this.client.send(new DeleteStackCommand({ StackName: stackName }));
      this.info(`Waiting for stack deletion: ${extractStackNameFromId(stackName)}`, resource);
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

  private info(message: string, resource?: DiscoveredResource) {
    const prefix = resource ? `[${resource.category}/${resource.resourceName}] ` : '';
    this.logger.info(`${prefix}${message}`);
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
