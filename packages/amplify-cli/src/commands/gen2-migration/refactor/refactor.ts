/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from '../_step';
import { AmplifyMigrationOperation } from '../_operation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AmplifyGen2MigrationValidations } from '../_validations';
import { AwsClients } from './aws-clients';
import { StackFacade } from './stack-facade';
import { Refactorer } from './refactorer';
import { AuthForwardRefactorer } from './auth/auth-forward';
import { AuthRollbackRefactorer } from './auth/auth-rollback';
import { StorageForwardRefactorer } from './storage/storage-forward';
import { StorageRollbackRefactorer } from './storage/storage-rollback';
import { AnalyticsForwardRefactorer } from './analytics/analytics-forward';
import { AnalyticsRollbackRefactorer } from './analytics/analytics-rollback';
import { parseResourceMappings, executeLegacyRefactor } from './legacy-custom-resource';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
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
    const { toStack, resourceMappings } = this.extractParameters();

    // Custom resources: if --resourceMappings provided, use legacy code path
    if (resourceMappings) {
      const parsedMappings = await parseResourceMappings(resourceMappings);
      return executeLegacyRefactor({
        rootStackName: this.rootStackName,
        toStack,
        appId: this.appId,
        currentEnvName: this.currentEnvName,
        region: this.region,
        logger: this.logger,
        parsedMappings,
      });
    }

    return this.executeNew(toStack);
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    const { toStack } = this.extractParameters();
    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure(toStack);

    const refactorers: Refactorer[] = [
      new AuthRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new StorageRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new AnalyticsRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
    ];

    return this.plan(refactorers);
  }

  private async executeNew(toStack: string): Promise<AmplifyMigrationOperation[]> {
    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure(toStack);

    const refactorers: Refactorer[] = [
      new AuthForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.appId, this.currentEnvName),
      new StorageForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new AnalyticsForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
    ];

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

  private extractParameters(): { toStack: string; resourceMappings?: string } {
    const toStack = this.context.parameters?.options?.to;
    const resourceMappings = this.context.parameters?.options?.resourceMappings;

    if (!toStack) {
      throw new AmplifyError('InputValidationError', { message: '--to is required' });
    }

    return { toStack, resourceMappings };
  }
}
