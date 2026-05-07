import { Plan } from './_common/plan';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation } from './_common/operation';
import {
  DescribeChangeSetOutput,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  paginateListStackResources,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import { paginateListTables } from '@aws-sdk/client-dynamodb';
import { DiscoveredResource } from './_common/gen1-app';
import { Cfn } from './_common/cfn';
import { extractStackNameFromId } from './_common/utils';
import { AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { cfnChangesetConsoleUrl } from '../drift/services/drift-formatter';
import chalk from 'chalk';

/**
 * Stack context used by `Plan.describe` and the execute-time spinner to
 * group operations by the `DiscoveredResource` they belong to.
 */
interface StackContext {
  readonly resource: DiscoveredResource;

  /**
   * Name of the AppSync `@model` type owning this stack.
   * Present for per-model nested stacks like Board, Todo, MoodItem.
   */
  readonly modelName?: string;

  /**
   * Logical id of the AppSync infrastructure sub-stack.
   */
  readonly subStackLabel?: string;
}

/**
 * Applies `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` to every
 * non-`AWS::CloudFormation::Stack` resource in every Gen1 stack below the root.
 *
 * Walks top-down, fetches each template lazily, creates a changeset, validates
 * it, and executes it before moving to the next stack. Nested stack references
 * are left untouched and the root stack is skipped entirely.
 *
 * Once applied, deleting the root stack manually cascades delete through the
 * tree and every retained resource survives as an orphan resource.
 */
export class AmplifyMigrationRetainStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[] | undefined;

  public async forward(): Promise<Plan> {
    const stackIds = await this.walkStackHierarchy(this.gen1App.rootStackName);
    this.logger.info(`Discovered ${stackIds.length} stacks below root`);

    const stackContext = await this.classifyStacks();
    const operations: AmplifyMigrationOperation[] = stackIds.map((stackId) =>
      this.buildRetainOperation(stackId, stackContext.get(stackId)),
    );

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        'Retain policies will be applied to every resource in every Gen1 stack below the root',
        'The root stack is not touched (no changeset is executed on it)',
        'When you later delete the root stack, all retained resources will survive as orphaned resources',
      ],
    });
  }

  public rollback(): Promise<Plan> {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Rollback is not supported for the retain step',
      resolution: 'Retain only marks resources with DeletionPolicy: Retain. To undo, manually update the CloudFormation templates.',
    });
  }

  /**
   * Returns every stack in the Gen1 hierarchy below the root, in pre-order.
   */
  private async walkStackHierarchy(rootStackId: string): Promise<string[]> {
    const result: string[] = [];
    await this.walkChildren(rootStackId, result);
    return result;
  }

  private async walkChildren(stackId: string, result: string[]): Promise<void> {
    const pages = paginateListStackResources({ client: this.gen1App.clients.cloudFormation }, { StackName: stackId });
    for await (const page of pages) {
      for (const resource of page.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          result.push(resource.PhysicalResourceId);
          await this.walkChildren(resource.PhysicalResourceId, result);
        }
      }
    }
  }

  /**
   * Associates each nested stack with its Amplify `DiscoveredResource`. Stacks
   * not classified fall through to the default `Project` group.
   *
   * Purely for UX — the returned map drives `Plan.describe` grouping and the
   * execute-time spinner labels. Has no effect on the retain logic itself.
   *
   * For AppSync: the api-stack is tagged with the api resource, per-model
   * nested stacks carry `modelName`, and ConnectionStack/FunctionDirectiveStack/
   * CustomResourcesjson carry `subStackLabel`.
   */
  private async classifyStacks(): Promise<Map<string, StackContext>> {
    const context = new Map<string, StackContext>();
    const discovered = this.gen1App.discover();
    if (discovered.length === 0) return context;

    const rootNestedStacks = await this.listNestedStack(this.gen1App.rootStackName);

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
        case 'auth:Cognito-UserPool-Groups':
        case 'storage:S3':
        case 'storage:DynamoDB':
        case 'analytics:Kinesis':
        case 'function:Lambda':
        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
        case 'geo:GeofenceCollection': {
          const stackId = this.findNestedStack(rootNestedStacks, `${resource.category}${resource.resourceName}`);
          context.set(stackId, { resource });
          break;
        }
        case 'api:AppSync': {
          const apiStackId = this.findNestedStack(rootNestedStacks, `api${resource.resourceName}`);
          context.set(apiStackId, { resource });

          const apiNestedStacks = await this.listNestedStack(apiStackId);
          const modelNames = new Set((await this.dynamoTableNames()).map((t) => t.split('-')[0]));

          for (const child of apiNestedStacks) {
            const logicalId = child.LogicalResourceId;
            const childStackId = child.PhysicalResourceId;
            if (!logicalId || !childStackId) continue;

            if (modelNames.has(logicalId)) {
              context.set(childStackId, { resource, modelName: logicalId });
            } else if (logicalId === 'ConnectionStack' || logicalId === 'FunctionDirectiveStack' || logicalId === 'CustomResourcesjson') {
              context.set(childStackId, { resource, subStackLabel: logicalId });
            }
          }
          break;
        }
        case 'UNKNOWN':
          break;
      }
    }

    return context;
  }

  /**
   * Builds one operation that, on execute, applies retain to every non-stack
   * resource in the given stack via a single createChangeSet → validate →
   * executeChangeSet round-trip. Skips the round-trip when the template is
   * already fully retained.
   */
  private buildRetainOperation(stackId: string, ctx?: StackContext): AmplifyMigrationOperation {
    const cfn = new Cfn(this.gen1App.clients.cloudFormation, this.logger);
    const stackName = extractStackNameFromId(stackId);

    const describeSuffix = ctx?.modelName ? ` (model: ${ctx.modelName})` : ctx?.subStackLabel ? ` (${ctx.subStackLabel})` : '';

    return {
      resource: ctx?.resource,
      describe: async () => [`Set Retain policies on resources in '${stackName}'${describeSuffix}`],
      validate: () => undefined,
      execute: async () => {
        let pushed = 0;
        if (ctx) {
          this.logger.push(`${ctx.resource.category}/${ctx.resource.resourceName} (${ctx.resource.service})`);
          pushed++;
          if (ctx.modelName) {
            this.logger.push(ctx.modelName);
            pushed++;
          } else if (ctx.subStackLabel) {
            this.logger.push(ctx.subStackLabel);
            pushed++;
          }
        }
        try {
          const template = await cfn.fetchTemplate(stackId);

          const targetEntries = Object.values(template.Resources).filter((r) => r.Type !== 'AWS::CloudFormation::Stack');
          if (targetEntries.length === 0) {
            this.logger.info(`${stackName} — no non-nested-stack resources to retain`);
            return;
          }

          const needsChange = targetEntries.some((r) => r.DeletionPolicy !== 'Retain' || r.UpdateReplacePolicy !== 'Retain');
          if (!needsChange) {
            this.logger.info(`${stackName} — no retain changes needed`);
            return;
          }

          for (const resource of targetEntries) {
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
        } finally {
          for (let i = 0; i < pushed; i++) this.logger.pop();
        }
      },
    };
  }

  /**
   * Whitelists a retain-only changeset.
   *
   * Accepts two kinds of changes:
   * - Direct `DeletionPolicy` or `UpdateReplacePolicy` edits targeting `Retain`.
   * - CFN's own no-op Automatic/Dynamic re-evaluations on
   *   `AWS::CloudFormation::Stack` references, emitted on every parent update.
   */
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

      const isNestedStackAutomaticReEval =
        rc.ResourceType === 'AWS::CloudFormation::Stack' &&
        details.every(
          (d) =>
            d.Target?.Attribute === 'Properties' &&
            d.Target?.RequiresRecreation === 'Never' &&
            d.Evaluation === 'Dynamic' &&
            d.ChangeSource === 'Automatic',
        );
      if (isNestedStackAutomaticReEval) continue;

      for (const detail of details) {
        const attr = detail.Target?.Attribute;
        const after = detail.Target?.AfterValue;
        if (attr !== 'DeletionPolicy' && attr !== 'UpdateReplacePolicy') return false;
        if (after !== 'Retain') return false;
      }
    }

    return true;
  }

  // ============================================================
  // Helpers for classifyStacks
  // ============================================================

  /** Returns root's direct nested-stack children. */
  private async listNestedStack(rootStack: string): Promise<StackResource[]> {
    const response = await this.gen1App.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: rootStack }));
    return (response.StackResources ?? []).filter((r) => r.ResourceType === 'AWS::CloudFormation::Stack');
  }

  /** Returns the stack id whose logical id starts with the given prefix; throws if none found. */
  private findNestedStack(nestedStacks: StackResource[], logicalIdPrefix: string): string {
    const stackId = nestedStacks.find((s) => s.LogicalResourceId?.startsWith(logicalIdPrefix))?.PhysicalResourceId;
    if (!stackId) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to find nested stack logical id prefix: ${logicalIdPrefix}`,
      });
    }
    return stackId;
  }

  /** Returns the AppSync API id from amplify-meta.json, or undefined if the project has no GraphQL API. */
  private async findGraphQLApiId(): Promise<string | undefined> {
    const graphQL = this.gen1App.discover().find((r) => r.category === 'api' && r.service === 'AppSync');
    if (!graphQL) return undefined;
    return this.gen1App.resourceMetaOutput(graphQL, 'GraphQLAPIIdOutput');
  }

  /** Lists DynamoDB tables whose names contain `-<apiId>-<env>` — i.e., the per-model tables of this API. */
  private async fetchGraphQLModelTables(graphQLApiId: string): Promise<string[]> {
    const tables: string[] = [];
    for await (const page of paginateListTables({ client: this.gen1App.clients.dynamoDB }, {})) {
      for (const tableName of page.TableNames ?? []) {
        if (tableName.includes(`-${graphQLApiId}-${this.gen1App.envName}`)) {
          tables.push(tableName);
        }
      }
    }
    return tables;
  }

  /** Cached accessor for model table names — the set of @model types in the AppSync schema. */
  private async dynamoTableNames(): Promise<string[]> {
    if (!this._dynamoTableNames) {
      const graphQLApiId = await this.findGraphQLApiId();
      this._dynamoTableNames = graphQLApiId ? await this.fetchGraphQLModelTables(graphQLApiId) : [];
    }
    return this._dynamoTableNames;
  }
}
