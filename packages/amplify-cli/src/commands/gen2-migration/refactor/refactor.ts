/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from '../_step';
import { AmplifyMigrationOperation, ValidationResult } from '../_operation';
import { Plan } from '../_plan';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
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
import { Assessment } from '../assess/assessment';
import { AuthUserPoolGroupsForwardRefactorer } from './auth/auth-user-pool-groups-forward';
import { AuthUserPoolGroupsRollbackRefactorer } from './auth/auth-user-pool-groups-rollback';
import { Cfn } from './cfn';
import { AmplifyMigrationAssessor } from '../assess';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const toStack = this.extractParameters();
    const { accountId, gen1Env, gen2Branch, cfn } = await this.createInfrastructure(toStack);

    const refactorers: Planner[] = [];
    const assessor = new AmplifyMigrationAssessor(this.gen1App);
    const assessment = assessor.assess();

    const discovered = this.gen1App.discover();

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'auth:Cognito-UserPool-Groups':
          refactorers.push(
            new AuthUserPoolGroupsForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:S3':
          refactorers.push(new StorageS3ForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'storage:DynamoDB':
          refactorers.push(new StorageDynamoForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'analytics:Kinesis':
          refactorers.push(new AnalyticsKinesisForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;

        // stateless resources — nothing to refactor
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
          break;

        // unsupported/unknown resources - skip them.
        // the assessment validation will surface these to the user
        // and require confirmation of missing capabilities.
        case 'geo:GeofenceCollection':
        case 'UNKNOWN':
          break;
      }
    }

    return this.buildPlan(
      refactorers,
      assessment,
      [
        'Stateful resources (Cognito, S3, DynamoDB, etc...) will be moved from Gen1 to Gen2 CloudFormation stacks',
        'Your Gen1 app will no longer manage these resources',
      ],
      'Execute',
    );
  }

  public async rollback(): Promise<Plan> {
    const toStack = this.extractParameters();
    const { accountId, gen1Env, gen2Branch, cfn } = await this.createInfrastructure(toStack);

    const refactorers: Planner[] = [];
    const assessor = new AmplifyMigrationAssessor(this.gen1App);
    const assessment = assessor.assess();

    const discovered = this.gen1App.discover();

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
          refactorers.push(new AuthCognitoRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'auth:Cognito-UserPool-Groups':
          refactorers.push(
            new AuthUserPoolGroupsRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn),
          );
          break;
        case 'storage:S3':
          refactorers.push(new StorageS3RollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'storage:DynamoDB':
          refactorers.push(new StorageDynamoRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          break;
        case 'analytics:Kinesis':
          refactorers.push(
            new AnalyticsKinesisRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn),
          );
          break;

        // stateless resources — nothing to refactor
        case 'function:Lambda':
        case 'api:AppSync':
        case 'api:API Gateway':
        case 'geo:Map':
        case 'geo:PlaceIndex':
          break;

        // unsupported/unknown resources - skip them.
        // the assessment validation will surface these to the user
        // and require confirmation of missing capabilities.
        case 'geo:GeofenceCollection':
        case 'UNKNOWN':
          break;
      }
    }

    return this.buildPlan(
      refactorers,
      assessment,
      ['Stateful resources will be moved back to Gen1 CloudFormation stacks', 'Your Gen2 app will no longer manage these resources'],
      'Rollback',
    );
  }

  /**
   * Creates shared AWS clients, stack facades, and the Cfn instance.
   */
  private async createInfrastructure(toStack: string): Promise<{
    accountId: string;
    gen1Env: StackFacade;
    gen2Branch: StackFacade;
    cfn: Cfn;
  }> {
    const { Account: accountId } = await this.gen1App.clients.sts.send(new GetCallerIdentityCommand({}));
    if (!accountId) {
      throw new AmplifyError('ConfigurationError', { message: 'Unable to determine AWS account ID' });
    }

    const clients = this.gen1App.clients;
    const gen1Env = new StackFacade(clients, this.gen1App.rootStackName);
    const gen2Branch = new StackFacade(clients, toStack);
    const cfn = new Cfn(clients.cloudFormation, this.logger);

    return { accountId, gen1Env, gen2Branch, cfn };
  }

  /**
   * Collects operations from all refactorers.
   */
  private async buildPlan(refactorers: Planner[], assessment: Assessment, implications: string[], title: string): Promise<Plan> {
    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Lock status', run: () => this.validateLockStatus() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    operations.push({
      describe: async () => [],
      validate: () => ({
        description: 'Assessment',
        run: async () => {
          const valid = assessment.validFor('refactor');
          return { valid, report: valid ? undefined : assessment.render() };
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    for (const refactorer of refactorers) {
      operations.push(...(await refactorer.plan()));
    }

    return new Plan({ operations, logger: this.logger, implications, title });
  }

  private async validateLockStatus(): Promise<ValidationResult> {
    try {
      await this.validations.validateLockStatus();
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
