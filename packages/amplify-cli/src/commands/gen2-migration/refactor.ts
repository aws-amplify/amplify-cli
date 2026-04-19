/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from './_infra/step';
import { AmplifyMigrationOperation, ValidationResult } from './_infra/operation';
import { Plan } from './_infra/plan';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { StackFacade } from './refactor/stack-facade';
import { Planner } from './_infra/planner';
import { AuthCognitoForwardRefactorer } from './refactor/auth/auth-cognito-forward';
import { AuthCognitoRollbackRefactorer } from './refactor/auth/auth-cognito-rollback';
import { StorageS3ForwardRefactorer } from './refactor/storage/storage-forward';
import { StorageS3RollbackRefactorer } from './refactor/storage/storage-rollback';
import { StorageDynamoForwardRefactorer } from './refactor/storage/storage-dynamo-forward';
import { StorageDynamoRollbackRefactorer } from './refactor/storage/storage-dynamo-rollback';
import { AnalyticsKinesisForwardRefactorer } from './refactor/analytics/analytics-forward';
import { AnalyticsKinesisRollbackRefactorer } from './refactor/analytics/analytics-rollback';
import { Assessment } from './assess/assessment';
import { AuthUserPoolGroupsForwardRefactorer } from './refactor/auth/auth-user-pool-groups-forward';
import { AuthUserPoolGroupsRollbackRefactorer } from './refactor/auth/auth-user-pool-groups-rollback';
import { Cfn } from './refactor/cfn';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { AmplifyMigrationAssessor } from './assess';
import { CustomCDKRollbackRefactorer } from './refactor/custom/custom-cdk-rollback';
import { CustomCDKForwardRefactorer } from './refactor/custom/custom-cdk-forward';

const GUIDE_LINK = 'https://github.com/aws-amplify/amplify-cli/blob/gen2-migration/GEN2_MIGRATION_GUIDE.md#5-refactor';

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
        case 'auth:Cognito': {
          const isReferenceAuth = discovered
            .filter((r) => r.category === 'auth')
            .some((r) => {
              const meta = (this.gen1App.meta('auth') ?? {})[r.resourceName] as Record<string, unknown> | undefined;
              return meta?.serviceType === 'imported';
            });
          if (!isReferenceAuth) {
            refactorers.push(new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          }
          break;
        }
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
        case 'custom:customCDK':
          refactorers.push(new CustomCDKForwardRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
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

    const plan = await this.buildPlan(
      refactorers,
      assessment,
      [
        'Stateful resources (Cognito, S3, DynamoDB, etc...) will be moved from Gen1 to Gen2 CloudFormation stacks',
        'Your Gen1 app will no longer manage these resources',
      ],
      'Execute',
    );

    plan.addOperation({
      describe: async () => [],
      validate: () => undefined,
      execute: async () => {
        printer.blankLine();
        printer.info(chalk.bold(chalk.yellow('⚠️ Follow the post-refactor manual steps to avoid resource replacement ⚠️')));
        printer.blankLine();
        printer.info(chalk.yellow(GUIDE_LINK));
      },
    });

    return plan;
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
        case 'auth:Cognito': {
          // Imported auth resources have no CloudFormation stack to move — skip.
          const isReferenceAuth = discovered
            .filter((r) => r.category === 'auth')
            .some((r) => {
              const meta = (this.gen1App.meta('auth') ?? {})[r.resourceName] as Record<string, unknown> | undefined;
              return meta?.serviceType === 'imported';
            });
          if (!isReferenceAuth) {
            refactorers.push(new AuthCognitoRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
          }
          break;
        }
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
        case 'custom:customCDK':
          refactorers.push(new CustomCDKRollbackRefactorer(gen1Env, gen2Branch, this.gen1App, accountId, this.logger, resource, cfn));
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
