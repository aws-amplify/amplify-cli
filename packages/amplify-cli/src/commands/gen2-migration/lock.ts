import { AmplifyMigrationStep } from './_infra/step';
import { AmplifyMigrationOperation, ValidationResult } from './_infra/operation';
import { Plan } from './_infra/plan';
import { extractCategory } from './_infra/categories';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import {
  CreateChangeSetCommand,
  DeleteChangeSetCommand,
  DescribeChangeSetCommand,
  type DescribeChangeSetOutput,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetStackPolicyCommand,
  GetTemplateCommand,
  ListStackResourcesCommand,
  SetStackPolicyCommand,
  UpdateStackCommand,
  waitUntilChangeSetCreateComplete,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { detectTemplateDrift, type ResourceChangeWithNested } from '../drift-detection/detect-template-drift';

const GEN2_MIGRATION_ENVIRONMENT_NAME = 'GEN2_MIGRATION_ENVIRONMENT_NAME';

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
  private _dynamoTableNames: string[];

  public async forward(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Environment Status', run: () => this.validateDeploymentStatus() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Drift', run: () => this.validateDrift() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    for (const tableName of await this.dynamoTableNames()) {
      operations.push({
        validate: () => undefined,
        describe: async () => [`Enable deletion protection for table '${tableName}'`],
        execute: async () => {
          await this.gen1App.clients.dynamoDB.send(
            new UpdateTableCommand({
              TableName: tableName,
              DeletionProtectionEnabled: true,
            }),
          );
          this.logger.info(`Enabled deletion protection for table '${tableName}'`);
        },
      });
    }

    operations.push({
      validate: () => undefined,
      describe: async () => [`Add environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}' (value: ${this.gen1App.envName})`],
      execute: async () => {
        const app = await this.gen1App.clients.amplify.send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = { ...(app.app.environmentVariables ?? {}), [GEN2_MIGRATION_ENVIRONMENT_NAME]: this.gen1App.envName };
        await this.gen1App.clients.amplify.send(new UpdateAppCommand({ appId: this.gen1App.appId, environmentVariables }));
        this.logger.info(`Added '${GEN2_MIGRATION_ENVIRONMENT_NAME}' environment variable (value: ${this.gen1App.envName})`);
      },
    });

    if ((await this.dynamoTableNames()).length > 0) {
      operations.push({
        validate: () => undefined,
        describe: async () => {
          return [`Set DeletionPolicy to Retain for DynamoDB tables in API stacks`];
        },
        execute: async () => {
          const apiStackIds = await this.findApiCategoryStacks();
          for (const apiStackId of apiStackIds) {
            await this.setDeletionPolicyRetainOnDynamoTables(apiStackId);
          }
          this.logger.info('Successfully set DeletionPolicy to Retain for DynamoDB tables');
        },
      });
    }

    operations.push({
      validate: () => undefined,
      describe: async () => {
        return [`Add lock statement to stack policy on '${this.gen1App.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`];
      },
      execute: async () => {
        const existingPolicy = await this.getExistingStackPolicy();
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
        `You will not be able to run 'amplify push' on environment '${this.gen1App.envName}'`,
        `You will not be able to migrate another environment until migration of '${this.gen1App.envName}' is complete or rolled back`,
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

    for (const tableName of await this.dynamoTableNames()) {
      operations.push({
        validate: () => undefined,
        describe: async () => [`Preserve deletion protection for table '${tableName}'`],
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      });
    }

    operations.push({
      validate: () => undefined,
      describe: async () => [`Remove environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}'`],
      execute: async () => {
        const app = await this.gen1App.clients.amplify.send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = app.app.environmentVariables ?? {};
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
        const existingPolicy = await this.getExistingStackPolicy();
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
        `You will be able to run 'amplify push' on environment '${this.gen1App.envName}'`,
        `You will be able to start migration of another environment`,
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
    return this.gen1App.metaOutput(graphQL.category, graphQL.resourceName, 'GraphQLAPIIdOutput');
  }

  private async fetchGraphQLModelTables(graphQLApiId: string): Promise<string[]> {
    const tables = [];
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

  private async findApiCategoryStacks(): Promise<string[]> {
    const response = await this.gen1App.clients.cloudFormation.send(
      new DescribeStackResourcesCommand({ StackName: this.gen1App.rootStackName }),
    );
    const stackResources = response.StackResources ?? [];
    return stackResources
      .filter(
        (resource) =>
          resource.ResourceType === 'AWS::CloudFormation::Stack' &&
          extractCategory(resource.LogicalResourceId ?? '') === 'Api' &&
          resource.PhysicalResourceId,
      )
      .map((resource) => resource.PhysicalResourceId as string);
  }

  private async setDeletionPolicyRetainOnDynamoTables(stackId: string): Promise<void> {
    // List the API stack's resources to find model nested stacks
    let nextToken: string | undefined;
    const modelStackIds: string[] = [];

    do {
      const response = await this.gen1App.clients.cloudFormation.send(
        new ListStackResourcesCommand({ StackName: stackId, NextToken: nextToken }),
      );
      nextToken = response.NextToken;

      for (const resource of response.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          modelStackIds.push(resource.PhysicalResourceId);
        }
      }
    } while (nextToken);

    // Update each model stack's template to set DeletionPolicy: Retain on DynamoDB tables
    for (const modelStackId of modelStackIds) {
      const templateResponse = await this.gen1App.clients.cloudFormation.send(new GetTemplateCommand({ StackName: modelStackId }));
      if (!templateResponse.TemplateBody) {
        throw new AmplifyError('MigrationError', {
          message: `Could not retrieve template for stack ${modelStackId}`,
        });
      }

      const template = JSON.parse(templateResponse.TemplateBody);
      const resources = template.Resources;

      let modified = false;
      for (const logicalId of Object.keys(resources)) {
        const resource = resources[logicalId];
        if (resource.Type === 'AWS::DynamoDB::Table' && resource.DeletionPolicy !== 'Retain') {
          resource.DeletionPolicy = 'Retain';
          this.logger.info(`Set DeletionPolicy to Retain for table '${logicalId}'`);
          modified = true;
        }
      }

      if (modified) {
        const describeResponse = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: modelStackId }));
        const parameters = (describeResponse.Stacks?.[0]?.Parameters ?? []).map((p) => ({
          ParameterKey: p.ParameterKey,
          UsePreviousValue: true,
        }));

        const changeSetName = `deletion-policy-retain-${Date.now()}`;

        await this.gen1App.clients.cloudFormation.send(
          new CreateChangeSetCommand({
            StackName: modelStackId,
            ChangeSetName: changeSetName,
            TemplateBody: JSON.stringify(template),
            Parameters: parameters,
            Capabilities: ['CAPABILITY_NAMED_IAM'],
          }),
        );

        await waitUntilChangeSetCreateComplete(
          { client: this.gen1App.clients.cloudFormation, maxWaitTime: 120 },
          { StackName: modelStackId, ChangeSetName: changeSetName },
        );

        const changeSet = await this.gen1App.clients.cloudFormation.send(
          new DescribeChangeSetCommand({ StackName: modelStackId, ChangeSetName: changeSetName }),
        );

        this.validateDeletionPolicyChangeset(changeSet, modelStackId, changeSetName);

        await this.gen1App.clients.cloudFormation.send(
          new DeleteChangeSetCommand({ StackName: modelStackId, ChangeSetName: changeSetName }),
        );

        this.logger.info(`Updating stack ${modelStackId} with DeletionPolicy changes...`);
        await this.gen1App.clients.cloudFormation.send(
          new UpdateStackCommand({
            StackName: modelStackId,
            TemplateBody: JSON.stringify(template),
            Parameters: parameters,
            Capabilities: ['CAPABILITY_NAMED_IAM'],
          }),
        );
        await waitUntilStackUpdateComplete({ client: this.gen1App.clients.cloudFormation, maxWaitTime: 900 }, { StackName: modelStackId });
        this.logger.info(`Successfully updated stack ${modelStackId}`);
      }
    }
  }

  /** Validates that a changeset only contains expected changes from setting DeletionPolicy on DynamoDB tables. */
  private validateDeletionPolicyChangeset(changeSet: DescribeChangeSetOutput, stackId: string, changeSetName: string): void {
    const changes = changeSet.Changes ?? [];

    const allowedModifyTypes = new Set(['AWS::DynamoDB::Table', 'AWS::IAM::Policy']);

    const unexpected = changes.filter((change) => {
      const rc = change.ResourceChange;
      if (!rc) return false; // Not a resource change — irrelevant to this validation
      return rc.Action !== 'Modify' || !allowedModifyTypes.has(rc.ResourceType!);
    });

    if (unexpected.length > 0) {
      const descriptions = unexpected.map((c) => {
        const rc = c.ResourceChange!; // Safe: filter guarantees rc is defined
        return `${rc.Action ?? 'Unknown'} ${rc.ResourceType ?? 'Unknown'} (${rc.LogicalResourceId ?? 'Unknown'})`;
      });

      void this.gen1App.clients.cloudFormation
        .send(new DeleteChangeSetCommand({ StackName: stackId, ChangeSetName: changeSetName }))
        .catch((e: any) => this.logger.debug(`Failed to clean up changeset ${changeSetName}: ${e.message}`));

      throw new AmplifyError('MigrationError', {
        message: [
          `Changeset for stack '${stackId}' contains unexpected changes:`,
          ...descriptions.map((d) => `  - ${d}`),
          '',
          'Expected only Modify actions on AWS::DynamoDB::Table and AWS::IAM::Policy resources.',
        ].join('\n'),
        resolution: 'This may indicate template drift. Resolve the drift before proceeding with migration.',
      });
    }
  }

  private async getExistingStackPolicy(): Promise<{ Statement: Record<string, string>[] }> {
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
}
