import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation, ValidationResult } from './_operation';
import { Plan } from './_plan';
import { AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyGen2MigrationValidations } from './_validations';

const GEN2_MIGRATION_ENVIRONMENT_NAME = 'GEN2_MIGRATION_ENVIRONMENT_NAME';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[];
  private _userPoolIds: string[];

  private _ddbClient: DynamoDBClient;
  private _amplifyClient: AmplifyClient;
  private _cfnClient: CloudFormationClient;
  private _cognitoClient: CognitoIdentityProviderClient;

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

    for (const userPoolId of await this.userPoolIds()) {
      operations.push({
        validate: () => undefined,
        describe: async () => [`Enable deletion protection for user pool '${userPoolId}'`],
        execute: async () => {
          // await this.cognitoClient().send(
          //   new UpdateUserPoolCommand({
          //     UserPoolId: userPoolId,
          //     DeletionProtection: 'ACTIVE',
          //   }),
          // );
          // this.logger.info(`Enabled deletion protection for user pool '${userPoolId}'`);
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
      validate: () => undefined,
      describe: async () => [`Set a policy on stack '${this.rootStackName}': ${stackPolicy}`],
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

    for (const userPoolId of await this.userPoolIds()) {
      operations.push({
        validate: () => undefined,
        describe: async () => [`Preserve deletion protection for user pool '${userPoolId}'`],
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
      validate: () => undefined,
      describe: async () => [`Set a policy on stack '${this.rootStackName}': ${stackPolicy}`],
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

  private cognitoClient() {
    if (!this._cognitoClient) {
      this._cognitoClient = new CognitoIdentityProviderClient({});
    }
    return this._cognitoClient;
  }

  private async userPoolIds(): Promise<string[]> {
    if (!this._userPoolIds) {
      this._userPoolIds = [];
      const meta = stateManager.getMeta();
      const authCategory = meta?.auth;
      if (authCategory) {
        for (const [, resource] of Object.entries(authCategory)) {
          const typedResource = resource as { service?: string; output?: { UserPoolId?: string } };
          if (typedResource.service === 'Cognito' && typedResource.output?.UserPoolId) {
            this._userPoolIds.push(typedResource.output.UserPoolId);
          }
        }
      }
    }
    return this._userPoolIds;
  }
}
