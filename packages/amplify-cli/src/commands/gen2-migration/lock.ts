import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation, ValidationResult } from './_operation';
import { Plan } from './_plan';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand, GetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
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
      describe: async () => [`Add environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}' (value: ${this.gen1App.envName})`],
      execute: async () => {
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = { ...(app.app.environmentVariables ?? {}), [GEN2_MIGRATION_ENVIRONMENT_NAME]: this.gen1App.envName };
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.gen1App.appId, environmentVariables }));
        this.logger.info(`Added '${GEN2_MIGRATION_ENVIRONMENT_NAME}' environment variable (value: ${this.gen1App.envName})`);
      },
    });

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
        await this.cfnClient().send(
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
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.gen1App.appId }));
        const environmentVariables = app.app.environmentVariables ?? {};
        delete environmentVariables[GEN2_MIGRATION_ENVIRONMENT_NAME];
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.gen1App.appId, environmentVariables }));
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
        await this.cfnClient().send(
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
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.gen1App.rootStackName, this.gen1App.envName, this.context);
      await validations.validateDeploymentStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async validateDrift(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.gen1App.rootStackName, this.gen1App.envName, this.context);
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
        if (api.name === `${this.gen1App.appName}-${this.gen1App.envName}`) {
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
        if (tableName.includes(`-${graphQLApiId}-${this.gen1App.envName}`)) {
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

  private async getExistingStackPolicy(): Promise<{ Statement: Record<string, string>[] }> {
    const response = await this.cfnClient().send(
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
