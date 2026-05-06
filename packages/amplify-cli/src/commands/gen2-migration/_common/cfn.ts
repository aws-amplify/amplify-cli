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
  ExecuteChangeSetCommand,
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
import { CFNResource, CFNTemplate } from './cfn-template';
import { extractStackNameFromId } from './utils';
import { SpinningLogger } from './spinning-logger';
import { cfnChangesetConsoleUrl } from '../../drift/services/drift-formatter';
import chalk from 'chalk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveredResource } from './gen1-app';

const MAX_WAIT_TIME_SECONDS = 900;
const NO_UPDATES_MESSAGE = 'No updates are to be performed';
const CFN_IAM_CAPABILITY = 'CAPABILITY_NAMED_IAM';
export const REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY = '.amplify/gen2-migration/refactor.operations';

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
 * Centralized CloudFormation operations for the Gen2 migration workflow.
 * Wraps update, refactor, and change set APIs behind a single client instance.
 */
export class Cfn {
  /**
   * Stack IDs claimed for update at plan time. Prevents duplicate update operations
   * when multiple refactorers share a stack.
   */
  private readonly updateStackClaims = new Set<string>();

  constructor(private readonly client: CloudFormationClient, private readonly logger: SpinningLogger) {
    if (!fs.existsSync(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY)) {
      fs.mkdirSync(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, { recursive: true });
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
      };
      writeUpdateSnapshot({ stackName, templateBody: input.TemplateBody!, parameters });
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
    const sourceStackId = resourceMappings[0].Source!.StackName!;
    const targetStackId = resourceMappings[0].Destination!.StackName!;

    const sourceStackName = extractStackNameFromId(sourceStackId);
    const targetStackName = extractStackNameFromId(targetStackId);

    this.info(`Refactoring ${sourceStackName} → ${targetStackName}`, resource);

    const targetStack = await this.findStack(targetStackId);
    const sourceStack = await this.findStack(sourceStackId);

    if (!targetStack && !targetStackName.endsWith(HOLDING_STACK_NAME_SUFFIX)) {
      // only holding stacks may be absent because they don't exist prior
      // to refactor.
      throw new AmplifyError('StackNotFoundError', { message: `Target stack ${targetStackName} does not exist` });
    }

    if (!sourceStack) {
      // should never happen
      throw new AmplifyError('StackNotFoundError', { message: `Source stack ${sourceStackName} does not exist` });
    }

    const sourceTemplate = await this.fetchTemplate(sourceStackId);
    const sourceTemplateClone = JSON.parse(JSON.stringify(sourceTemplate)) as CFNTemplate;
    const targetTemplate = targetStack ? await this.fetchTemplate(targetStackId) : JSON.parse(JSON.stringify(EMPTY_HOLDING_TEMPLATE));

    for (const mapping of resourceMappings) {
      if (mapping.Destination!.LogicalResourceId! in targetTemplate.Resources) {
        // our refactoring is expected to move resources into vacancies, not override
        throw new AmplifyError('ResourceMappingError', {
          message: `Unable to create stack refactor. Resource ${
            mapping.Destination!.LogicalResourceId
          } already exists in stack ${targetStackName}`,
        });
      }
      targetTemplate.Resources[mapping.Destination!.LogicalResourceId!] = sourceTemplate.Resources[mapping.Source!.LogicalResourceId!];
      delete sourceTemplate.Resources[mapping.Source!.LogicalResourceId!];
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
        { TemplateBody: JSON.stringify(sourceTemplate), StackName: sourceStackName },
        { TemplateBody: JSON.stringify(targetTemplate), StackName: targetStackName },
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
    const changeSetName = `gen2-migration-${Date.now()}`;

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
      await waitUntilChangeSetCreateComplete(
        { client: this.client, maxWaitTime: 120 },
        { StackName: stackName, ChangeSetName: changeSetName },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.message?.includes(`The submitted information didn't contain changes`)) {
        await this.client.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName }));
        return undefined;
      }
      throw e;
    }

    return await this.client.send(
      new DescribeChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName, IncludePropertyValues: true }),
    );
  }

  /**
   * Executes a previously created change set and waits for the stack update to complete.
   * Returns the described change set, or undefined if no changes were detected.
   */
  public async executeChangeSet(params: {
    readonly changeSet: DescribeChangeSetOutput;
    readonly templateBody: CFNTemplate;
    readonly resource?: DiscoveredResource;
    readonly captureSnapshot?: boolean;
  }): Promise<void> {
    const { changeSet, templateBody, resource } = params;
    const displayName = extractStackNameFromId(changeSet.StackName!);

    if (params.captureSnapshot ?? true) {
      writeUpdateSnapshot({
        stackName: changeSet.StackName!,
        templateBody: JSON.stringify(templateBody),
        parameters: changeSet.Parameters ?? [],
      });
    }

    this.info(`Executing change set for stack: ${displayName}`, resource);
    await this.client.send(new ExecuteChangeSetCommand({ StackName: changeSet.StackName, ChangeSetName: changeSet.ChangeSetName }));

    this.info(`Waiting for stack update to complete: ${displayName}`, resource);
    await waitUntilStackUpdateComplete({ client: this.client, maxWaitTime: MAX_WAIT_TIME_SECONDS }, { StackName: changeSet.StackName });
  }

  /**
   * Deletes a change set without executing it.
   */
  public async deleteChangeSet(changeSet: DescribeChangeSetOutput): Promise<void> {
    await this.client.send(new DeleteChangeSetCommand({ StackName: changeSet.StackName, ChangeSetName: changeSet.ChangeSetName }));
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
  public renderChangeSet(changeSet: DescribeChangeSetOutput): string {
    const changes = changeSet.Changes ?? [];
    if (changes.length === 0) return 'No changes';

    const truncate = (value: string | undefined): string => {
      if (!value) return '';
      const max = 60;
      return value.length > max ? `${value.slice(0, max - 1)}…` : value;
    };

    const colorAction = (action: string): string => {
      if (action === 'Add') return chalk.green(action);
      if (action === 'Remove') return chalk.red(action);
      return chalk.yellow(action);
    };

    const lines: string[] = [];

    // Link to the changeset in the AWS console so the user can inspect the full diff.
    // Only included when we have a changeset ARN (always present for a described changeset).
    if (changeSet.ChangeSetId) {
      const consoleUrl = cfnChangesetConsoleUrl(changeSet.ChangeSetId, changeSet.StackId);
      if (consoleUrl) {
        lines.push(chalk.dim(consoleUrl));
      }
    }

    for (const change of changes) {
      const rc = change.ResourceChange;
      if (!rc) continue;

      const action = rc.Action ?? 'Unknown';
      const logicalId = rc.LogicalResourceId ?? 'Unknown';
      const resourceType = rc.ResourceType ?? 'Unknown';
      const replacement = rc.Replacement;

      // Promote "Modify" to "Replace" (or "Replace (conditional)" for Conditional) when CFN says
      // the resource will be recreated. The rolled-up Replacement on the resource is enough
      // signal; we don't annotate individual details.
      const displayAction =
        action === 'Modify' && replacement === 'True'
          ? 'Replace'
          : action === 'Modify' && replacement === 'Conditional'
          ? 'Replace (conditional)'
          : action;

      const isReplace = displayAction === 'Replace' || displayAction === 'Replace (conditional)';
      const header = isReplace
        ? chalk.bold.red(`${logicalId} (${resourceType}) ${displayAction}`)
        : [chalk.bold(logicalId), chalk.dim(`(${resourceType})`), colorAction(displayAction)].join(' ');

      lines.push('');
      lines.push(header);

      const details = (rc.Details ?? []).filter(
        (d): d is { Target: { Attribute: string } & NonNullable<typeof d.Target> } => !!d.Target?.Attribute,
      );

      // Align the "before → after" arrow by padding paths to the longest one in this resource.
      // CFN's Target.Path is already a rooted JSON pointer like "/Properties/BucketName". Only
      // fall back to "/Properties/<Name>" when Path is missing. For non-Properties attributes
      // (DeletionPolicy, UpdatePolicy, Metadata, Tags), Path/Name are usually absent so we use
      // the attribute name itself.
      const paths = details.map((d) => {
        const { Attribute: attribute, Path: targetPath, Name: targetName } = d.Target;
        if (targetPath) return targetPath;
        if (attribute === 'Properties') return targetName ? `/Properties/${targetName}` : '/Properties';
        return `/${attribute}`;
      });
      const pathWidth = Math.max(0, ...paths.map((p) => p.length));

      details.forEach((detail, i) => {
        const path = paths[i];
        const before = truncate(detail.Target.BeforeValue);
        const after = truncate(detail.Target.AfterValue);
        const paddedPath = path.padEnd(pathWidth);

        if (before && after) {
          lines.push(`  ${paddedPath}  ${chalk.red(`(-) ${before}`)} ${chalk.dim('→')} ${chalk.green(`(+) ${after}`)}`);
        } else if (after) {
          lines.push(`  ${paddedPath}  ${chalk.green(`(+) ${after}`)}`);
        } else if (before) {
          lines.push(`  ${paddedPath}  ${chalk.red(`(-) ${before}`)}`);
        } else {
          lines.push(`  ${paddedPath}  ${chalk.dim('(changed)')}`);
        }
      });
    }

    return lines.join('\n').trimStart();
  }

  private info(message: string, resource?: DiscoveredResource) {
    const prefix = resource ? `[${resource.category}/${resource.resourceName}] ` : '';
    this.logger.info(`${prefix}${message}`);
  }
}

