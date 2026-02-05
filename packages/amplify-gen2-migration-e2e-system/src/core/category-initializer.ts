/**
 * Category Initializer for adding Amplify categories programmatically
 * Uses the e2e-core utilities for reliable category initialization
 */

import { ILogger } from '../interfaces';
import {
  AppConfiguration,
  LogContext,
  APIConfiguration,
  AuthConfiguration,
  StorageConfiguration,
  FunctionConfiguration,
  RestApiConfiguration,
} from '../types';
import {
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithEmail,
  addAuthWithGroups,
  addApiWithBlankSchema,
  addRestApi,
  addS3Storage,
  addS3StorageWithAuthOnly,
  addS3WithTrigger,
  addDynamoDBWithGSIWithSettings,
  addFunction,
  updateSchema,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs';
import * as path from 'path';

export interface CategoryInitializerOptions {
  appPath: string;
  config: AppConfiguration;
  deploymentName: string;
}

export interface InitializeCategoriesResult {
  initializedCategories: string[];
  skippedCategories: string[];
  errors: Array<{ category: string; error: string }>;
}

export class CategoryInitializer {
  constructor(private readonly logger: ILogger) {}

  /**
   * Initialize all categories defined in the configuration
   */
  async initializeCategories(options: CategoryInitializerOptions): Promise<InitializeCategoriesResult> {
    const { appPath, config, deploymentName } = options;
    const context: LogContext = { appName: deploymentName, operation: 'initializeCategories' };

    const result: InitializeCategoriesResult = {
      initializedCategories: [],
      skippedCategories: [],
      errors: [],
    };

    this.logger.info(`Starting category initialization for ${deploymentName}`, context);

    const categories = config.categories;
    if (!categories) {
      this.logger.info('No categories defined in configuration', context);
      return result;
    }

    // Initialize categories in the correct order:
    // 1. Auth first (other categories may depend on it)
    // 2. Functions before REST API (REST API requires existing Lambda)
    // 3. Storage (may have triggers that reference functions)
    // 4. GraphQL API
    // 5. REST API last (needs functions to exist)
    if (categories.auth) {
      await this.initializeAuthCategory(appPath, categories.auth, result, context);
    }

    // Initialize functions before API (REST API requires existing Lambda functions)
    if (categories.function) {
      await this.initializeFunctionCategory(appPath, categories.function, result, context);
    }

    if (categories.storage) {
      await this.initializeStorageCategory(appPath, categories.storage, result, context);
    }

    if (categories.api) {
      await this.initializeApiCategory(appPath, categories.api, categories.function, result, context);
    }

    // Initialize REST API separately if configured
    if (categories.restApi) {
      await this.initializeRestApiCategory(appPath, categories.restApi, categories.function, result, context);
    }

    this.logger.info(`Category initialization complete. Initialized: ${result.initializedCategories.join(', ') || 'none'}`, context);

    return result;
  }

  /**
   * Initialize the auth category based on configuration
   * Supports: social providers, user pool groups
   * Not yet supported: auth triggers (preSignUp, etc.)
   */
  private async initializeAuthCategory(
    appPath: string,
    authConfig: AuthConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    const hasSocialProviders = authConfig.socialProviders && authConfig.socialProviders.length > 0;
    const hasUserPoolGroups = authConfig.userPoolGroups && authConfig.userPoolGroups.length > 0;
    const hasAuthTriggers = authConfig.triggers && Object.keys(authConfig.triggers).length > 0;

    // Log what we're configuring
    const features: string[] = [];
    if (hasSocialProviders) features.push('social providers');
    if (hasUserPoolGroups) features.push('user pool groups');
    if (hasAuthTriggers) features.push('triggers (not yet supported)');

    const authType = features.length > 0 ? `with ${features.join(', ')}` : 'with default settings';
    this.logger.info(`Initializing auth category ${authType}...`, context);

    // Warn about unsupported features
    if (hasAuthTriggers) {
      this.logger.warn('Auth triggers (preSignUp, postConfirmation, etc.) are not yet supported by category-initializer', context);
    }

    try {
      if (hasUserPoolGroups) {
        // Use auth with groups (creates Admins and Users groups by default)
        // Note: addAuthWithGroups creates hardcoded "Admins" and "Users" groups
        this.logger.debug(`User pool groups configured: ${authConfig.userPoolGroups?.join(', ')}`, context);
        await addAuthWithGroups(appPath);
      } else if (hasSocialProviders) {
        // Use social auth when social providers are configured
        // This sets up Cognito with Facebook, Google, and Amazon OAuth
        this.logger.debug(`Social providers configured: ${authConfig.socialProviders.join(', ')}`, context);
        await addAuthWithDefaultSocial(appPath);
      } else if (authConfig.signInMethods?.includes('email')) {
        // Use email sign-in when explicitly configured
        this.logger.debug('Using email sign-in method', context);
        await addAuthWithEmail(appPath);
      } else {
        // Use default auth configuration (username sign-in)
        await addAuthWithDefault(appPath);
      }

      result.initializedCategories.push('auth');
      this.logger.info('Auth category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize auth category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'auth', error: errorMessage });
    }
  }

  /**
   * Initialize the GraphQL API category
   */
  private async initializeApiCategory(
    appPath: string,
    apiConfig: APIConfiguration,
    functionConfig: FunctionConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    // Only handle GraphQL here; REST is handled separately
    if (apiConfig.type !== 'GraphQL') {
      // If type is REST but no restApi config, use legacy behavior
      if (apiConfig.type === 'REST') {
        await this.initializeRestApiFromLegacyConfig(appPath, functionConfig, result, context);
      }
      return;
    }

    this.logger.info('Initializing GraphQL API category...', context);

    try {
      // Add GraphQL API with blank schema
      await addApiWithBlankSchema(appPath);

      // If a schema file is specified, update the schema
      if (apiConfig.schema) {
        const schemaPath = path.join(appPath, apiConfig.schema);
        if (fs.existsSync(schemaPath)) {
          const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
          // Get the API name from the amplify backend config
          const apiName = this.getApiNameFromBackend(appPath);
          if (apiName) {
            updateSchema(appPath, apiName, schemaContent);
            this.logger.debug(`Updated schema from ${apiConfig.schema}`, context);
          }
        } else {
          this.logger.warn(`Schema file not found: ${schemaPath}`, context);
        }
      }

      result.initializedCategories.push('api');
      this.logger.info('GraphQL API category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize GraphQL API category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'api', error: errorMessage });
    }
  }

  /**
   * Initialize REST API from the new restApi configuration
   */
  private async initializeRestApiCategory(
    appPath: string,
    restApiConfig: RestApiConfiguration,
    functionConfig: FunctionConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    this.logger.info(`Initializing REST API category (${restApiConfig.name})...`, context);

    // REST API requires at least one Lambda function to exist
    const hasFunctions = functionConfig && functionConfig.functions.length > 0;
    if (!hasFunctions) {
      this.logger.warn('REST API requires at least one Lambda function, skipping', context);
      result.skippedCategories.push('restApi');
      return;
    }

    // Check if the specified lambda source exists
    const lambdaExists = functionConfig.functions.some((f) => f.name === restApiConfig.lambdaSource);
    if (!lambdaExists) {
      this.logger.warn(`REST API lambda source '${restApiConfig.lambdaSource}' not found in functions, skipping`, context);
      result.skippedCategories.push('restApi');
      return;
    }

    try {
      await addRestApi(appPath, {
        isFirstRestApi: true,
        existingLambda: true,
        restrictAccess: true,
        allowGuestUsers: false,
        projectContainsFunctions: true,
        apiName: restApiConfig.name,
      });

      result.initializedCategories.push('restApi');
      this.logger.info('REST API category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize REST API category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'restApi', error: errorMessage });
    }
  }

  /**
   * Initialize REST API from legacy api.type: "REST" configuration
   */
  private async initializeRestApiFromLegacyConfig(
    appPath: string,
    functionConfig: FunctionConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    this.logger.info('Initializing REST API category (legacy config)...', context);

    const hasFunctions = functionConfig && functionConfig.functions.length > 0;
    if (!hasFunctions) {
      this.logger.warn('REST API requires at least one Lambda function, skipping', context);
      result.skippedCategories.push('api');
      return;
    }

    try {
      await addRestApi(appPath, {
        isFirstRestApi: true,
        existingLambda: true,
        restrictAccess: true,
        allowGuestUsers: false,
        projectContainsFunctions: true,
      });

      result.initializedCategories.push('api');
      this.logger.info('REST API category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize REST API category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'api', error: errorMessage });
    }
  }

  /**
   * Initialize the storage category based on configuration
   * Supports: S3 buckets (auth-only, auth+guest, with triggers), DynamoDB tables
   */
  private async initializeStorageCategory(
    appPath: string,
    storageConfig: StorageConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    // Check if this is DynamoDB storage
    if (storageConfig.type === 'dynamodb' && storageConfig.tables && storageConfig.tables.length > 0) {
      await this.initializeDynamoDBStorage(appPath, storageConfig, result, context);
      return;
    }

    // S3 storage
    if (!storageConfig.buckets || storageConfig.buckets.length === 0) {
      this.logger.warn('No storage buckets configured, skipping storage category', context);
      result.skippedCategories.push('storage');
      return;
    }

    // Check if guest access is configured for any bucket
    const hasGuestAccess = storageConfig.buckets.some((bucket) => bucket.access.includes('guest') || bucket.access.includes('public'));
    // Check if triggers are configured
    const hasTriggers = storageConfig.triggers && storageConfig.triggers.length > 0;

    const accessType = hasGuestAccess ? 'auth and guest' : 'auth-only';
    const triggerInfo = hasTriggers ? ' with Lambda trigger' : '';
    this.logger.info(`Initializing S3 storage category with ${accessType} access${triggerInfo}...`, context);

    try {
      if (hasTriggers) {
        // Add S3 storage with Lambda trigger (creates a new trigger function)
        this.logger.debug('Adding S3 storage with Lambda trigger', context);
        await addS3WithTrigger(appPath);
      } else if (hasGuestAccess) {
        // Add S3 storage with auth and guest access
        await addS3Storage(appPath);
      } else {
        // Add S3 storage with auth-only access
        await addS3StorageWithAuthOnly(appPath);
      }

      result.initializedCategories.push('storage');
      this.logger.info('Storage category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize storage category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'storage', error: errorMessage });
    }
  }

  /**
   * Initialize DynamoDB storage
   */
  private async initializeDynamoDBStorage(
    appPath: string,
    storageConfig: StorageConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    const tables = storageConfig.tables;
    if (!tables || tables.length === 0) {
      this.logger.warn('No DynamoDB tables configured, skipping storage category', context);
      result.skippedCategories.push('storage');
      return;
    }

    this.logger.info(`Initializing DynamoDB storage with ${tables.length} table(s)...`, context);

    try {
      for (const table of tables) {
        this.logger.debug(`Adding DynamoDB table: ${table.name}`, context);

        // Use addDynamoDBWithGSIWithSettings if GSI is configured
        if (table.gsi && table.gsi.length > 0) {
          await addDynamoDBWithGSIWithSettings(appPath, {
            resourceName: table.name,
            tableName: table.name,
            gsiName: table.gsi[0].name,
          });
        } else {
          // For tables without GSI, we still use the GSI function but it will create default columns
          // This is a limitation of the e2e-core helpers
          this.logger.warn(`DynamoDB table '${table.name}' without GSI - using default schema`, context);
          await addDynamoDBWithGSIWithSettings(appPath, {
            resourceName: table.name,
            tableName: table.name,
            gsiName: `${table.name}GSI`,
          });
        }

        this.logger.debug(`DynamoDB table ${table.name} added successfully`, context);
      }

      result.initializedCategories.push('storage');
      this.logger.info('DynamoDB storage category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize DynamoDB storage: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'storage', error: errorMessage });
    }
  }

  /**
   * Initialize the function category (Lambda functions)
   * Supports: basic functions with various runtimes and templates
   * Not yet supported: function triggers (DynamoDB streams, etc.)
   */
  private async initializeFunctionCategory(
    appPath: string,
    functionConfig: FunctionConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    this.logger.info('Initializing function category...', context);

    // Check for unsupported trigger configurations
    const functionsWithTriggers = functionConfig.functions.filter((f) => f.trigger);
    if (functionsWithTriggers.length > 0) {
      this.logger.warn(
        `Function triggers (DynamoDB streams, etc.) are not yet fully supported. ` +
          `Functions with triggers: ${functionsWithTriggers.map((f) => f.name).join(', ')}`,
        context,
      );
    }

    try {
      for (const func of functionConfig.functions) {
        this.logger.debug(`Adding function: ${func.name}`, context);

        const runtime = this.mapRuntime(func.runtime);
        const template = this.mapTemplate(func.template);

        // Skip functions that are trigger-based (they're created by other categories)
        if (func.trigger) {
          this.logger.debug(`Skipping trigger-based function: ${func.name} (will be created by trigger source)`, context);
          continue;
        }

        await addFunction(
          appPath,
          {
            name: func.name,
            functionTemplate: template,
          },
          runtime,
        );

        this.logger.debug(`Function ${func.name} added successfully`, context);
      }

      result.initializedCategories.push('function');
      this.logger.info('Function category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize function category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'function', error: errorMessage });
    }
  }

  /**
   * Map runtime string to e2e-core runtime type
   */
  private mapRuntime(runtime: string): 'nodejs' | 'python' | 'java' | 'dotnet8' | 'go' {
    switch (runtime.toLowerCase()) {
      case 'nodejs':
      case 'node':
        return 'nodejs';
      case 'python':
        return 'python';
      case 'java':
        return 'java';
      case 'dotnet':
      case 'dotnet8':
        return 'dotnet8';
      case 'go':
        return 'go';
      default:
        return 'nodejs';
    }
  }

  /**
   * Map template string to e2e-core template name
   */
  private mapTemplate(template?: string): string {
    if (!template) return 'Hello World';

    switch (template.toLowerCase()) {
      case 'hello-world':
        return 'Hello World';
      case 'serverless-expressjs':
        return 'Serverless ExpressJS function (Integration with API Gateway)';
      case 'lambda-trigger':
        return 'Lambda trigger';
      case 'crud-dynamodb':
        return 'CRUD function for DynamoDB (Integration with API Gateway)';
      default:
        return template;
    }
  }

  /**
   * Get the API name from the amplify backend configuration
   */
  private getApiNameFromBackend(appPath: string): string | null {
    try {
      const backendConfigPath = path.join(appPath, 'amplify', 'backend', 'backend-config.json');
      if (fs.existsSync(backendConfigPath)) {
        const backendConfig = JSON.parse(fs.readFileSync(backendConfigPath, 'utf-8')) as Record<string, Record<string, unknown>>;
        const apiNames = Object.keys(backendConfig.api || {});
        return apiNames.length > 0 ? apiNames[0] : null;
      }
      return null;
    } catch {
      return null;
    }
  }
}
