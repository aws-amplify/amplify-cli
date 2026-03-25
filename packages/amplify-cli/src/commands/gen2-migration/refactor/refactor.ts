/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from '../_step';
import { AmplifyMigrationOperation, ValidationResult } from '../_operation';
import { Plan } from '../_plan';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AmplifyGen2MigrationValidations } from '../_validations';
import { AwsClients } from '../aws-clients';
import { StackFacade } from './stack-facade';
import { Planner } from '../planner';
import { AuthCognitoForwardRefactorer } from './auth/auth-cognito-forward';
import { AuthCognitoRollbackRefactorer } from './auth/auth-cognito-rollback';
import { StorageS3ForwardRefactorer } from './storage/storage-forward';
import { StorageS3RollbackRefactorer } from './storage/storage-rollback';
import { StorageDynamoForwardRefactorer } from './storage/storage-dynamo-forward';
import { StorageDynamoRollbackRefactorer } from './storage/storage-dynamo-rollback';
import { AnalyticsKinesisForwardRefactorer } from './analytics/analytics-forward';
import { AnalyticsKinesisRollbackRefactorer } from './analytics/analytics-rollback';
import { Gen1App } from '../generate/_infra/gen1-app';
import { AmplifyMigrationAssessor } from '../assess';
import { Assessment } from '../_assessment';
import { AuthUserPoolGroupsForwardRefactorer } from './auth/auth-user-pool-groups-forward';
import { AuthUserPoolGroupsRollbackRefactorer } from './auth/auth-user-pool-groups-rollback';
import { Cfn } from './cfn';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const toStack = this.extractParameters();
    const { clients, accountId, gen1Env, gen2Branch, cfn } = await this.createInfrastructure(toStack);

    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    const refactorers: Planner[] = [];
    const assessmentOps: AmplifyMigrationOperation[] = [];
    const assessor = new AmplifyMigrationAssessor(gen1App);

    for (const resource of discovered) {
      // Feature assessment validation for this resource.
      const features = assessor.assessFeatures(resource);
      assessmentOps.push({
        resource,
        describe: async () => [],
        validate: () => ({
          description: `Feature assessment: ${resource.category}/${resource.resourceName} (${resource.service})`,
          run: async () => {
            const unsupported = features.filter((f) => f.refactor === 'unsupported');
            if (unsupported.length > 0) {
              const report = new Assessment();
              for (const f of unsupported) report.recordFeature(f);
              return { valid: false, report: report.render() };
            }
            return { valid: true };
          },
        }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      });

      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(
            new AuthCognitoForwardRefactorer(
              gen1Env,
              gen2Branch,
              clients,
              this.region,
              accountId,
              this.logger,
              this.appId,
              this.currentEnvName,
              resource,
              cfn,
            ),
          );
          break;
        case 'auth:Cognito-UserPool-Groups':
          refactorers.push(
            new AuthUserPoolGroupsForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:S3':
          refactorers.push(
            new StorageS3ForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:DynamoDB':
          refactorers.push(
            new StorageDynamoForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'analytics:Kinesis':
          refactorers.push(
            new AnalyticsKinesisForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        // Stateless categories — nothing to refactor
        // falls through
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
          break;
        case 'unsupported':
          throw new AmplifyError('MigrationError', {
            message: `Unsupported resource '${resource.resourceName}' (${resource.category}:${resource.service}). Run 'amplify gen2-migration assess' to check migration readiness.`,
          });
      }
    }

    return this.buildPlan(
      refactorers,
      assessmentOps,
      [
        'Stateful resources (Cognito, S3, DynamoDB, etc...) will be moved from Gen1 to Gen2 CloudFormation stacks',
        'Your Gen1 app will no longer manage these resources',
      ],
      'Execute',
    );
  }

  public async rollback(): Promise<Plan> {
    const toStack = this.extractParameters();
    const { clients, accountId, gen1Env, gen2Branch, cfn } = await this.createInfrastructure(toStack);

    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    const refactorers: Planner[] = [];
    const assessmentOps: AmplifyMigrationOperation[] = [];
    const assessor = new AmplifyMigrationAssessor(gen1App);

    for (const resource of discovered) {
      // Feature assessment validation for this resource.
      const features = assessor.assessFeatures(resource);
      assessmentOps.push({
        resource,
        describe: async () => [],
        validate: () => ({
          description: `Feature assessment: ${resource.category}/${resource.resourceName} (${resource.service})`,
          run: async () => {
            const unsupported = features.filter((f) => f.refactor === 'unsupported');
            if (unsupported.length > 0) {
              const report = new Assessment();
              for (const f of unsupported) report.recordFeature(f);
              return { valid: false, report: report.render() };
            }
            return { valid: true };
          },
        }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      });

      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(
            new AuthCognitoRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'auth:Cognito-UserPool-Groups':
          refactorers.push(
            new AuthUserPoolGroupsRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:S3':
          refactorers.push(
            new StorageS3RollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:DynamoDB':
          refactorers.push(
            new StorageDynamoRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        case 'analytics:Kinesis':
          refactorers.push(
            new AnalyticsKinesisRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.logger, resource, cfn),
          );
          break;
        // Stateless categories — nothing to rollback
        // falls through
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
          break;
        case 'unsupported':
          throw new AmplifyError('MigrationError', {
            message: `Unsupported resource '${resource.resourceName}' (${resource.category}:${resource.service}). Cannot rollback.`,
          });
      }
    }

    return this.buildPlan(
      refactorers,
      assessmentOps,
      ['Stateful resources will be moved back to Gen1 CloudFormation stacks', 'Your Gen2 app will no longer manage these resources'],
      'Rollback',
    );
  }

  /**
   * Creates shared AWS clients, stack facades, and the Cfn instance.
   */
  private async createInfrastructure(toStack: string): Promise<{
    clients: AwsClients;
    accountId: string;
    gen1Env: StackFacade;
    gen2Branch: StackFacade;
    cfn: Cfn;
  }> {
    const stsClient = new STSClient({});
    const { Account: accountId } = await stsClient.send(new GetCallerIdentityCommand({}));
    if (!accountId) {
      throw new AmplifyError('ConfigurationError', { message: 'Unable to determine AWS account ID' });
    }

    const clients = new AwsClients({ region: this.region });
    const gen1Env = new StackFacade(clients, this.rootStackName);
    const gen2Branch = new StackFacade(clients, toStack);
    const cfn = new Cfn(clients.cloudFormation, this.logger);

    return { clients, accountId, gen1Env, gen2Branch, cfn };
  }

  /**
   * Collects operations from all refactorers.
   */
  private async buildPlan(
    refactorers: Planner[],
    assessmentOps: AmplifyMigrationOperation[],
    implications: string[],
    title: string,
  ): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Lock status', run: () => this.validateLockStatus() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    operations.push(...assessmentOps);

    for (const refactorer of refactorers) {
      operations.push(...(await refactorer.plan()));
    }

    return new Plan({ operations, logger: this.logger, implications, title });
  }

  private async validateLockStatus(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
      await validations.validateLockStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private extractParameters(): string {
    const toStack = this.context.parameters?.options?.to;

    if (!toStack) {
      throw new AmplifyError('InputValidationError', { message: '--to is required' });
    }

    return toStack;
  }
}
