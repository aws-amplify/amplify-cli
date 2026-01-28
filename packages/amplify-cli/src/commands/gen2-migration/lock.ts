import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyClient, UpdateAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  public async implications(): Promise<string[]> {
    return ['Enable deletion protection on DynamoDB tables storing your model data', 'Lock the environment from future updates'];
  }

  public async validate(): Promise<void> {
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateDeploymentStatus();
    await validations.validateDrift();
  }

  public async execute(): Promise<void> {
    const amplifyClient = new AmplifyClient();

    await amplifyClient.send(
      new UpdateAppCommand({
        appId: this.appId,
        environmentVariables: {
          GEN2_MIGRATION_ENVIRONMENT_NAME: this.currentEnvName,
        },
      }),
    );

    this.logger.info(`Environment '${this.currentEnvName}' has been marked for migration`);

    const graphQLApiId = await this.fetchGraphQLApiId();

    if (graphQLApiId) {
      const dynamoClient = new DynamoDBClient();
      for (const tableName of await this.fetchGraphQLModelTables(graphQLApiId)) {
        await dynamoClient.send(
          new UpdateTableCommand({
            TableName: tableName,
            DeletionProtectionEnabled: true,
          }),
        );
        this.logger.info(`Enabled deletion protection on table '${tableName}'`);
      }
    }

    const stackPolicy = {
      Statement: [
        {
          Effect: 'Deny',
          Action: 'Update:*',
          Principal: '*',
          Resource: '*',
        },
      ],
    };

    const cfnClient = new CloudFormationClient({});
    await cfnClient.send(
      new SetStackPolicyCommand({
        StackName: this.rootStackName,
        StackPolicyBody: JSON.stringify(stackPolicy),
      }),
    );

    this.logger.info(`Root stack '${this.rootStackName}' has been locked`);
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
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
}
