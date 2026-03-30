import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation, ValidationResult } from './_operation';
import { Plan } from './_plan';
import { extractCategory } from './categories';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
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
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { AmplifyGen2MigrationValidations } from './_validations';

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

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[];

  private _ddbClient: DynamoDBClient;
  private _amplifyClient: AmplifyClient;
  private _cfnClient: CloudFormationClient;

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
          await this.ddbClient().send(
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
      describe: async () => [`Add environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}' (value: ${this.currentEnvName})`],
      execute: async () => {
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.appId }));
        const environmentVariables = { ...(app.app.environmentVariables ?? {}), [GEN2_MIGRATION_ENVIRONMENT_NAME]: this.currentEnvName };
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.appId, environmentVariables }));
        this.logger.info(`Added '${GEN2_MIGRATION_ENVIRONMENT_NAME}' environment variable (value: ${this.currentEnvName})`);
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
        return [`Add lock statement to stack policy on '${this.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`];
      },
      execute: async () => {
        const existingPolicy = await this.getExistingStackPolicy();
        const alreadyLocked = existingPolicy.Statement.some(isLockStatement);
        if (alreadyLocked) {
          this.logger.info(`Lock statement already exists in stack policy on '${this.rootStackName}', skipping`);
          return;
        }
        existingPolicy.Statement.push(LOCK_STATEMENT);
        const mergedPolicy = JSON.stringify(existingPolicy);
        await this.cfnClient().send(
          new SetStackPolicyCommand({
            StackName: this.rootStackName,
            StackPolicyBody: mergedPolicy,
          }),
        );
        this.logger.info(`Successfully added lock statement to stack policy on '${this.rootStackName}'`);
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        `You will not be able to run 'amplify push' on environment '${this.currentEnvName}'`,
        `You will not be able to migrate another environment until migration of '${this.currentEnvName}' is complete or rolled back`,
      ],
    });
  }

  public async rollback(): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

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
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.appId }));
        const environmentVariables = app.app.environmentVariables ?? {};
        delete environmentVariables[GEN2_MIGRATION_ENVIRONMENT_NAME];
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.appId, environmentVariables }));
        this.logger.info(`Removed ${GEN2_MIGRATION_ENVIRONMENT_NAME} environment variable`);
      },
    });

    operations.push({
      validate: () => undefined,
      describe: async () => {
        return [`Remove lock statement from stack policy on '${this.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`];
      },
      execute: async () => {
        const existingPolicy = await this.getExistingStackPolicy();
        const index = existingPolicy.Statement.findIndex(isLockStatement);
        if (index === -1) {
          this.logger.info(`Lock statement not found in stack policy on '${this.rootStackName}'`);
          return;
        }
        existingPolicy.Statement.splice(index, 1);
        const restoredPolicy = existingPolicy.Statement.length > 0 ? JSON.stringify(existingPolicy) : JSON.stringify(ALLOW_ALL_POLICY);
        await this.cfnClient().send(
          new SetStackPolicyCommand({
            StackName: this.rootStackName,
            StackPolicyBody: restoredPolicy,
          }),
        );
        this.logger.info(
          `Successfully removed lock statement from stack policy on '${this.rootStackName}': ${JSON.stringify(LOCK_STATEMENT)}`,
        );
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Rollback',
      implications: [
        `You will be able to run 'amplify push' on environment '${this.currentEnvName}'`,
        `You will be able to start migration of another environment`,
      ],
    });
  }

  private async validateDeploymentStatus(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
      await validations.validateDeploymentStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async validateDrift(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
      await validations.validateDrift();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async fetchGraphQLApiId(): Promise<string> {
    const apis = [];
    const appSyncClient = new AppSyncClient();
    for await (const page of paginateListGraphqlApis({ client: appSyncClient }, {})) {
      for (const api of page.graphqlApis ?? []) {
        if (api.name === `${this.appName}-${this.currentEnvName}`) {
          apis.push(api.apiId);
        }
      }
    }
    if (apis.length > 1) {
      throw new AmplifyError('MigrationError', { message: 'Unexpected count of GraphQL APIs' });
    }
    return apis[0];
  }

  private async fetchGraphQLModelTables(graphQLApiId: string): Promise<string[]> {
    const tables = [];
    const dynamoClient = new DynamoDBClient();
    for await (const page of paginateListTables({ client: dynamoClient }, {})) {
      for (const tableName of page.TableNames ?? []) {
        if (tableName.includes(`-${graphQLApiId}-${this.currentEnvName}`)) {
          tables.push(tableName);
        }
      }
    }
    return tables;
  }

  private async dynamoTableNames(): Promise<string[]> {
    if (!this._dynamoTableNames) {
      const graphQLApiId = await this.fetchGraphQLApiId();
      this._dynamoTableNames = await this.fetchGraphQLModelTables(graphQLApiId);
    }
    return this._dynamoTableNames;
  }

  private ddbClient() {
    if (!this._ddbClient) {
      this._ddbClient = new DynamoDBClient();
    }
    return this._ddbClient;
  }

  private amplifyClient() {
    if (!this._amplifyClient) {
      this._amplifyClient = new AmplifyClient();
    }
    return this._amplifyClient;
  }

  private cfnClient() {
    if (!this._cfnClient) {
      this._cfnClient = new CloudFormationClient({});
    }
    return this._cfnClient;
  }

  private async findApiCategoryStacks(): Promise<string[]> {
    const response = await this.cfnClient().send(new DescribeStackResourcesCommand({ StackName: this.rootStackName }));
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
      const response = await this.cfnClient().send(new ListStackResourcesCommand({ StackName: stackId, NextToken: nextToken }));
      nextToken = response.NextToken;

      for (const resource of response.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          modelStackIds.push(resource.PhysicalResourceId);
        }
      }
    } while (nextToken);

    // Update each model stack's template to set DeletionPolicy: Retain on DynamoDB tables
    for (const modelStackId of modelStackIds) {
      const templateResponse = await this.cfnClient().send(new GetTemplateCommand({ StackName: modelStackId }));
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
        const describeResponse = await this.cfnClient().send(new DescribeStacksCommand({ StackName: modelStackId }));
        const parameters = (describeResponse.Stacks?.[0]?.Parameters ?? []).map((p) => ({
          ParameterKey: p.ParameterKey,
          UsePreviousValue: true,
        }));

        const changeSetName = `deletion-policy-retain-${Date.now()}`;

        await this.cfnClient().send(
          new CreateChangeSetCommand({
            StackName: modelStackId,
            ChangeSetName: changeSetName,
            TemplateBody: JSON.stringify(template),
            Parameters: parameters,
          }),
        );

        await waitUntilChangeSetCreateComplete(
          { client: this.cfnClient(), maxWaitTime: 120 },
          { StackName: modelStackId, ChangeSetName: changeSetName },
        );

        const changeSet = await this.cfnClient().send(
          new DescribeChangeSetCommand({ StackName: modelStackId, ChangeSetName: changeSetName }),
        );

        this.validateDeletionPolicyChangeset(changeSet, modelStackId, changeSetName);

        await this.cfnClient().send(new DeleteChangeSetCommand({ StackName: modelStackId, ChangeSetName: changeSetName }));

        this.logger.info(`Updating stack ${modelStackId} with DeletionPolicy changes...`);
        await this.cfnClient().send(
          new UpdateStackCommand({
            StackName: modelStackId,
            TemplateBody: JSON.stringify(template),
            Parameters: parameters,
            Capabilities: ['CAPABILITY_NAMED_IAM'],
          }),
        );
        await waitUntilStackUpdateComplete({ client: this.cfnClient(), maxWaitTime: 900 }, { StackName: modelStackId });
        this.logger.info(`Successfully updated stack ${modelStackId}`);
      }
    }
  }

  /** Validates that a changeset only contains Modify actions on DynamoDB tables. */
  private validateDeletionPolicyChangeset(changeSet: DescribeChangeSetOutput, stackId: string, changeSetName: string): void {
    const changes = changeSet.Changes ?? [];

    const unexpected = changes.filter((change) => {
      const rc = change.ResourceChange;
      return rc.Action !== 'Modify' || rc.ResourceType !== 'AWS::DynamoDB::Table';
    });

    if (unexpected.length > 0) {
      const descriptions = unexpected.map((c) => {
        const rc = c.ResourceChange;
        return `${rc.Action} ${rc.ResourceType} (${rc.LogicalResourceId})`;
      });

      void this.cfnClient().send(new DeleteChangeSetCommand({ StackName: stackId, ChangeSetName: changeSetName }));

      throw new AmplifyError('MigrationError', {
        message: [
          `Changeset for stack '${stackId}' contains unexpected changes:`,
          ...descriptions.map((d) => `  - ${d}`),
          '',
          'Expected only Modify actions on AWS::DynamoDB::Table resources.',
        ].join('\n'),
        resolution: 'This may indicate template drift. Resolve the drift before proceeding with migration.',
      });
    }
  }

  private async getExistingStackPolicy(): Promise<{ Statement: Record<string, string>[] }> {
    const response = await this.cfnClient().send(
      new GetStackPolicyCommand({
        StackName: this.rootStackName,
      }),
    );
    if (response.StackPolicyBody) {
      return JSON.parse(response.StackPolicyBody) as { Statement: Record<string, string>[] };
    }
    return { Statement: [] };
  }
}
