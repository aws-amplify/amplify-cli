import { AmplifyMigrationOperation, AmplifyMigrationStep } from './_step';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { AmplifyGen2MigrationValidations } from './_validations';

const GEN2_MIGRATION_ENVIRONMENT_NAME = 'GEN2_MIGRATION_ENVIRONMENT_NAME';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[];

  private _ddbClient: DynamoDBClient;
  private _amplifyClient: AmplifyClient;
  private _cfnClient: CloudFormationClient;

  public async executeImplications(): Promise<string[]> {
    return [
      `You will not be able to run 'amplify push' on environment '${this.currentEnvName}'`,
      `You will not be able to migrate another environment until migration of '${this.currentEnvName}' is complete or rolled back`,
    ];
  }

  public async rollbackImplications(): Promise<string[]> {
    return [
      `You will be able to run 'amplify push' on environment '${this.currentEnvName}'`,
      `You will be able to start migration of another environment`,
    ];
  }

  public async executeValidate(): Promise<void> {
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateDeploymentStatus();
    await validations.validateDrift();
  }

  public async rollbackValidate(): Promise<void> {
    // https://github.com/aws-amplify/amplify-cli/issues/14570
    return;
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const operations: AmplifyMigrationOperation[] = [];

    for (const tableName of await this.dynamoTableNames()) {
      operations.push({
        describe: async () => {
          return [`Enable deletion protection for table '${tableName}'`];
        },
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
      describe: async () => {
        return [`Add environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}' (value: ${this.currentEnvName})`];
      },
      execute: async () => {
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.appId }));
        const environmentVariables = { ...(app.app.environmentVariables ?? {}), [GEN2_MIGRATION_ENVIRONMENT_NAME]: this.currentEnvName };
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.appId, environmentVariables }));
        this.logger.info(`Added '${GEN2_MIGRATION_ENVIRONMENT_NAME}' environment variable (value: ${this.currentEnvName})`);
      },
    });

    const stackPolicy = JSON.stringify({
      Statement: [
        {
          Effect: 'Deny',
          Action: 'Update:*',
          Principal: '*',
          Resource: '*',
        },
      ],
    });

    operations.push({
      describe: async () => {
        return [`Set a policy on stack '${this.rootStackName}': ${stackPolicy}`];
      },
      execute: async () => {
        await this.cfnClient().send(
          new SetStackPolicyCommand({
            StackName: this.rootStackName,
            StackPolicyBody: stackPolicy,
          }),
        );
        this.logger.info(`Successfully set policy on stack '${this.rootStackName}': ${stackPolicy}`);
      },
    });

    return operations;
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    const operations: AmplifyMigrationOperation[] = [];

    // note that we don't disable deletion protection on the tables because we don't
    // know what the original value was; to play it safe we leave it untouched.

    operations.push({
      describe: async () => {
        return [`Remove environment variable '${GEN2_MIGRATION_ENVIRONMENT_NAME}'`];
      },
      execute: async () => {
        const app = await this.amplifyClient().send(new GetAppCommand({ appId: this.appId }));
        const environmentVariables = app.app.environmentVariables ?? {};
        delete environmentVariables[GEN2_MIGRATION_ENVIRONMENT_NAME];
        await this.amplifyClient().send(new UpdateAppCommand({ appId: this.appId, environmentVariables }));
        this.logger.info(`Removed ${GEN2_MIGRATION_ENVIRONMENT_NAME} environment variable`);
      },
    });

    const stackPolicy = JSON.stringify({
      Statement: [
        {
          Effect: 'Allow',
          Action: 'Update:*',
          Principal: '*',
          Resource: '*',
        },
      ],
    });

    operations.push({
      describe: async () => {
        return [`Set a policy on stack '${this.rootStackName}': ${stackPolicy}`];
      },
      execute: async () => {
        await this.cfnClient().send(
          new SetStackPolicyCommand({
            StackName: this.rootStackName,
            StackPolicyBody: stackPolicy,
          }),
        );
        this.logger.info(`Successfully set policy on stack '${this.rootStackName}': ${stackPolicy}`);
      },
    });

    return operations;
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
}