function buildRefactorDescription(input: CreateStackRefactorCommandInput): string {
  const logicalIds = input.ResourceMappings!.map((m) => m.Source?.LogicalResourceId).join(', ');
  const source = extractStackNameFromId(input.StackDefinitions![0].StackName!);
  const dest = extractStackNameFromId(input.StackDefinitions![1].StackName!);
  return `Move [${logicalIds}] from ${source} to ${dest}`;
}

function formatTemplateBody(templateBody: string): string {
  return JSON.stringify(JSON.parse(templateBody), null, 2) + '\n';
}

interface WriteUpdateSnapshotInput {
  readonly stackName: string;
  readonly templateBody: string;
  readonly parameters: Parameter[];
}

function writeUpdateSnapshot(input: WriteUpdateSnapshotInput): void {
  const stackName = extractStackNameFromId(input.stackName);
  writeRefactorSnapshotFile(
    path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, `update.${stackName}.template.json`),
    formatTemplateBody(input.templateBody),
  );
  writeRefactorSnapshotFile(
    path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, `update.${stackName}.parameters.json`),
    JSON.stringify(input.parameters, null, 2) + '\n',
  );
}

function writeRefactorSnapshot(input: CreateStackRefactorCommandInput): void {
  const source = input.StackDefinitions![0];
  const target = input.StackDefinitions![1];
  const sourceStackName = extractStackNameFromId(source.StackName!);
  const targetStackName = extractStackNameFromId(target.StackName!);
  const description = `refactor.__from__.${sourceStackName}.__to__.${targetStackName}`;
  const basePath = path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, description);
  writeRefactorSnapshotFile(`${basePath}.source.template.json`, formatTemplateBody(source.TemplateBody!));
  writeRefactorSnapshotFile(`${basePath}.target.template.json`, formatTemplateBody(target.TemplateBody!));
  writeRefactorSnapshotFile(
    path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, `${description}.mappings.json`),
    JSON.stringify(input.ResourceMappings ?? [], null, 2) + '\n',
  );
}

const FILENAME_MAPPING_FILE = 'filename-mapping.json';

/**
 * Writes content to a file whose name is a 10-character hash of the original filename.
 * Records the hash→original mapping in a separate JSON file that is updated on each call.
 */
function writeRefactorSnapshotFile(filename: string, content: string): void {
  const hash = crypto.createHash('sha256').update(filename).digest('hex').slice(0, 10);
  const hashedFilename = `${hash}.json`;

  fs.writeFileSync(path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, hashedFilename), content);

  const mappingPath = path.join(REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY, FILENAME_MAPPING_FILE);
  const mapping: Record<string, string> = fs.existsSync(mappingPath) ? JSON.parse(fs.readFileSync(mappingPath, 'utf-8')) : {};
  mapping[hash] = path.basename(filename);
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2) + '\n');
}
