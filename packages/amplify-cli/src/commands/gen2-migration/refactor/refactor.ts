/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AmplifyMigrationStep } from '../_step';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import path from 'path';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

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
const MIGRATION_DIR = '.amplify/migration';
const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationRefactorStep extends AmplifyMigrationStep {
  private fromStack?: string;
  private toStack?: string;
  private resourceMappings?: string;
  private parsedResourceMappings?: ResourceMapping[];

  public async validate(): Promise<void> {
    try {
      printer.info('🔍 Validating refactor parameters and prerequisites...');

      // Extract parameters from context
      this.extractParameters();

      // Validate required parameters
      this.validateParameters();

      // Check prerequisites
      await this.checkPrerequisites();

      // Process resource mappings if provided
      if (this.resourceMappings) {
        await this.processResourceMappings();
      }

      printer.success('✅ Validation completed successfully');
    } catch (error) {
      printer.error(`❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  public async execute(): Promise<void> {
    try {
      printer.info('🔄 Starting Amplify Gen2 migration refactor execution...');
      printer.debug('we are in DEBUG mode');
      printer.info(`Moving resources from Gen1 stack: ${this.fromStack}`);
      printer.info(`To Gen2 stack: ${this.toStack}`);

      if (this.parsedResourceMappings) {
        printer.info(`📊 Using ${this.parsedResourceMappings.length} custom resource mapping(s)`);
      } else {
        printer.info('ℹ️  Using default migration strategy');
      }

      // Execute the stack refactoring
      await this.executeStackRefactor();

      printer.success('✅ Gen2 migration refactor completed successfully!');
      printer.info('');
      printer.info('Next steps:');
      printer.info('1. Review the generated templates in .amplify/migration/templates/');
      printer.info('2. Follow the instructions in the README files');
      printer.info('3. Verify that resources have been moved correctly in the AWS Console');
      printer.info('4. Test your application to ensure all functionality works as expected');
      printer.info('');
      printer.info('For more information, visit: https://docs.amplify.aws/react/start/migrate-to-gen2/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      printer.error(`❌ Gen2 migration refactor failed: ${errorMessage}`);

      // Provide context-specific error guidance
      this.provideErrorGuidance(error);

      throw error;
    }
  }

  public async rollback(): Promise<void> {
    try {
      printer.info('🔄 Rolling back refactor operation...');

      // Clean up any generated files
      const templatesDir = path.join(process.cwd(), MIGRATION_DIR, 'templates');
      if (await fs.pathExists(templatesDir)) {
        await fs.remove(templatesDir);
        printer.info('🗑️  Removed generated template files');
      }

      printer.success('✅ Rollback completed successfully');
    } catch (error) {
      printer.error(`❌ Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private extractParameters(): void {
    const context = this.getContext();
    this.fromStack = context.parameters?.options?.from;
    this.toStack = context.parameters?.options?.to;
    this.resourceMappings = context.parameters?.options?.resourceMappings;
  }

  private validateParameters(): void {
    if (!this.fromStack) {
      throw new Error('Source stack name (--from) is required..');
    }

    if (!this.toStack) {
      throw new Error('Destination stack name (--to) is required');
    }

    printer.info(`✅ Parameters validated: from=${this.fromStack}, to=${this.toStack}`);
  }

  private async checkPrerequisites(): Promise<void> {
    // Check if Gen1 metadata exists
    const metadataPath = path.join(process.cwd(), MIGRATION_DIR, AMPLIFY_DIR, 'backend', 'amplify-meta.json');

    if (!(await fs.pathExists(metadataPath))) {
      throw new Error(
        `Gen1 metadata not found at ${metadataPath}. ` +
          'Please ensure you have run the prepare command first and that Gen1 migration data exists.',
      );
    }

    printer.info('✅ Gen1 metadata found');

    // Validate AWS credentials by making a simple STS call
    try {
      const stsClient = new STSClient({});
      await stsClient.send(new GetCallerIdentityCommand({}));
      printer.info('✅ AWS credentials validated');
    } catch (error) {
      throw new Error(
        'AWS credentials validation failed. Please ensure your AWS credentials are properly configured:\n' +
          '- Run "aws configure" to set up your credentials\n' +
          '- Or ensure your AWS profile is set correctly',
      );
    }
  }

  private async processResourceMappings(): Promise<void> {
    if (!this.resourceMappings) return;

    printer.info(`📋 Processing resource mappings from: ${this.resourceMappings}`);

    // Validate file protocol prefix
    if (!this.resourceMappings.startsWith(FILE_PROTOCOL_PREFIX)) {
      throw new Error(`Resource mappings path must start with ${FILE_PROTOCOL_PREFIX}. ` + 'Example: file:///path/to/mappings.json');
    }

    // Extract file path
    const resourceMapPath = this.resourceMappings.split(FILE_PROTOCOL_PREFIX)[1];
    if (!resourceMapPath) {
      throw new Error(`Invalid resource mappings path. Expected format: ${FILE_PROTOCOL_PREFIX}/path/to/file.json`);
    }

    // Read and parse the file
    try {
      if (!(await fs.pathExists(resourceMapPath))) {
        throw new Error(
          `Resource mappings file not found: ${resourceMapPath}. ` + 'Please ensure the file exists and the path is correct.',
        );
      }

      const fileContent = await fs.readFile(resourceMapPath, 'utf-8');
      printer.info('✅ Resource mappings file loaded successfully');

      try {
        this.parsedResourceMappings = JSON.parse(fileContent);
        printer.info(`📊 Found ${this.parsedResourceMappings?.length || 0} resource mapping(s)`);
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON from resource mappings file: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`,
        );
      }

      // Validate structure
      if (!Array.isArray(this.parsedResourceMappings) || !this.parsedResourceMappings.every(this.isResourceMappingValid)) {
        throw new Error(
          'Invalid resource mappings structure. Each mapping must have Source and Destination objects ' +
            'with StackName and LogicalResourceId properties.',
        );
      }

      printer.info('✅ Resource mappings validated successfully');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(
          `Resource mappings file not found: ${resourceMapPath}. ` + 'Please ensure the file exists and the path is correct.',
        );
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
      printer.info('ℹ️  No categories selected for migration. Exiting.');
      return;
    }

    printer.info('🔧 Executing CloudFormation stack refactor...');
    printer.info(`📋 Selected categories: ${selectedCategories.join(', ')}`);

    const success = await templateGenerator.generateSelectedCategories(selectedCategories, this.parsedResourceMappings);

    if (success) {
      printer.success(`✅ CloudFormation stack refactor completed successfully under ${MIGRATION_DIR}/templates directory.`);

      // Emit usage analytics
      await this.emitUsageAnalytics(envName, true);
    } else {
      await this.emitUsageAnalytics(envName, false);
      throw new Error('Failed to execute CloudFormation stack refactor');
    }
  }

  // Interactive category assessment and selection
  private async assessAndSelectCategories(templateGenerator: TemplateGenerator): Promise<string[]> {
    printer.info('');
    printer.info('🔍 Assessing available resources for migration...');

    // Assess each category for available resources
    const categoryAssessments = await this.assessCategoryResources(templateGenerator);

    if (categoryAssessments.length === 0) {
      printer.warn('⚠️  No resources found in any category for migration.');
      return [];
    }

    // Display assessment results
    printer.info('');
    printer.info('📊 Migration Assessment Results:');
    printer.info('');

    for (const assessment of categoryAssessments) {
      const { category, resourceCount, resourceTypes, hasOAuth, stackId } = assessment;

      printer.info(`🔹 ${category.toUpperCase()} Category:`);
      printer.info(`   • Resources to migrate: ${resourceCount}`);
      printer.info(`   • Resource types: ${resourceTypes.join(', ')}`);
      if (hasOAuth) {
        printer.info(`   • OAuth providers detected: Yes`);
      }
      printer.info(`   • Source stack: ${stackId}`);
      printer.info('');
    }

    // Prompt user for category selection
    const availableCategories = categoryAssessments.map((a) => a.category);

    const selectionChoice = await prompter.pick('Select migration approach:', [
      'Migrate all categories',
      'Select specific categories',
      'Cancel migration',
    ]);

    if (selectionChoice === 'Cancel migration') {
      return [];
    }

    if (selectionChoice === 'Migrate all categories') {
      printer.info(`✅ Selected all categories: ${availableCategories.join(', ')}`);
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
      printer.info('ℹ️  No categories selected.');
      return [];
    }

    printer.info(`✅ Selected categories: ${selectedCategories.join(', ')}`);
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
        printer.debug(`Failed to assess ${category} category: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Read Gen1 metadata
    const metadataPath = path.join(process.cwd(), MIGRATION_DIR, AMPLIFY_DIR, 'backend', 'amplify-meta.json');
    const gen1MetaContent = await fs.readFile(metadataPath, 'utf-8');
    const gen1Meta = JSON.parse(gen1MetaContent);

    const { AmplifyAppId: appId, StackName: stackName } = gen1Meta.providers?.awscloudformation || {};

    if (!appId || !stackName) {
      throw new Error('Invalid Gen1 metadata: missing AmplifyAppId or StackName');
    }

    // Extract backend environment name from stack name
    const backendEnvironmentName = stackName.split('-')?.[2];
    if (!backendEnvironmentName) {
      throw new Error(`Unable to extract environment name from stack: ${stackName}`);
    }

    // Create AWS service clients
    const cfnClient = new CloudFormationClient({});
    const ssmClient = new SSMClient({});
    const cognitoIdpClient = new CognitoIdentityProviderClient({});

    // Create template generator using the real TemplateGenerator implementation
    const templateGenerator = new TemplateGenerator(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.fromStack!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.toStack!,
      accountId,
      cfnClient,
      ssmClient,
      cognitoIdpClient,
      appId,
      backendEnvironmentName,
    );

    return [templateGenerator, backendEnvironmentName];
  }

  private async emitUsageAnalytics(envName: string, success: boolean): Promise<void> {
    // Simplified usage analytics (would normally use UsageData.Instance)
    try {
      printer.debug(`Analytics: refactor command ${success ? 'succeeded' : 'failed'} for env: ${envName}`);
    } catch (error) {
      // Ignore analytics errors
    }
  }

  private provideErrorGuidance(error: unknown): void {
    if (!(error instanceof Error)) return;

    const message = error.message.toLowerCase();

    if (message.includes('stack') && message.includes('not found')) {
      printer.info('');
      printer.info('💡 Stack not found error:');
      printer.info('- Verify that both source and destination stack names are correct');
      printer.info('- Ensure the stacks exist in your current AWS region');
      printer.info('- Check that you have the necessary permissions to access these stacks');
    } else if (message.includes('credentials') || message.includes('authentication')) {
      printer.info('');
      printer.info('💡 AWS credentials issue:');
      printer.info('- Run "aws configure" to set up your credentials');
      printer.info('- Ensure your AWS profile is set correctly');
      printer.info('- Verify your credentials have CloudFormation permissions');
    } else if (message.includes('permission') || message.includes('access')) {
      printer.info('');
      printer.info('💡 Permissions issue:');
      printer.info('- Ensure your AWS user/role has CloudFormation permissions');
      printer.info('- Verify you can read from the source stack and write to the destination stack');
      printer.info('- Check that you have permissions for all resource types being moved');
    } else if (message.includes('resource mappings') || message.includes('json')) {
      printer.info('');
      printer.info('💡 Resource mappings issue:');
      printer.info('- Verify the JSON file format is correct');
      printer.info('- Ensure all required fields (StackName, LogicalResourceId) are present');
      printer.info('- Check that the file path is correct and accessible');
    } else if (message.includes('network') || message.includes('timeout')) {
      printer.info('');
      printer.info('💡 Network connectivity issue:');
      printer.info('- Check your internet connection');
      printer.info('- Verify AWS service endpoints are accessible');
      printer.info('- Try again after a few moments');
    }

    printer.info('');
    printer.info('For troubleshooting help, visit: https://docs.amplify.aws/react/start/migrate-to-gen2/');
  }

  private getContext(): $TSContext {
    // Access the context passed to the constructor
    return (this as any).context;
  }
}
