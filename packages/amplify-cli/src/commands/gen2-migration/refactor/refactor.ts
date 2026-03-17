/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from '../_step';
import { AmplifyMigrationOperation } from '../_operation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AmplifyGen2MigrationValidations } from '../_validations';
import { AwsClients } from '../aws-clients';
import { StackFacade } from './stack-facade';
import { Refactorer } from './refactorer';
import { AuthCognitoForwardRefactorer } from './auth/auth-forward';
import { AuthCognitoRollbackRefactorer } from './auth/auth-rollback';
import { StorageS3ForwardRefactorer } from './storage/storage-forward';
import { StorageS3RollbackRefactorer } from './storage/storage-rollback';
import { StorageDynamoForwardRefactorer } from './storage/storage-dynamo-forward';
import { StorageDynamoRollbackRefactorer } from './storage/storage-dynamo-rollback';
import { AnalyticsKinesisForwardRefactorer } from './analytics/analytics-forward';
import { AnalyticsKinesisRollbackRefactorer } from './analytics/analytics-rollback';
import { Gen1App, DiscoveredResource } from '../generate/_infra/gen1-app';
import { Assessment } from '../_assessment';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  /**
   * Records refactor support for each discovered resource into the assessment.
   */
  public async assess(assessment: Assessment): Promise<void> {
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
        case 'storage:S3':
        case 'storage:DynamoDB':
        case 'analytics:Kinesis':
        // falls through — stateless categories, nothing to refactor
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
          assessment.record('refactor', resource, { supported: true });
          break;
        case 'auth:Cognito-UserPool-Groups':
        case 'unsupported':
          assessment.record('refactor', resource, { supported: false });
          break;
      }
    }
  }

  public async executeImplications(): Promise<string[]> {
    return ['Move stateful resources from your Gen1 app to be managed by your Gen2 app'];
  }

  public async rollbackImplications(): Promise<string[]> {
    return ['Move stateful resources from your Gen2 app back to your Gen1 app'];
  }

  public async executeValidate(): Promise<void> {
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
  }

  public async rollbackValidate(): Promise<void> {
    return;
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const toStack = this.extractParameters();
    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure(toStack);

    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    const refactorers: Refactorer[] = [];

    validateSingleResourcePerCategory(discovered);

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(
            new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.appId, this.currentEnvName),
          );
          break;
        case 'storage:S3':
          refactorers.push(new StorageS3ForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        case 'storage:DynamoDB':
          refactorers.push(new StorageDynamoForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        case 'analytics:Kinesis':
          refactorers.push(new AnalyticsKinesisForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        // Stateless categories — nothing to refactor
        // falls through
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
          break;
        case 'auth:Cognito-UserPool-Groups':
        case 'unsupported':
          throw new AmplifyError('MigrationError', {
            message: `Unsupported resource '${resource.resourceName}' (${resource.category}:${resource.service}). Run 'amplify gen2-migration assess' to check migration readiness.`,
          });
      }
    }

    return this.plan(refactorers);
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    const toStack = this.extractParameters();
    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure(toStack);

    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    const refactorers: Refactorer[] = [];

    validateSingleResourcePerCategory(discovered);

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(new AuthCognitoRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        case 'storage:S3':
          refactorers.push(new StorageS3RollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        case 'storage:DynamoDB':
          refactorers.push(new StorageDynamoRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        case 'analytics:Kinesis':
          refactorers.push(new AnalyticsKinesisRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId));
          break;
        // Stateless categories — nothing to rollback
        // falls through
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
          break;
        case 'auth:Cognito-UserPool-Groups':
        case 'unsupported':
          throw new AmplifyError('MigrationError', {
            message: `Unsupported resource '${resource.resourceName}' (${resource.category}:${resource.service}). Cannot rollback.`,
          });
      }
    }

    return this.plan(refactorers);
  }

  private async createInfrastructure(toStack: string): Promise<{
    clients: AwsClients;
    accountId: string;
    gen1Env: StackFacade;
    gen2Branch: StackFacade;
  }> {
    const stsClient = new STSClient({});
    const { Account: accountId } = await stsClient.send(new GetCallerIdentityCommand({}));
    if (!accountId) {
      throw new AmplifyError('ConfigurationError', { message: 'Unable to determine AWS account ID' });
    }

    const clients = new AwsClients({ region: this.region });
    const gen1Env = new StackFacade(clients, this.rootStackName);
    const gen2Branch = new StackFacade(clients, toStack);

    return { clients, accountId, gen1Env, gen2Branch };
  }

  /**
   * Collects operations from all refactorers.
   */
  private async plan(refactorers: Refactorer[]): Promise<AmplifyMigrationOperation[]> {
    const operations: AmplifyMigrationOperation[] = [];
    for (const refactorer of refactorers) {
      operations.push(...(await refactorer.plan()));
    }

    return operations;
  }

  private extractParameters(): string {
    const toStack = this.context.parameters?.options?.to;

    if (!toStack) {
      throw new AmplifyError('InputValidationError', { message: '--to is required' });
    }

    return toStack;
  }
}

/**
 * Throws if any refactorer category has more than one resource.
 * Refactorers assume a single resource per category — multiple
 * resources would produce incorrect mappings.
 */
function validateSingleResourcePerCategory(discovered: readonly DiscoveredResource[]): void {
  const refactorCategories = new Set(['auth', 'storage', 'analytics']);
  const categoryCounts = new Map<string, number>();
  for (const r of discovered) {
    if (!refactorCategories.has(r.category)) continue;
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  }
  for (const [category, count] of categoryCounts) {
    if (count > 1) {
      throw new AmplifyError('MigrationError', {
        message: `Multiple resources in '${category}' category detected. The refactor step does not yet support multiple resources per category.`,
      });
    }
  }
}
