import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation, ValidationResult } from './_common/operation';
import { Plan } from './_common/plan';
import {
  DescribeChangeSetOutput,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetStackPolicyCommand,
  paginateListStackResources,
  SetStackPolicyCommand,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { paginateListTables } from '@aws-sdk/client-dynamodb';
import { DiscoveredResource } from './_common/gen1-app';
import { extractStackNameFromId } from './_common/utils';
import { Cfn } from './_common/cfn';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { detectTemplateDrift, type ResourceChangeWithNested } from '../drift/detect-template-drift';
import { cfnChangesetConsoleUrl } from '../drift/services/drift-formatter';
import chalk from 'chalk';

/**
 * Context attached to a stack when the classifier can associate it with a
 * `DiscoveredResource`. Consumed by `buildRetainOperation` to preserve
 * resource-level `Plan.describe` grouping and nested spinner labels.
 */
interface StackContext {
  readonly resource: DiscoveredResource;
  /** Set on AppSync model nested stacks (Board, Todo, MoodItem, ...). */
  readonly modelName?: string;
  /** Set on AppSync infrastructure sub-stacks (ConnectionStack, FunctionDirectiveStack, CustomResourcesjson). */
  readonly subStackLabel?: string;
}

const GEN2_MIGRATION_ENVIRONMENT_NAME = 'GEN2_MIGRATION_ENVIRONMENT_NAME';

const DYNAMO_DELETION_PROTECTION_PROPERTY = 'DeletionProtectionEnabled';
const DYNAMO_RESOURCE_TYPE = 'AWS::DynamoDB::Table';

const LOCK_STATEMENT = {
  Effect: 'Deny',
  Action: 'Update:*',
  Principal: '*',
  Resource: '*',
};

const isLockStatement = (statement: Record<string, string>): boolean =>
  statement.Effect === LOCK_STATEMENT.Effect &&
  statement.Action === LOCK_STATEMENT.Action &&
  statement.Principal === LOCK_STATEMENT.Principal &&
  statement.Resource === LOCK_STATEMENT.Resource;

const ALLOW_ALL_POLICY = {
  Statement: [
    {
      Effect: 'Allow',
      Action: 'Update:*',
      Principal: '*',
      Resource: '*',
    },
  ],
};

/**
 * Identifies changeset changes that are expected DeletionPolicy drift from the lock step.
 *
 * The lock step adds `DeletionPolicy: Retain` to stateful resources. These show up as:
 * 1. Direct DeletionPolicy changes — Modify with Scope exactly `['DeletionPolicy']`
 * 2. Cascading IAM Policy changes — CFN flags IAM policies that reference the modified
 *    table's attributes (e.g., `TodoTable.Arn` in PolicyDocument) as Dynamic re-evaluations.
 *    These have `ChangeSource: ResourceAttribute`, `Evaluation: Dynamic`,
 *    `RequiresRecreation: Never`, and `CausingEntity` matching `*Table.Arn` or
 *    `*Table.StreamArn` — they are harmless re-evaluations, not actual changes.
 *
 * For lock rollback to determine whether the environment is safe to revert, these expected
 * changes must be filtered out so only real drift blocks the rollback.
 */
const isExpectedLockDrift = (change: ResourceChangeWithNested): boolean => {
  if (change.Action !== 'Modify') return false;

  // Direct DeletionPolicy change on a resource
  if (change.Scope?.length === 1 && change.Scope[0] === 'DeletionPolicy') return true;

  // Cascading IAM Policy change caused by DeletionPolicy modification on a referenced resource.
  // Must be: Properties-only scope, all Details are Dynamic ResourceAttribute re-evaluations
  // with CausingEntity referencing a table attribute (e.g., TodoTable.Arn, TodoTable.StreamArn).
  if (
    change.ResourceType === 'AWS::IAM::Policy' &&
    change.Scope?.length === 1 &&
    change.Scope[0] === 'Properties' &&
    change.Details?.length
  ) {
    return change.Details.every(
      (d) =>
        d.ChangeSource === 'ResourceAttribute' &&
        d.Evaluation === 'Dynamic' &&
        d.Target?.RequiresRecreation === 'Never' &&
        /Table\.(Arn|StreamArn)$/.test(d.CausingEntity ?? ''),
    );
  }

  return false;
};

/**
 * Recursively walks the change tree to find any leaf resource changes that are
 * not expected lock drift. AWS::CloudFormation::Stack entries are structural
 * wrappers — their nestedChanges contain the actual resource-level changes.
 */
function hasRealDrift(changes: ResourceChangeWithNested[]): boolean {
  for (const change of changes) {
    if (change.nestedChanges?.length) {
      if (hasRealDrift(change.nestedChanges)) return true;
    } else if (change.ResourceType !== 'AWS::CloudFormation::Stack') {
      if (!isExpectedLockDrift(change)) return true;
    } else if (change.Action !== 'Modify') {
      // Add/Remove on a CloudFormation::Stack without nestedChanges is real drift —
      // an entire nested stack was added or deleted outside Amplify.
      return true;
    }
  }
  return false;
}

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[] | undefined;

  public async forward(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    // ============================================================
    // Validations
    // ============================================================

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Environment Healthy', run: () => this.validateDeploymentStatus() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Drift', run: () => this.validateDrift() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    // ============================================================
    // Project Level Operations
    // ============================================================

    operations.push({
      validate: () => undefined,
      describe: async () => [`Add environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}' (value: ${this.gen1App.envName})`],
      execute: async () => {
        const app = await this.gen1App.clients.amplify.send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = { ...(app.app?.environmentVariables ?? {}), [GEN2_MIGRATION_ENVIRONMENT_NAME]: this.gen1App.envName };
        await this.gen1App.clients.amplify.send(new UpdateAppCommand({ appId: this.gen1App.appId, environmentVariables }));
        this.logger.info(`Added '${GEN2_MIGRATION_ENVIRONMENT_NAME}' environment variable (value: ${this.gen1App.envName})`);
      },
    });

    // ============================================================
    // Retain every resource in every stack (top-down). Must run
    // before the lock deny statement is set; otherwise the deny
    // would block these updates.
    // ============================================================

    const stackIds = await this.walkStackHierarchy(this.gen1App.rootStackName);
    this.logger.info(`Discovered ${stackIds.length} stacks`);
    const stackContext = await this.classifyStacks();
    for (const stackId of stackIds) {
      operations.push(this.buildRetainOperation(stackId, stackContext.get(stackId)));
    }

    operations.push({
      validate: () => undefined,
      describe: async () => {
        return [`Add lock statement to stack policy on '${this.gen1App.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`];
      },
      execute: async () => {
        const existingPolicy = await this.fetchExistingStackPolicy();
        const alreadyLocked = existingPolicy.Statement.some(isLockStatement);
        if (alreadyLocked) {
          this.logger.info(`Lock statement already exists in stack policy on '${this.gen1App.rootStackName}', skipping`);
          return;
        }
        existingPolicy.Statement.push(LOCK_STATEMENT);
        const mergedPolicy = JSON.stringify(existingPolicy);
        await this.gen1App.clients.cloudFormation.send(
          new SetStackPolicyCommand({
            StackName: this.gen1App.rootStackName,
            StackPolicyBody: mergedPolicy,
          }),
        );
        this.logger.info(`Successfully added lock statement to stack policy on '${this.gen1App.rootStackName}'`);
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        `You will not be able to run 'amplify push' on '${this.gen1App.appName}/${this.gen1App.envName}'`,
        `You will not be able to migrate another environment until migration of '${this.gen1App.appName}/${this.gen1App.envName}' is complete or rolled back`,
      ],
    });
  }

  public async rollback(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Drift', run: () => this.validateLockRollbackDrift() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    // ============================================================
    // Project Level Operations
    // ============================================================

    operations.push({
      validate: () => undefined,
      describe: async () => [`Remove environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}'`],
      execute: async () => {
        const app = await this.gen1App.clients.amplify.send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = app.app?.environmentVariables ?? {};
        delete environmentVariables[GEN2_MIGRATION_ENVIRONMENT_NAME];
        await this.gen1App.clients.amplify.send(new UpdateAppCommand({ appId: this.gen1App.appId, environmentVariables }));
        this.logger.info(`Removed ${GEN2_MIGRATION_ENVIRONMENT_NAME} environment variable`);
      },
    });

    operations.push({
      validate: () => undefined,
      describe: async () => {
        return [`Remove lock statement from stack policy on '${this.gen1App.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`];
      },
      execute: async () => {
        const existingPolicy = await this.fetchExistingStackPolicy();
        const index = existingPolicy.Statement.findIndex(isLockStatement);
        if (index === -1) {
          this.logger.info(`Lock statement not found in stack policy on '${this.gen1App.rootStackName}'`);
          return;
        }
        existingPolicy.Statement.splice(index, 1);
        const restoredPolicy = existingPolicy.Statement.length > 0 ? JSON.stringify(existingPolicy) : JSON.stringify(ALLOW_ALL_POLICY);
        await this.gen1App.clients.cloudFormation.send(
          new SetStackPolicyCommand({
            StackName: this.gen1App.rootStackName,
            StackPolicyBody: restoredPolicy,
          }),
        );
        this.logger.info(
          `Successfully removed lock statement from stack policy on '${this.gen1App.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`,
        );
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Rollback',
      implications: [
        `You will be able to run 'amplify push' on '${this.gen1App.appName}/${this.gen1App.envName}'`,
        `You will be able to start migration on a different environment (lock on '${this.gen1App.appName}/${this.gen1App.envName}' will be released)`,
      ],
    });
  }

  private async validateDeploymentStatus(): Promise<ValidationResult> {
    try {
      await this.validations.validateDeploymentStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async validateDrift(): Promise<ValidationResult> {
    try {
      await this.validations.validateDrift();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  /**
   * Validates that the environment is safe for lock rollback by running template drift
   * detection and filtering out expected DeletionPolicy changes from the lock step.
   *
   * If only DeletionPolicy drift remains (from the lock step adding Retain), rollback
   * is safe. If any real drift exists, rollback must be blocked — the environment is
   * in an inconsistent state.
   */
  private async validateLockRollbackDrift(): Promise<ValidationResult> {
    try {
      const driftResults = await detectTemplateDrift(this.gen1App.rootStackName, this.logger, this.gen1App.clients.cloudFormation);

      if (driftResults.skipped) {
        return { valid: false, report: `Template drift detection was skipped: ${driftResults.skipReason}` };
      }

      if (driftResults.incompleteStacks?.length) {
        return {
          valid: false,
          report: `Could not verify all stacks for drift: ${driftResults.incompleteStacks.join(', ')}`,
        };
      }

      // Check incompleteStacks before hasRealDrift — incomplete stacks mean we can't
      // trust that the absence of real drift is accurate.
      if (hasRealDrift(driftResults.changes)) {
        return {
          valid: false,
          report: 'Template drift detected beyond expected DeletionPolicy changes',
        };
      }

      return { valid: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return { valid: false, report: e?.message ?? String(e) };
    }
  }

  private async findGraphQLApiId(): Promise<string | undefined> {
    const graphQL = this.gen1App.discover().find((r) => r.category === 'api' && r.service === 'AppSync');
    if (!graphQL) {
      // project doesn't have a GraphQL API
      return undefined;
    }
    return this.gen1App.resourceMetaOutput(graphQL, 'GraphQLAPIIdOutput');
  }

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

  private async dynamoTableNames(): Promise<string[]> {
    if (!this._dynamoTableNames) {
      const graphQLApiId = await this.findGraphQLApiId();
      if (!graphQLApiId) {
        // not all apps have a graphql server
        this._dynamoTableNames = [];
      } else {
        this._dynamoTableNames = await this.fetchGraphQLModelTables(graphQLApiId);
      }
    }
    return this._dynamoTableNames;
  }

  private async fetchExistingStackPolicy(): Promise<{ Statement: Record<string, string>[] }> {
    const response = await this.gen1App.clients.cloudFormation.send(
      new GetStackPolicyCommand({
        StackName: this.gen1App.rootStackName,
      }),
    );
    if (response.StackPolicyBody) {
      return JSON.parse(response.StackPolicyBody) as { Statement: Record<string, string>[] };
    }
    return { Statement: [] };
  }

  private async listNestedStack(rootStack: string): Promise<StackResource[]> {
    const response = await this.gen1App.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: rootStack }));
    return (response.StackResources ?? []).filter((r) => r.ResourceType === 'AWS::CloudFormation::Stack');
  }

  private findNestedStack(nestedStacks: StackResource[], logicalIdPrefix: string) {
    const stackId = nestedStacks.find((s) => s.LogicalResourceId?.startsWith(logicalIdPrefix))?.PhysicalResourceId;
    if (!stackId) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to find nested stack logical id prefix: ${logicalIdPrefix}`,
      });
    }
    return stackId;
  }

  /**
   * Returns an `AmplifyMigrationOperation` that, on execute, applies
   * retain to every resource in the stack identified by `stackId` using
   * the proven lazy flow: fetch template → mutate → createChangeSet →
   * validate → executeChangeSet, all back-to-back on one stack. No window
   * for the changeset to go OBSOLETE via a parent update in between.
   *
   * When `ctx` is provided the operation carries its `resource:` so
   * `Plan.describe` groups it under
   * `Resource: <category>/<name> (<service>)`. During execute, the
   * matching `logger.push` labels appear on the spinner:
   * `category/name (service)` → optional `modelName` or
   * `subStackLabel` → `stackName (Create ChangeSet)`.
   *
   * Idempotent on reruns: if every resource already has retain (and
   * every DynamoDB table has `DeletionProtectionEnabled === true`), the
   * whole CFN round-trip is skipped. This keeps the flow safe to re-run
   * and also avoids emitting a changeset whose only content would be
   * Dynamic/Automatic nested-stack re-evaluations, which would clobber
   * retained state via TemplateURL reconciliation.
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

          const needsChange = Object.values(template.Resources).some((r) => {
            if (r.DeletionPolicy !== 'Retain' || r.UpdateReplacePolicy !== 'Retain') return true;
            if (r.Type === DYNAMO_RESOURCE_TYPE && r.Properties[DYNAMO_DELETION_PROTECTION_PROPERTY] !== true) return true;
            return false;
          });

          if (!needsChange) {
            this.logger.info(`${stackName} — no retain changes needed`);
            return;
          }

          for (const resource of Object.values(template.Resources)) {
            resource.DeletionPolicy = 'Retain';
            resource.UpdateReplacePolicy = 'Retain';
            if (resource.Type === DYNAMO_RESOURCE_TYPE) {
              // https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-dynamodb-table.html#cfn-dynamodb-table-deletionprotectionenabled
              resource.Properties[DYNAMO_DELETION_PROTECTION_PROPERTY] = true;
            }
          }

          const describeResponse = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: stackId }));
          const parameters = (describeResponse.Stacks?.[0]?.Parameters ?? []).map((p) => ({
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

          if (!this.isAllowedRetainEverythingChangeset(changeset)) {
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
   * Builds a `Map<stackId, StackContext>` that associates each discoverable
   * nested stack with the `DiscoveredResource` it belongs to, so the
   * retain-everything flow can preserve resource-level `Plan.describe`
   * grouping and nested `logger.push` labels.
   *
   * Stacks not present in the map (typically: root) fall through to the
   * default `Project` group with stack-name-only labels.
   *
   * Failures to locate a specific nested stack (e.g., resource in
   * amplify-meta but never pushed) are logged at debug level and skipped;
   * classification never fails lock.
   */
  private async classifyStacks(): Promise<Map<string, StackContext>> {
    const context = new Map<string, StackContext>();
    const rootNestedStacks = await this.listNestedStack(this.gen1App.rootStackName);

    for (const resource of this.gen1App.discover()) {
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
   * Walks the Gen1 stack hierarchy top-down (pre-order). Each stack appears
   * before all of its descendants. Used by the retain-everything flow so we
   * update each stack before any of its descendants can carry direct-edit
   * drift that would be clobbered by CloudFormation's parent-driven
   * reconciliation on subsequent parent updates.
   */
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

  /**
   * Changeset whitelist for the retain-everything flow. Accepts `Modify`
   * actions whose every `Details` entry is one of:
   *
   * - Static `DirectModification` targeting `DeletionPolicy` or
   *   `UpdateReplacePolicy` with `AfterValue: 'Retain'`. Produced by our
   *   template mutation on every resource.
   * - Static `DirectModification` targeting
   *   `Properties.DeletionProtectionEnabled` on an `AWS::DynamoDB::Table`
   *   with `AfterValue: 'true'`. Produced by our template mutation on
   *   DynamoDB tables.
   * - Dynamic `Automatic` re-evaluation on an
   *   `AWS::CloudFormation::Stack` reference entry. CloudFormation emits
   *   these on every parent update — see
   *   https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_ResourceChangeDetail.html.
   * - Dynamic `ResourceAttribute` re-evaluation on an `AWS::IAM::Policy`
   *   whose `CausingEntity` matches `*Table.(Arn|StreamArn)`. These
   *   cascade from DynamoDB retain edits and are harmless — mirrors
   *   `isExpectedLockDrift`'s IAM policy cascade acceptance.
   *
   * Every change must contain at least one real retain edit. A change
   * made up purely of Dynamic re-evaluations indicates we're about to
   * execute a parent update whose only effect is reconciling children —
   * the failure mode that clobbers retained state via TemplateURL
   * re-fetch.
   */
  private isAllowedRetainEverythingChangeset(changeSet: DescribeChangeSetOutput): boolean {
    const changes = changeSet.Changes ?? [];
    if (changes.length === 0) return true;

    for (const change of changes) {
      const rc = change.ResourceChange;
      if (!rc) return false;
      if (rc.Action !== 'Modify') return false;
      if (rc.Replacement === 'True') return false;

      const details = rc.Details ?? [];
      if (details.length === 0) return false;

      let sawRetainEdit = false;

      for (const detail of details) {
        const attr = detail.Target?.Attribute;
        const name = detail.Target?.Name;
        const after = detail.Target?.AfterValue;

        if ((attr === 'DeletionPolicy' || attr === 'UpdateReplacePolicy') && after === 'Retain') {
          sawRetainEdit = true;
          continue;
        }

        const isDynamoDeletionProtection =
          rc.ResourceType === DYNAMO_RESOURCE_TYPE &&
          attr === 'Properties' &&
          name === DYNAMO_DELETION_PROTECTION_PROPERTY &&
          after === 'true';
        if (isDynamoDeletionProtection) {
          sawRetainEdit = true;
          continue;
        }

        const isDynamicNestedStackReEvaluation =
          rc.ResourceType === 'AWS::CloudFormation::Stack' &&
          attr === 'Properties' &&
          detail.Target?.RequiresRecreation === 'Never' &&
          detail.Evaluation === 'Dynamic' &&
          detail.ChangeSource === 'Automatic';
        if (isDynamicNestedStackReEvaluation) continue;

        const isDynamoIamPolicyCascade =
          rc.ResourceType === 'AWS::IAM::Policy' &&
          attr === 'Properties' &&
          detail.Target?.RequiresRecreation === 'Never' &&
          detail.Evaluation === 'Dynamic' &&
          detail.ChangeSource === 'ResourceAttribute' &&
          /Table\.(Arn|StreamArn)$/.test(detail.CausingEntity ?? '');
        if (isDynamoIamPolicyCascade) continue;

        return false;
      }

      if (!sawRetainEdit) return false;
    }

    return true;
  }
}
