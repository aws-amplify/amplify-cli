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
  AnalyticsConfiguration,
} from '../types';
import {
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithEmail,
  addAuthWithGroups,
  addApi,
  addApiWithBlankSchema,
  addRestApi,
  addS3Storage,
  addS3StorageWithAuthOnly,
  addS3WithGroupAccess,
  addS3WithTrigger,
  addDynamoDBWithGSIWithSettings,
  addFunction,
  addLambdaTrigger,
  addLambdaTriggerWithModels,
  addKinesis,
  updateSchema,
} from '@aws-amplify/amplify-e2e-core';
import type { CoreFunctionSettings } from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs';
import * as path from 'path';

/** Minimal shape of a CloudFormation template used for CFN patching. */
interface CfnTemplate {
  Parameters?: Record<string, Record<string, unknown>>;
  Resources?: Record<string, unknown> & {
    LambdaFunction?: {
      Properties?: {
        Environment?: {
          Variables?: Record<string, unknown>;
        };
      };
    };
  };
}

/** Minimal shape of backend-config.json / amplify-meta.json used for patching. */
interface AmplifyBackendConfig {
  api?: Record<string, unknown>;
  function?: Record<string, { dependsOn?: unknown[] }>;
}

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

  /** Initialize all categories defined in the configuration. */
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
    // 2. Analytics before functions (functions may reference analytics resources)
    // 3. Regular functions WITHOUT API access before storage/API
    // 4. Storage (may have triggers that reference functions)
    // 5. GraphQL API (creates AppSync tables that trigger functions may reference)
    // 6. Regular functions WITH API access (need API to exist for additionalPermissions)
    // 7. Trigger functions (need AppSync/DynamoDB tables to exist)
    // 8. REST API last (needs functions to exist)
    if (categories.auth) {
      await this.initializeAuthCategory(appPath, categories.auth, result, context);
    }

    if (categories.analytics) {
      await this.initializeAnalyticsCategory(appPath, categories.analytics, result, context);
    }

    // Initialize regular functions that do NOT need API access (before API)
    if (categories.function) {
      await this.initializeRegularFunctions(appPath, categories.function, false, result, context);
    }

    if (categories.storage) {
      await this.initializeStorageCategory(appPath, categories.storage, categories.auth, result, context);
    }

    if (categories.api) {
      await this.initializeApiCategory(appPath, categories.api, categories.function, result, context);
    }

    // Initialize regular functions that need API access (after API exists)
    if (categories.function && categories.api) {
      await this.initializeRegularFunctions(appPath, categories.function, true, result, context);
    }

    if (categories.function) {
      await this.initializeTriggerFunctions(appPath, categories.function, result, context);
    }

    if (categories.restApi) {
      await this.initializeRestApiCategory(appPath, categories.restApi, categories.function, result, context);
    }

    this.logger.info(`Category initialization complete. Initialized: ${result.initializedCategories.join(', ') || 'none'}`, context);

    return result;
  }

  /**
   * Initialize the auth category based on configuration.
   * Supports: social providers, user pool groups.
   * Not yet supported: auth triggers (preSignUp, etc.).
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

    const features: string[] = [];
    if (hasSocialProviders) features.push('social providers');
    if (hasUserPoolGroups) features.push('user pool groups');
    if (hasAuthTriggers) features.push('triggers (not yet supported)');

    const authType = features.length > 0 ? `with ${features.join(', ')}` : 'with default settings';
    this.logger.info(`Initializing auth category ${authType}...`, context);

    if (hasAuthTriggers) {
      this.logger.warn('Auth triggers (preSignUp, postConfirmation, etc.) are not yet supported by category-initializer', context);
    }

    try {
      if (hasUserPoolGroups) {
        this.logger.debug(`User pool groups configured: ${authConfig.userPoolGroups?.join(', ')}`, context);
        await addAuthWithGroups(appPath);
      } else if (hasSocialProviders) {
        this.logger.debug(`Social providers configured: ${authConfig.socialProviders.join(', ')}`, context);
        await addAuthWithDefaultSocial(appPath);
      } else if (authConfig.signInMethods?.includes('email')) {
        this.logger.debug('Using email sign-in method', context);
        await addAuthWithEmail(appPath);
      } else {
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

  /** Initialize the GraphQL API category. */
  private async initializeApiCategory(
    appPath: string,
    apiConfig: APIConfiguration,
    functionConfig: FunctionConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    // Only handle GraphQL here; REST is handled separately
    if (apiConfig.type !== 'GraphQL') {
      if (apiConfig.type === 'REST') {
        await this.initializeRestApiFromLegacyConfig(appPath, functionConfig, result, context);
      }
      return;
    }

    this.logger.info('Initializing GraphQL API category...', context);

    try {
      const needsCognitoAuth = apiConfig.authModes?.includes('COGNITO_USER_POOLS');
      const needsIamAuth = apiConfig.authModes?.includes('IAM');

      if (needsCognitoAuth || needsIamAuth) {
        // Build authTypesConfig in the order specified by migration-config.json so the
        // first auth mode becomes the default (addApi uses the first key as default).
        const authModeMap: Record<string, string> = {
          IAM: 'IAM',
          API_KEY: 'API key',
          COGNITO_USER_POOLS: 'Amazon Cognito User Pool',
        };

        const authTypesConfig: Record<string, Record<string, unknown>> = {};
        for (const mode of apiConfig.authModes ?? []) {
          const mapped = authModeMap[mode];
          if (mapped) authTypesConfig[mapped] = {};
        }

        // Fallback: ensure at least API key is present
        if (Object.keys(authTypesConfig).length === 0) {
          authTypesConfig['API key'] = {};
        }

        // Pass requireAuthSetup = false because the auth category is already initialized
        await addApi(appPath, authTypesConfig, false);
      } else {
        await addApiWithBlankSchema(appPath);
      }

      // If a schema file is specified, update the schema
      if (apiConfig.schema) {
        const schemaPath = path.join(appPath, apiConfig.schema);
        if (fs.existsSync(schemaPath)) {
          const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
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

  /** Initialize REST API from the new restApi configuration. */
  private async initializeRestApiCategory(
    appPath: string,
    restApiConfig: RestApiConfiguration,
    functionConfig: FunctionConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    this.logger.info(`Initializing REST API category (${restApiConfig.name})...`, context);

    const hasFunctions = functionConfig && functionConfig.functions.length > 0;
    if (!hasFunctions) {
      this.logger.warn('REST API requires at least one Lambda function, skipping', context);
      result.skippedCategories.push('restApi');
      return;
    }

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

  /** Initialize REST API from legacy api.type: "REST" configuration. */
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
   * Initialize the storage category based on configuration.
   * Supports: S3 buckets (auth-only, auth+guest, with triggers), DynamoDB tables.
   */
  private async initializeStorageCategory(
    appPath: string,
    storageConfig: StorageConfiguration,
    authConfig: AuthConfiguration | undefined,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    if (storageConfig.type === 'dynamodb' && storageConfig.tables && storageConfig.tables.length > 0) {
      await this.initializeDynamoDBStorage(appPath, storageConfig, result, context);
      return;
    }

    if (!storageConfig.buckets || storageConfig.buckets.length === 0) {
      this.logger.warn('No storage buckets configured, skipping storage category', context);
      result.skippedCategories.push('storage');
      return;
    }

    const hasUserPoolGroups = authConfig?.userPoolGroups && authConfig.userPoolGroups.length > 0;
    const hasGuestAccess = storageConfig.buckets.some((bucket) => bucket.access.includes('guest') || bucket.access.includes('public'));
    const hasTriggers = storageConfig.triggers && storageConfig.triggers.length > 0;

    const accessType = hasGuestAccess ? 'auth and guest' : 'auth-only';
    const triggerInfo = hasTriggers ? ' with Lambda trigger' : '';
    const groupInfo = hasUserPoolGroups ? ' (with user pool groups)' : '';
    this.logger.info(`Initializing S3 storage category with ${accessType} access${triggerInfo}${groupInfo}...`, context);

    try {
      if (hasTriggers) {
        const projectHasFunctions = result.initializedCategories.includes('function');
        this.logger.debug(`Adding S3 storage with Lambda trigger (projectHasFunctions: ${projectHasFunctions})`, context);
        await addS3WithTrigger(appPath, { projectHasFunctions });
      } else if (hasUserPoolGroups) {
        this.logger.debug(`Adding S3 storage with group access (Admins, Users)`, context);
        await addS3WithGroupAccess(appPath);
      } else if (hasGuestAccess) {
        await addS3Storage(appPath);
      } else {
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

  /** Initialize DynamoDB storage. */
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

        if (table.gsi && table.gsi.length > 0) {
          await addDynamoDBWithGSIWithSettings(appPath, {
            resourceName: table.name,
            tableName: table.name,
            gsiName: table.gsi[0].name,
          });
        } else {
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
   * Initialize regular (non-trigger) Lambda functions.
   * When withApiAccess is false, creates functions that don't need API access.
   * When withApiAccess is true, creates functions that need API access (must be called after API init).
   */
  private async initializeRegularFunctions(
    appPath: string,
    functionConfig: FunctionConfiguration,
    withApiAccess: boolean,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    const regularFunctions = functionConfig.functions
      .filter((f) => !f.trigger)
      .filter((f) => (withApiAccess ? !!f.apiAccess : !f.apiAccess));

    if (regularFunctions.length === 0) {
      return;
    }

    const label = withApiAccess ? 'regular function(s) with API access' : 'regular function(s)';
    this.logger.info(`Initializing ${regularFunctions.length} ${label}...`, context);

    try {
      for (const func of regularFunctions) {
        this.logger.debug(`Adding function: ${func.name}`, context);

        const runtime = this.mapRuntime(func.runtime);
        const template = this.mapTemplate(func.template);

        // Build advanced settings from migration-config.json
        const settings: Record<string, unknown> = {
          name: func.name,
          functionTemplate: template,
        };

        // Wire environment variables (addFunction supports one at a time)
        if (func.environmentVariables) {
          const entries = Object.entries(func.environmentVariables);
          if (entries.length > 0) {
            const [key, value] = entries[0];
            settings.environmentVariables = { key, value };
            this.logger.debug(`Adding env var ${key}=${value} to ${func.name}`, context);
          }
        }

        // Wire secrets (addFunction supports one at a time)
        if (func.secrets) {
          const entries = Object.entries(func.secrets);
          if (entries.length > 0) {
            const [name, value] = entries[0];
            settings.secretsConfig = { operation: 'add', name, value };
            this.logger.debug(`Adding secret ${name} to ${func.name}`, context);
          }
        }

        // Wire API access permissions (only when withApiAccess=true, API must exist)
        if (withApiAccess && func.apiAccess) {
          const apiName = this.getApiNameFromBackend(appPath);
          if (apiName) {
            settings.additionalPermissions = {
              permissions: ['api'],
              choices: ['api', 'auth', 'function', 'storage'],
              resources: [apiName],
              operations: func.apiAccess.operations,
            };
            this.logger.debug(`Adding API access (${func.apiAccess.operations.join(', ')}) to ${func.name}`, context);
          }
        }

        await addFunction(appPath, settings as CoreFunctionSettings, runtime);

        // Patch CFN template with appsync:GraphQL permission for functions that call back to AppSync
        if (withApiAccess && func.apiAccess) {
          this.patchFunctionAppsyncPermission(appPath, func.name, context);
        }

        this.logger.debug(`Function ${func.name} added successfully`, context);
      }

      if (!result.initializedCategories.includes('function')) {
        result.initializedCategories.push('function');
      }
      this.logger.info(`${label} initialized successfully`, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize ${label}: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'function', error: errorMessage });
    }
  }

  /**
   * Initialize trigger-based Lambda functions (DynamoDB streams, Kinesis, etc.).
   * Must be called after API category is initialized so AppSync tables exist.
   */
  private async initializeTriggerFunctions(
    appPath: string,
    functionConfig: FunctionConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    const triggerFunctions = functionConfig.functions.filter((f) => f.trigger);

    if (triggerFunctions.length === 0) {
      this.logger.debug('No trigger functions to initialize', context);
      return;
    }

    this.logger.info(`Initializing ${triggerFunctions.length} trigger function(s)...`, context);

    try {
      for (const func of triggerFunctions) {
        this.logger.debug(`Adding trigger function: ${func.name}`, context);

        const runtime = this.mapRuntime(func.runtime);
        const triggerType = func.trigger?.type;

        if (triggerType === 'dynamodb-stream') {
          await addFunction(
            appPath,
            {
              name: func.name,
              functionTemplate: 'Lambda trigger',
              triggerType: 'DynamoDB',
              eventSource: 'AppSync',
            },
            runtime,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            addLambdaTriggerWithModels,
          );
        } else if (triggerType === 'kinesis') {
          await addFunction(
            appPath,
            {
              name: func.name,
              functionTemplate: 'Lambda trigger',
              triggerType: 'Kinesis',
            },
            runtime,
            addLambdaTrigger,
          );
        } else {
          this.logger.warn(`Unsupported trigger type '${triggerType}' for function ${func.name}, skipping`, context);
          continue;
        }

        this.logger.debug(`Trigger function ${func.name} added successfully`, context);
      }

      this.logger.info('Trigger functions initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize trigger functions: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'function-triggers', error: errorMessage });
    }
  }

  /** Map runtime string to e2e-core runtime type. */
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

  /** Map template string to e2e-core template name. */
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

  /** Get the API name from the amplify backend configuration. */
  public getApiNameFromBackend(appPath: string): string | null {
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

  /**
   * Patch a function's CFN template to add appsync:GraphQL permission.
   * Required for functions that make IAM-signed callbacks to AppSync (e.g. lowstockproducts
   * querying listProducts). The addFunction walkthrough grants access to the API's underlying
   * resources (DynamoDB, Cognito) but not the GraphQL endpoint itself.
   */
  private patchFunctionAppsyncPermission(appPath: string, functionName: string, context: LogContext): void {
    const cfnPath = path.join(appPath, 'amplify', 'backend', 'function', functionName, `${functionName}-cloudformation-template.json`);
    if (!fs.existsSync(cfnPath)) {
      this.logger.warn(`CFN template not found for ${functionName}, skipping appsync:GraphQL patch`, context);
      return;
    }

    const cfn = JSON.parse(fs.readFileSync(cfnPath, 'utf-8')) as CfnTemplate;

    // Add an IAM policy granting appsync:GraphQL on all APIs in the account
    cfn.Resources = cfn.Resources ?? {};
    cfn.Resources.AppSyncGraphQLPolicy = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'appsync-graphql-policy',
        Roles: [{ Ref: 'LambdaExecutionRole' }],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['appsync:GraphQL'],
              Resource: {
                'Fn::Sub': 'arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/*',
              },
            },
          ],
        },
      },
      DependsOn: ['LambdaExecutionRole'],
    };

    fs.writeFileSync(cfnPath, JSON.stringify(cfn, null, 2) + '\n', 'utf-8');
    this.logger.debug(`Patched ${functionName} CFN template with appsync:GraphQL permission`, context);
  }

  /**
   * Patch backend-config.json and function-parameters.json for a function with API access.
   * addFunction sets dependsOn to auth by default; the migration tool needs api dependsOn
   * to emit grantQuery/grantMutation and API env vars in the generated backend.ts.
   */
  public patchRegularFunctionApiAccess(
    appPath: string,
    functionName: string,
    apiName: string,
    operations: string[],
    context: LogContext,
  ): void {
    // Fix backend-config.json: replace auth dependsOn with api dependsOn
    const apiDependsOn = [
      {
        category: 'api',
        resourceName: apiName,
        attributes: ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput', 'GraphQLAPIKeyOutput'],
      },
    ];

    // Patch all locations where dependsOn is stored
    const configPaths = [
      path.join(appPath, 'amplify', 'backend', 'backend-config.json'),
      path.join(appPath, 'amplify', '#current-cloud-backend', 'backend-config.json'),
    ];
    for (const configPath of configPaths) {
      if (!fs.existsSync(configPath)) continue;
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AmplifyBackendConfig;
      if (config.function?.[functionName]) {
        config.function[functionName].dependsOn = apiDependsOn;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
      }
    }
    this.logger.debug(`Patched backend-config.json: set ${functionName} dependsOn to api/${apiName}`, context);

    // Patch amplify-meta.json (both local and cloud-backend copies)
    const metaPaths = [
      path.join(appPath, 'amplify', 'backend', 'amplify-meta.json'),
      path.join(appPath, 'amplify', '#current-cloud-backend', 'amplify-meta.json'),
    ];
    for (const metaPath of metaPaths) {
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as AmplifyBackendConfig;
      if (meta.function?.[functionName]) {
        meta.function[functionName].dependsOn = apiDependsOn;
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
      }
    }

    // Fix function-parameters.json: set api permissions
    const funcParamsPath = path.join(appPath, 'amplify', 'backend', 'function', functionName, 'function-parameters.json');
    let funcParams: Record<string, unknown> = {};
    if (fs.existsSync(funcParamsPath)) {
      funcParams = JSON.parse(fs.readFileSync(funcParamsPath, 'utf-8')) as Record<string, unknown>;
    }
    funcParams.permissions = { api: { [apiName]: operations } };
    delete funcParams.dependsOn;
    fs.writeFileSync(funcParamsPath, JSON.stringify(funcParams, null, 2) + '\n', 'utf-8');
    this.logger.debug(`Patched function-parameters.json for ${functionName}`, context);

    // Fix CFN template: add API parameters and env vars so the migration tool
    // sees them and emits grantQuery/grantMutation + addEnvironment in backend.ts
    const cfnPath = path.join(appPath, 'amplify', 'backend', 'function', functionName, `${functionName}-cloudformation-template.json`);
    if (!fs.existsSync(cfnPath)) {
      return;
    }

    const cfn = JSON.parse(fs.readFileSync(cfnPath, 'utf-8')) as CfnTemplate;

    // Add API CFN parameters (these get populated by the root stack during push)
    const apiParams: Record<string, string> = {
      [`api${apiName}GraphQLAPIIdOutput`]: `api${apiName}GraphQLAPIIdOutput`,
      [`api${apiName}GraphQLAPIEndpointOutput`]: `api${apiName}GraphQLAPIEndpointOutput`,
      [`api${apiName}GraphQLAPIKeyOutput`]: `api${apiName}GraphQLAPIKeyOutput`,
    };

    cfn.Parameters = cfn.Parameters ?? {};
    for (const [paramName, defaultValue] of Object.entries(apiParams)) {
      cfn.Parameters[paramName] = { Type: 'String', Default: defaultValue };
    }

    // Add API env vars to the Lambda function
    const envVars = cfn.Resources?.LambdaFunction?.Properties?.Environment?.Variables;
    if (envVars) {
      envVars[`API_${apiName.toUpperCase()}_GRAPHQLAPIIDOUTPUT`] = { Ref: `api${apiName}GraphQLAPIIdOutput` };
      envVars[`API_${apiName.toUpperCase()}_GRAPHQLAPIENDPOINTOUTPUT`] = { Ref: `api${apiName}GraphQLAPIEndpointOutput` };
      envVars[`API_${apiName.toUpperCase()}_GRAPHQLAPIKEYOUTPUT`] = { Ref: `api${apiName}GraphQLAPIKeyOutput` };
    }

    fs.writeFileSync(cfnPath, JSON.stringify(cfn, null, 2) + '\n', 'utf-8');
    this.logger.debug(`Patched ${functionName} CFN template with API parameters and env vars`, context);
  }

  /** Initialize the analytics category. Supports: Kinesis Data Streams. */
  private async initializeAnalyticsCategory(
    appPath: string,
    analyticsConfig: AnalyticsConfiguration,
    result: InitializeCategoriesResult,
    context: LogContext,
  ): Promise<void> {
    this.logger.info(`Initializing analytics category (${analyticsConfig.type}: ${analyticsConfig.name})...`, context);

    if (analyticsConfig.type !== 'kinesis') {
      this.logger.warn(`Analytics type '${analyticsConfig.type}' is not yet supported, skipping`, context);
      result.skippedCategories.push('analytics');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await addKinesis(appPath, {
        rightName: analyticsConfig.name,
        wrongName: '$', // Invalid name to trigger validation, then correct it
      });

      result.initializedCategories.push('analytics');
      this.logger.info('Analytics category initialized successfully', context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize analytics category: ${errorMessage}`, error as Error, context);
      result.errors.push({ category: 'analytics', error: errorMessage });
    }
  }
}
