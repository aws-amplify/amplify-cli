/* eslint-disable spellcheck/spell-checker */
import { AmplifyMigrationStep } from '../_step';
import { AmplifyMigrationOperation } from '../_operation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AmplifyGen2MigrationValidations } from '../_validations';
import { AwsClients } from '../refactor-new/aws-clients';
import { StackFacade } from '../refactor-new/stack-facade';
import { Refactorer, RefactorOperation } from '../refactor-new/refactorer';
import { ResourceMapping } from '../refactor-new/workflow/category-refactorer';
import { AuthForwardRefactorer } from '../refactor-new/auth/auth-forward';
import { AuthRollbackRefactorer } from '../refactor-new/auth/auth-rollback';
import { StorageForwardRefactorer } from '../refactor-new/storage/storage-forward';
import { StorageRollbackRefactorer } from '../refactor-new/storage/storage-rollback';
import { AnalyticsForwardRefactorer } from '../refactor-new/analytics/analytics-forward';
import { AnalyticsRollbackRefactorer } from '../refactor-new/analytics/analytics-rollback';

const FILE_PROTOCOL_PREFIX = 'file://';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  private toStack?: string;
  private resourceMappings?: string;
  private parsedResourceMappings?: ResourceMapping[];

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
    this.extractParameters();

    // Custom resources: if --resourceMappings provided, use legacy code path
    if (this.resourceMappings) {
      await this.processResourceMappings();
    }
    if (this.parsedResourceMappings) {
      return this.executeLegacy();
    }

    return this.executeNew();
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    this.extractParameters();

    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure();

    const refactorers: Refactorer[] = [
      new AuthRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new StorageRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new AnalyticsRollbackRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
    ];

    const operations = await this.planAndValidate(refactorers);
    return operations;
  }

  private async executeNew(): Promise<AmplifyMigrationOperation[]> {
    const { clients, accountId, gen1Env, gen2Branch } = await this.createInfrastructure();

    const refactorers: Refactorer[] = [
      new AuthForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId, this.appId, this.currentEnvName),
      new StorageForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
      new AnalyticsForwardRefactorer(gen1Env, gen2Branch, clients, this.region, accountId),
    ];

    const operations = await this.planAndValidate(refactorers);
    return operations;
  }

  /**
   * Legacy code path for custom resource mappings (--resourceMappings flag).
   * Kept until a custom resource refactorer is implemented.
   */
  private async executeLegacy(): Promise<AmplifyMigrationOperation[]> {
    let TemplateGenerator;
    try {
      ({ TemplateGenerator } = await import('./generators/template-generator'));
    } catch {
      throw new AmplifyError('NotImplementedError', {
        message: '--resourceMappings requires the legacy refactor code which has been removed',
        resolution: 'A custom resource refactorer has not been implemented yet. Please remove the --resourceMappings flag.',
      });
    }

    return [
      {
        describe: async () => ['Move stateful resources from your Gen1 app to be managed by your Gen2 app'],
        execute: async () => {
          const templateGenerator = await this.initializeLegacyTemplateGenerator(TemplateGenerator);
          await templateGenerator.initializeForAssessment();
          const categories = [...templateGenerator.categoryStackMap.keys()];
          const success = await templateGenerator.generateSelectedCategories(categories, this.parsedResourceMappings);
          if (!success) {
            throw new AmplifyError('DeploymentError', { message: 'Failed to execute CloudFormation stack refactor' });
          }
        },
      },
    ];
  }

  private async createInfrastructure(): Promise<{
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
    const gen2Branch = new StackFacade(clients, this.toStack!);

    return { clients, accountId, gen1Env, gen2Branch };
  }

  /**
   * Collects operations from all refactorers and runs validation (R7).
   */
  private async planAndValidate(refactorers: Refactorer[]): Promise<RefactorOperation[]> {
    const operations: RefactorOperation[] = [];
    for (const refactorer of refactorers) {
      operations.push(...(await refactorer.plan()));
    }

    // R7: All validations complete before any mutations
    for (const op of operations) {
      await op.validate();
    }

    return operations;
  }

  private extractParameters(): void {
    this.toStack = this.context.parameters?.options?.to;
    this.resourceMappings = this.context.parameters?.options?.resourceMappings;

    if (!this.toStack) {
      throw new AmplifyError('InputValidationError', { message: '--to is required' });
    }
  }

  private async processResourceMappings(): Promise<void> {
    if (!this.resourceMappings) return;

    if (!this.resourceMappings.startsWith(FILE_PROTOCOL_PREFIX)) {
      throw new AmplifyError('InputValidationError', {
        message: `Resource mappings path must start with ${FILE_PROTOCOL_PREFIX}`,
        resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/mappings.json`,
      });
    }

    const resourceMapPath = this.resourceMappings.split(FILE_PROTOCOL_PREFIX)[1];
    if (!resourceMapPath) {
      throw new AmplifyError('InputValidationError', {
        message: 'Invalid resource mappings path',
        resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/file.json`,
      });
    }

    if (!(await fs.pathExists(resourceMapPath))) {
      throw new AmplifyError('ResourceDoesNotExistError', {
        message: `Resource mappings file not found: ${resourceMapPath}`,
        resolution: 'Ensure the file exists and the path is correct.',
      });
    }

    const fileContent = await fs.readFile(resourceMapPath, 'utf-8');

    try {
      this.parsedResourceMappings = JSON.parse(fileContent);
    } catch (parseError) {
      throw new AmplifyError('InputValidationError', {
        message: `Failed to parse JSON from resource mappings file: ${
          parseError instanceof Error ? parseError.message : 'Invalid JSON format'
        }`,
        resolution: 'Ensure the file contains valid JSON.',
      });
    }

    if (!Array.isArray(this.parsedResourceMappings) || !this.parsedResourceMappings.every(this.isResourceMappingValid)) {
      throw new AmplifyError('InputValidationError', {
        message: 'Invalid resource mappings structure',
        resolution: 'Each mapping must have Source and Destination objects with StackName and LogicalResourceId properties.',
      });
    }
  }

  private isResourceMappingValid(resourceMapping: unknown): resourceMapping is ResourceMapping {
    return (
      typeof resourceMapping === 'object' &&
      resourceMapping !== null &&
      'Destination' in resourceMapping &&
      typeof resourceMapping.Destination === 'object' &&
      resourceMapping.Destination !== null &&
      'StackName' in resourceMapping.Destination &&
      typeof resourceMapping.Destination.StackName === 'string' &&
      'LogicalResourceId' in resourceMapping.Destination &&
      typeof resourceMapping.Destination.LogicalResourceId === 'string' &&
      'Source' in resourceMapping &&
      typeof resourceMapping.Source === 'object' &&
      resourceMapping.Source !== null &&
      'StackName' in resourceMapping.Source &&
      typeof resourceMapping.Source.StackName === 'string' &&
      'LogicalResourceId' in resourceMapping.Source &&
      typeof resourceMapping.Source.LogicalResourceId === 'string'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async initializeLegacyTemplateGenerator(TemplateGenerator: any) {
    const stsClient = new STSClient({});
    const { Account: accountId } = await stsClient.send(new GetCallerIdentityCommand({}));
    if (!accountId) {
      throw new AmplifyError('ConfigurationError', { message: 'Unable to determine AWS account ID' });
    }

    const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
    const { SSMClient } = await import('@aws-sdk/client-ssm');
    const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider');

    return new TemplateGenerator(
      this.rootStackName,
      this.toStack!,
      accountId,
      new CloudFormationClient({}),
      new SSMClient({}),
      new CognitoIdentityProviderClient({}),
      this.appId,
      this.currentEnvName,
      this.logger,
      this.region,
    );
  }
}
