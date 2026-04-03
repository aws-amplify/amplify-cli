import { AmplifyMigrationStep } from './_infra/step';
import { AmplifyMigrationOperation, ValidationResult } from './_infra/operation';
import { Plan } from './_infra/plan';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { SetStackPolicyCommand, GetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { paginateListGraphqlApis } from '@aws-sdk/client-appsync';

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
      this._dynamoTableNames = await this.fetchGraphQLModelTables(graphQLApiId);
    }
    return this._dynamoTableNames;
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
