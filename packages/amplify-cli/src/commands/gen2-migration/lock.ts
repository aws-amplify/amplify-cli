import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetTemplateCommand,
  ListStackResourcesCommand,
  SetStackPolicyCommand,
} from '@aws-sdk/client-cloudformation';
import { tryUpdateStack } from './refactor/cfn-stack-updater';
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { CognitoIdentityProviderClient, UpdateUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyGen2MigrationValidations } from './_validations';

const GEN2_MIGRATION_ENVIRONMENT_NAME = 'GEN2_MIGRATION_ENVIRONMENT_NAME';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  private _dynamoTableNames: string[];
  private _userPoolIds: string[];

  private _ddbClient: DynamoDBClient;
  private _amplifyClient: AmplifyClient;
  private _cfnClient: CloudFormationClient;
  private _cognitoClient: CognitoIdentityProviderClient;

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

    for (const userPoolId of await this.userPoolIds()) {
      operations.push({
        describe: async () => {
          return [`Enable deletion protection for user pool '${userPoolId}'`];
        },
        execute: async () => {
          await this.cognitoClient().send(
            new UpdateUserPoolCommand({
              UserPoolId: userPoolId,
              DeletionProtection: 'ACTIVE',
            }),
          );
          this.logger.info(`Enabled deletion protection for user pool '${userPoolId}'`);
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

    if ((await this.dynamoTableNames()).length > 0) {
      operations.push({
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
    // create logging only operations to let this be known to the user.
    for (const tableName of await this.dynamoTableNames()) {
      operations.push({
        describe: async () => {
          return [`Preserve deletion protection for table '${tableName}'`];
        },
        execute: async () => {
          return;
        },
      });
    }

    for (const userPoolId of await this.userPoolIds()) {
      operations.push({
        describe: async () => {
          return [`Preserve deletion protection for user pool '${userPoolId}'`];
        },
        execute: async () => {
          return;
        },
      });
    }

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

  private async findApiCategoryStacks(): Promise<string[]> {
    const response = await this.cfnClient().send(new DescribeStackResourcesCommand({ StackName: this.rootStackName }));
    const stackResources = response.StackResources ?? [];
    return stackResources
      .filter(
        (resource) =>
          resource.ResourceType === 'AWS::CloudFormation::Stack' &&
          resource.LogicalResourceId?.startsWith('api') &&
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

      for (const logicalId of Object.keys(resources)) {
        const resource = resources[logicalId];
        if (resource.Type === 'AWS::DynamoDB::Table' && resource.DeletionPolicy !== 'Retain') {
          resource.DeletionPolicy = 'Retain';
          this.logger.info(`Set DeletionPolicy to Retain for table '${logicalId}'`);

          // Pass existing parameters through unchanged
          const describeResponse = await this.cfnClient().send(new DescribeStacksCommand({ StackName: modelStackId }));
          const parameters = (describeResponse.Stacks?.[0]?.Parameters ?? []).map((p) => ({
            ParameterKey: p.ParameterKey,
            UsePreviousValue: true,
          }));

          this.logger.info(`Updating DeletionPolicy for table '${logicalId}'...`);
          await tryUpdateStack(this.cfnClient(), modelStackId, parameters, template);
          this.logger.info(`Successfully updated DeletionPolicy for table '${logicalId}'`);
        }
      }
    }
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
