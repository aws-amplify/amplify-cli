/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AmplifyMigrationStep } from '../_step';
import { prompter } from '@aws-amplify/amplify-prompts';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { AmplifyGen2MigrationValidations } from '../_validations';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { TemplateGenerator } from './generators/template-generator';

// Resource mapping interface (copied from migrate-template-gen)
interface ResourceMapping {
  Source: {
    StackName: string;
    LogicalResourceId: string;
  };
  Destination: {
    StackName: string;
    LogicalResourceId: string;
  };
}

// Constants
const FILE_PROTOCOL_PREFIX = 'file://';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  private toStack?: string;
  private resourceMappings?: string;
  private parsedResourceMappings?: ResourceMapping[];

  public implications(): string[] {
    return ['Move stateful resources from your Gen1 app to be managed by your Gen2 app'];
  }

  public async validate(): Promise<void> {
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
    return;
  }

  public async execute(): Promise<void> {
    // Extract parameters from context
    this.extractParameters();

    // Process resource mappings if provided
    if (this.resourceMappings) {
      await this.processResourceMappings();
    }

    if (this.parsedResourceMappings) {
      this.logger.debug(`📊 Using ${this.parsedResourceMappings.length} custom resource mapping(s)`);
    }

    // Execute the stack refactoring
    await this.executeStackRefactor();
  }

  public async rollback(): Promise<void> {
    this.logger.info('Not implemented');
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

    this.logger.info(`📋 Processing resource mappings from: ${this.resourceMappings}`);

    // Validate file protocol prefix
    if (!this.resourceMappings.startsWith(FILE_PROTOCOL_PREFIX)) {
      throw new AmplifyError('InputValidationError', {
        message: `Resource mappings path must start with ${FILE_PROTOCOL_PREFIX}`,
        resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/mappings.json`,
      });
    }

    // Extract file path
    const resourceMapPath = this.resourceMappings.split(FILE_PROTOCOL_PREFIX)[1];
    if (!resourceMapPath) {
      throw new AmplifyError('InputValidationError', {
        message: 'Invalid resource mappings path',
        resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/file.json`,
      });
    }

    // Read and parse the file
    try {
      if (!(await fs.pathExists(resourceMapPath))) {
        throw new AmplifyError('FileNotFoundError', {
          message: `Resource mappings file not found: ${resourceMapPath}`,
          resolution: 'Ensure the file exists and the path is correct.',
        });
      }

      const fileContent = await fs.readFile(resourceMapPath, 'utf-8');
      this.logger.info('✅ Resource mappings file loaded successfully');

      try {
        this.parsedResourceMappings = JSON.parse(fileContent);
        this.logger.info(`📊 Found ${this.parsedResourceMappings?.length || 0} resource mapping(s)`);
      } catch (parseError) {
        throw new AmplifyError('InputValidationError', {
          message: `Failed to parse JSON from resource mappings file: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`,
          resolution: 'Ensure the file contains valid JSON.',
        });
      }

      // Validate structure
      if (!Array.isArray(this.parsedResourceMappings) || !this.parsedResourceMappings.every(this.isResourceMappingValid)) {
        throw new AmplifyError('InputValidationError', {
          message: 'Invalid resource mappings structure',
          resolution:
            'Each mapping must have Source and Destination objects with StackName and LogicalResourceId properties.',
        });
      }

      this.logger.info('✅ Resource mappings validated successfully');
    } catch (error) {
      if (error instanceof AmplifyError) {
        throw error;
      }
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new AmplifyError('FileNotFoundError', {
          message: `Resource mappings file not found: ${resourceMapPath}`,
          resolution: 'Ensure the file exists and the path is correct.',
        });
      }
      throw error;
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

  private async executeStackRefactor(): Promise<void> {
    // Initialize template generator
    const [templateGenerator, envName] = await this.initializeTemplateGenerator();

    // Initialize template generator (parse category stacks for assessment)
    await templateGenerator.initializeForAssessment();

    // Interactive assessment and selection
    const selectedCategories = await this.assessAndSelectCategories(templateGenerator);

    if (selectedCategories.length === 0) {
      this.logger.info('ℹ️  No categories selected for migration. Exiting.');
      return;
    }

    this.logger.info('🔧 Executing CloudFormation stack refactor...');
    this.logger.info(`📋 Selected categories: ${selectedCategories.join(', ')}`);

    const success = await templateGenerator.generateSelectedCategories(selectedCategories, this.parsedResourceMappings);

    if (success) {
      // Emit usage analytics
      await this.emitUsageAnalytics(envName, true);
    } else {
      await this.emitUsageAnalytics(envName, false);
      throw new Error('Failed to execute CloudFormation stack refactor');
    }
  }

  // Interactive category assessment and selection
  private async assessAndSelectCategories(templateGenerator: TemplateGenerator): Promise<string[]> {
    this.logger.info('');
    this.logger.info('🔍 Assessing available resources for migration...');

    // Assess each category for available resources
    const categoryAssessments = await this.assessCategoryResources(templateGenerator);

    if (categoryAssessments.length === 0) {
      this.logger.info('⚠️  No resources found in any category for migration.');
      return [];
    }

    // Display assessment results
    this.logger.info('');
    this.logger.info('📊 Migration Assessment Results:');
    this.logger.info('');

    for (const assessment of categoryAssessments) {
      const { category, resourceCount, resourceTypes, hasOAuth, stackId } = assessment;

      this.logger.info(`🔹 ${category.toUpperCase()} Category:`);
      this.logger.info(`   • Resources to migrate: ${resourceCount}`);
      this.logger.info(`   • Resource types: ${resourceTypes.join(', ')}`);
      if (hasOAuth) {
        this.logger.info(`   • OAuth providers detected: Yes`);
      }
      this.logger.info(`   • Source stack: ${stackId}`);
      this.logger.info('');
    }

    // Prompt user for category selection
    const availableCategories = categoryAssessments.map((a) => a.category);

    const selectionChoice = 'Migrate all categories';

    if (selectionChoice === 'Migrate all categories') {
      return availableCategories;
    }

    // Individual category selection
    const selectedCategories: string[] = [];

    for (const assessment of categoryAssessments) {
      const { category, resourceCount } = assessment;
      const shouldMigrate = await prompter.yesOrNo(`Migrate ${category} category? (${resourceCount} resources)`, true);

      if (shouldMigrate) {
        selectedCategories.push(category);
      }
    }

    if (selectedCategories.length === 0) {
      this.logger.info('ℹ️  No categories selected.');
      return [];
    }

    this.logger.info(`✅ Selected categories: ${selectedCategories.join(', ')}`);
    return selectedCategories;
  }

  // Assess resources in each category
  private async assessCategoryResources(templateGenerator: TemplateGenerator): Promise<
    Array<{
      category: string;
      resourceCount: number;
      resourceTypes: string[];
      hasOAuth: boolean;
      stackId: string;
    }>
  > {
    const assessments: Array<{
      category: string;
      resourceCount: number;
      resourceTypes: string[];
      hasOAuth: boolean;
      stackId: string;
    }> = [];

    for (const [category, [sourceCategoryStackId]] of templateGenerator.categoryStackMap.entries()) {
      try {
        const sourceTemplate = await templateGenerator.getStackTemplate(sourceCategoryStackId);
        if (!sourceTemplate?.Resources) continue;

        const resourcesToMigrate = templateGenerator.getResourcesToMigrate(sourceTemplate, category);

        if (resourcesToMigrate.length === 0) continue;

        // Get resource types
        const resourceTypes = [
          ...new Set(resourcesToMigrate.map((logicalId) => sourceTemplate.Resources[logicalId]?.Type).filter(Boolean)),
        ];

        // Check for OAuth (auth category only)
        let hasOAuth = false;
        if (category === 'auth') {
          const stackInfo = await templateGenerator.cfnClient.send(new DescribeStacksCommand({ StackName: sourceCategoryStackId }));
          const parameters = stackInfo.Stacks?.[0]?.Parameters || [];
          hasOAuth = parameters.some((param) => param.ParameterKey === 'hostedUIProviderMeta');
        }

        assessments.push({
          category,
          resourceCount: resourcesToMigrate.length,
          resourceTypes,
          hasOAuth,
          stackId: sourceCategoryStackId,
        });
      } catch (error) {
        this.logger.debug(`Failed to assess ${category} category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return assessments;
  }

  private async initializeTemplateGenerator(): Promise<[TemplateGenerator, string]> {
    // Get AWS account ID
    const stsClient = new STSClient({});
    const callerIdentityResult = await stsClient.send(new GetCallerIdentityCommand({}));
    const accountId = callerIdentityResult.Account;

    if (!accountId) {
      throw new Error('Unable to determine AWS account ID');
    }

    const backendEnvironmentName = this.currentEnvName;

    // Create AWS service clients
    const cfnClient = new CloudFormationClient({});
    const ssmClient = new SSMClient({});
    const cognitoIdpClient = new CognitoIdentityProviderClient({});

    // Create template generator using the real TemplateGenerator implementation
    const templateGenerator = new TemplateGenerator(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.rootStackName,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.toStack!,
      accountId,
      cfnClient,
      ssmClient,
      cognitoIdpClient,
      this.appId,
      backendEnvironmentName,
      this.logger,
    );

    return [templateGenerator, backendEnvironmentName];
  }

  private async emitUsageAnalytics(envName: string, success: boolean): Promise<void> {
    // Simplified usage analytics (would normally use UsageData.Instance)
    try {
      this.logger.debug(`Analytics: refactor command ${success ? 'succeeded' : 'failed'} for env: ${envName}`);
    } catch (error) {
      // Ignore analytics errors
    }
  }
}
