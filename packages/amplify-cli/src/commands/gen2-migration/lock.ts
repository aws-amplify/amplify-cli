import { AmplifyMigrationStep } from './_infra/step';
import { AmplifyMigrationOperation, ValidationResult } from './_infra/operation';
import { Plan } from './_infra/plan';
import {
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetStackPolicyCommand,
  SetStackPolicyCommand,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { UpdateTableCommand, paginateListTables } from '@aws-sdk/client-dynamodb';
import { DiscoveredResource } from './generate/_infra/gen1-app';
import CLITable from 'cli-table3';
import { extractStackNameFromId } from './refactor/utils';
import { Cfn } from './refactor/cfn';
import { REFACTORED_RESOURCES } from './_infra/resource-types';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

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

    // ============================================================
    // Validations
    // ============================================================

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

    // ============================================================
    // Project Level Operations
    // ============================================================

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

    // ============================================================
    // Resource Specific Operations
    // ============================================================

    const nestedStacks = await this.listNestedStack(this.gen1App.rootStackName);

    for (const resource of this.gen1App.discover()) {
      this.logger.push(`${resource.category}/${resource.resourceName} (${resource.service})`);
      switch (resource.key) {
        case 'api:AppSync': {
          const apiStackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const apiNestedStacks = await this.listNestedStack(apiStackId);
          operations.push(...(await this.enableModelTablesDeletionProtection(resource)));
          for (const tableName of await this.dynamoTableNames()) {
            const modelName = tableName.split('-')[0];
            this.logger.push(modelName);
            const tableStackId = this.findNestedStack(apiNestedStacks, modelName);
            operations.push(...(await this.retainResource(resource, tableStackId)));
            this.logger.pop();
          }
          break;
        }
        case 'auth:Cognito':
        case 'auth:Cognito-UserPool-Groups':
        case 'storage:S3':
        case 'storage:DynamoDB':
        case 'analytics:Kinesis': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          operations.push(...(await this.retainResource(resource, stackId)));
          break;
        }

        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
        case 'geo:GeofenceCollection':
        case 'function:Lambda': {
          break;
        }

        // unsupported/unknown resources - skip them.
        case 'UNKNOWN':
          break;
      }
      this.logger.pop();
    }

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

    // ============================================================
    // Project Level Operations
    // ============================================================

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
      if (!graphQLApiId) {
        // not all apps have a graphql server
        this._dynamoTableNames = [];
      } else {
        this._dynamoTableNames = await this.fetchGraphQLModelTables(graphQLApiId);
      }
    }
    return this._dynamoTableNames;
  }

  private async enableModelTablesDeletionProtection(resource: DiscoveredResource): Promise<AmplifyMigrationOperation[]> {
    const operations = [];
    for (const tableName of await this.dynamoTableNames()) {
      operations.push({
        resource,
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
    return operations;
  }

  private async retainResource(appResource: DiscoveredResource, stackId: string): Promise<AmplifyMigrationOperation[]> {
    const operations = [];

    const cfn = new Cfn(this.gen1App.clients.cloudFormation, this.logger);

    const stackName = extractStackNameFromId(stackId);
    const template = await cfn.fetchTemplate(stackId);

    const table = new CLITable({
      head: ['Logical ID', 'Type', 'DeletionPolicy/UpdateReplacePolicy (Before)', 'DeletionPolicy/UpdateReplacePolicy (After)'],
      style: { head: [] },
    });

    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      const currentDeletion = resource.DeletionPolicy;
      const currentUpdate = resource.UpdateReplacePolicy;
      if (REFACTORED_RESOURCES.includes(resource.Type) && (currentDeletion !== 'Retain' || currentUpdate !== 'Retain')) {
        resource.DeletionPolicy = 'Retain';
        resource.UpdateReplacePolicy = 'Retain';
        table.push([logicalId, resource.Type, `${currentDeletion}/${currentUpdate}`, 'Retain/Retain']);
      }
      if (resource.Type === 'AWS::DynamoDB::Table') {
        resource.Properties['DeletionProtectionEnabled'] = true;
      }
      if (resource.Type === 'AWS::Cognito::UserPool') {
        resource.Properties['DeletionProtection'] = 'ACTIVE';
      }
    }

    if (table.length === 0) {
      return [];
    }

    const describeResponse = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: stackId }));
    const parameters = (describeResponse.Stacks?.[0]?.Parameters ?? []).map((p) => ({
      ParameterKey: p.ParameterKey,
      UsePreviousValue: true,
    }));

    this.logger.push(`${stackName} (Create ChangeSet)`);
    const changeSet = await cfn.createChangeSet({
      stackName: stackId,
      templateBody: template,
      parameters,
    });
    this.logger.pop();

    const changeSetReport = cfn.renderChangeSet(changeSet);

    operations.push({
      resource: appResource,
      describe: async () => [`Apply 'Retain' removal policy to the following resources in stack ${stackName}\n${changeSetReport}`],
      validate: () => undefined,
      execute: async () => {
        await cfn.executeChangeSet({
          changeSet: changeSet,
          templateBody: template,
          resource: appResource,
          captureSnapshot: false,
        });
      },
    });

    return operations;
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
}
