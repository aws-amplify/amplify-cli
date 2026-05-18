import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation, ValidationResult } from './_common/operation';
import { Plan } from './_common/plan';
import {
  DescribeChangeSetOutput,
  DescribeStacksCommand,
  GetStackPolicyCommand,
  SetStackPolicyCommand,
  StackResourceSummary,
} from '@aws-sdk/client-cloudformation';
import { UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { paginateListTables } from '@aws-sdk/client-dynamodb';
import { DiscoveredResource } from './_common/gen1-app';
import { extractStackNameFromId } from './_common/utils';
import { Cfn } from './_common/cfn';
import { AUTH_HOSTED_UI_LOGICAL_IDS_TO_RETAIN } from './_common/resource-types';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNTemplate } from './_common/cfn-template';
import CLITable from 'cli-table3';

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
        case 'custom:customCDK':
        case 'analytics:Kinesis': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          operations.push(...(await this.retainResource(resource, stackId)));
          break;
        }

        // resources we don't refactor, skip them.
        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
        case 'geo:GeofenceCollection':
        case 'function:Lambda':
          break;

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
        `You will not be able to run 'amplify push' on '${this.gen1App.appName}/${this.gen1App.envName}'`,
        `You will not be able to migrate another environment until migration of '${this.gen1App.appName}/${this.gen1App.envName}' is complete or rolled back`,
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

    // ============================================================
    // Resource Specific Operations
    // ============================================================

    const nestedStacks = await this.listNestedStack(this.gen1App.rootStackName);
    for (const resource of this.gen1App.discover()) {
      switch (resource.key) {
        case 'auth:Cognito':
        case 'auth:Cognito-UserPool-Groups': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const template = this.gen1App.json(`auth/${resource.resourceName}/build/${resource.resourceName}-cloudformation-template.json`);
          operations.push(await this.validateRefactorRollbackStackIntegrity(resource, template, stackId));
          break;
        }
        case 'storage:S3': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const template = this.gen1App.json(`storage/${resource.resourceName}/build/cloudformation-template.json`);
          operations.push(await this.validateRefactorRollbackStackIntegrity(resource, template, stackId));
          break;
        }
        case 'storage:DynamoDB': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const template = this.gen1App.json(
            `storage/${resource.resourceName}/build/${resource.resourceName}-cloudformation-template.json`,
          );
          operations.push(await this.validateRefactorRollbackStackIntegrity(resource, template, stackId));
          break;
        }
        case 'analytics:Kinesis': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const template = this.gen1App.json(`analytics/${resource.resourceName}/kinesis-cloudformation-template.json`);
          operations.push(await this.validateRefactorRollbackStackIntegrity(resource, template, stackId));
          break;
        }
        case 'custom:customCDK': {
          const stackId = this.findNestedStack(nestedStacks, `${resource.category}${resource.resourceName}`);
          const template = this.gen1App.json(`custom/${resource.resourceName}/build/${resource.resourceName}-cloudformation-template.json`);
          operations.push(await this.validateRefactorRollbackStackIntegrity(resource, template, stackId));
          break;
        }

        case 'api:AppSync':
        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
        case 'geo:GeofenceCollection':
        case 'function:Lambda':
        case 'UNKNOWN':
          // untouched during refactor - skip them.
          break;
      }
    }

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

  private async retainResource(appResource: DiscoveredResource, stackId: string): Promise<AmplifyMigrationOperation[]> {
    const operations: AmplifyMigrationOperation[] = [];

    const cfn = new Cfn(this.gen1App, this.logger);

    const stackName = extractStackNameFromId(stackId);
    const template = await cfn.fetchTemplate(stackId);

    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      if (this.gen1App.statefulResourceTypes.includes(resource.Type)) {
        resource.DeletionPolicy = 'Retain';
        resource.UpdateReplacePolicy = 'Retain';
      }

      if (AUTH_HOSTED_UI_LOGICAL_IDS_TO_RETAIN.includes(logicalId)) {
        resource.DeletionPolicy = 'Retain';
        resource.UpdateReplacePolicy = 'Retain';
      }
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
    const changeSet = await cfn.createChangeSet({
      stackName: stackId,
      templateBody: template,
      parameters,
    });
    this.logger.pop();

    if (!changeSet) {
      return [];
    }

    const report = cfn.renderChangeSet(changeSet);
    const valid = this.validateRetainChangeset(changeSet);

    operations.push({
      resource: appResource,
      describe: async () => [
        `Set Retain policies on stateful resources and/or enable DynamoDB deletion protection in '${stackName}'\n\n${report}\n`,
      ],
      validate: () => ({
        description: `Stack Unchanged: ${stackName}`,
        run: async () => ({ valid, report }),
      }),
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

  private async validateRefactorRollbackStackIntegrity(
    resource: DiscoveredResource,
    localTemplate: CFNTemplate,
    stackId: string,
  ): Promise<AmplifyMigrationOperation> {
    const stackName = extractStackNameFromId(stackId);

    return {
      resource,
      validate: () => ({
        description: `Stack Integrity: ${stackName}`,
        run: async () => {
          const cfn = new Cfn(this.gen1App, this.logger);
          const deployedTemplate = await cfn.fetchTemplate(stackId);

          const missingResources = new CLITable({
            head: ['Logical ID', 'Type'],
            style: { head: [] },
          });

          for (const logicalId of Object.keys(localTemplate.Resources)) {
            const localResource = localTemplate.Resources[logicalId];
            if (localResource.Condition) {
              // skip conditional resources since refactor resolves
              // conditions so these resource may intentionally be missing
              // from the deployed template.
              continue;
            }
            if (!deployedTemplate.Resources[logicalId]) {
              missingResources.push([logicalId, localResource.Type]);
            }
          }

          return {
            valid: missingResources.length === 0,
            report: `Following resources are missing. Did you forget to run 'amplify gen2-migration refactor --rollback'?\n\n${missingResources.toString()}`,
          };
        },
      }),
      describe: async () => [],
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    };
  }

  private validateRetainChangeset(changeSet: DescribeChangeSetOutput): boolean {
    const changes = changeSet.Changes ?? [];
    if (changes.length === 0) return false;

    for (const change of changes) {
      const rc = change.ResourceChange;
      if (!rc || rc.Action !== 'Modify') return false;

      const details = rc.Details ?? [];
      if (details.length === 0) return false;

      for (const detail of details) {
        const attr = detail.Target?.Attribute;
        const name = detail.Target?.Name;
        const after = detail.Target?.AfterValue;

        if ((attr === 'DeletionPolicy' || attr === 'UpdateReplacePolicy') && after === 'Retain') {
          continue;
        }

        if (
          change.ResourceChange?.ResourceType === DYNAMO_RESOURCE_TYPE &&
          attr === 'Properties' &&
          name === DYNAMO_DELETION_PROTECTION_PROPERTY &&
          after === 'true'
        ) {
          continue;
        }

        return false;
      }
    }

    return true;
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

  private async listNestedStack(rootStack: string): Promise<StackResourceSummary[]> {
    return this.gen1App.aws.listNestedStacks(rootStack);
  }

  private findNestedStack(nestedStacks: StackResourceSummary[], logicalIdPrefix: string) {
    const stackId = nestedStacks.find((s) => s.LogicalResourceId?.startsWith(logicalIdPrefix))?.PhysicalResourceId;
    if (!stackId) {
      throw new AmplifyError('NestedStackNotFoundError', {
        message: `Unable to find nested stack logical id prefix: ${logicalIdPrefix}`,
      });
    }
    return stackId;
  }
}
