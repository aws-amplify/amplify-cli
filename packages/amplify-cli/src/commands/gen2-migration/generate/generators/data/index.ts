import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../../resource/resource';
import type { ConstructFactory, AmplifyFunction } from '@aws-amplify/plugin-types';
import type { AuthorizationModes, DataLoggingOptions } from '@aws-amplify/backend-data';
import { RestApiDefinition } from '../../codegen-head/data_definition_fetcher';
<<<<<<< HEAD:packages/amplify-cli/src/commands/gen2-migration/generate/generators/data/index.ts
=======

>>>>>>> 91007e5104 (fix: updated code):packages/amplify-cli/src/commands/gen2-migration/codegen-generate/src/generators/data/index.ts
export interface AdditionalAuthProvider {
  authenticationType: 'API_KEY' | 'AWS_IAM' | 'OPENID_CONNECT' | 'AMAZON_COGNITO_USER_POOLS' | 'AWS_LAMBDA';
  lambdaAuthorizerConfig?: {
    authorizerResultTtlInSeconds?: number;
    authorizerUri: string;
    identityValidationExpression?: string;
  };
  openIdConnectConfig?: {
    authTtl?: number;
    clientId?: string;
    iatTtl?: number;
    issuer: string;
  };
  userPoolConfig?: {
    appIdClientRegex?: string;
    awsRegion?: string;
    userPoolId?: string;
  };
}

/**
 * Gen1 authorization configuration structure from amplify-meta.json
 */
interface Gen1AuthorizationConfig {
  defaultAuthentication?: {
    authenticationType?: string;
    apiKeyConfig?: {
      apiKeyExpirationDays?: number;
    };
    lambdaAuthorizerConfig?: {
      ttlSeconds?: number;
    };
    openIDConnectConfig?: {
      issuer?: string;
      clientId?: string;
    };
  };
}

const factory = ts.factory;

/** Key name for the migrated table mappings property in the generated data resource */
const MIGRATED_TABLE_MAPPINGS_KEY = 'migratedAmplifyGen1DynamoDbTableMappings';

/** Maps Gen1 auth types to Gen2 auth mode identifiers */
const AUTH_MODE_MAP: Record<string, string> = {
  AWS_IAM: 'iam',
  AMAZON_COGNITO_USER_POOLS: 'userPool',
  API_KEY: 'apiKey',
  AWS_LAMBDA: 'lambda',
  OPENID_CONNECT: 'oidc',
};

/**
 * Maps model names to their corresponding DynamoDB table names for a specific environment.
 * Key: GraphQL model name, Value: DynamoDB table name/ID
 */
export type DataTableMapping = Record<string, string>;


/**
 * Creates dynamic table mappings when CloudFormation outputs are not available
 */
const createDataSourceMapping = (schema: string, apiId: string, envName: string): Record<string, string> => {
  const models = extractModelsFromSchema(schema);
  const mapping: Record<string, string> = {};

  models.forEach((modelName) => {
    // Use the same naming convention as Amplify's table resolver
    mapping[modelName] = [modelName, apiId, envName].join('-');
  });

  return mapping;
};

const extractModelsFromSchema = (schema: string): string[] => {
  const modelRegex = /type\s+(\w+)\s+@model/g;
  const models: string[] = [];
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1]);
  }

  return models;
};

const getCurrentEnvironment = (): string => {
  try {
    const { stateManager } = require('@aws-amplify/amplify-cli-core');
    return stateManager.getCurrentEnvName() || 'main';
  } catch {
    return 'main';
  }
};

const getProjectName = (): string | undefined => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { pathManager } = require('@aws-amplify/amplify-cli-core');

    const projectRoot = pathManager.findProjectRoot();
    if (!projectRoot) return undefined;

    const projectConfigPath = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
    if (fs.existsSync(projectConfigPath)) {
      const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      return projectConfig.projectName;
    }

    return undefined;
  } catch {
    return undefined;
  }
};

const getApiId = async (): Promise<string | undefined> => {
  try {
    const { AppSyncClient, ListGraphqlApisCommand } = require('@aws-sdk/client-appsync');
    const client = new AppSyncClient({});

    const response = await client.send(new ListGraphqlApisCommand({}));
    const currentEnv = getCurrentEnvironment();

    // Match with tags equalling env and project name
    const projectName = getProjectName();
    const api = response.graphqlApis?.find((api) => {
      const matchesEnv = api.tags?.['user:Stack'] === currentEnv;
      const matchesProject = projectName ? api.tags?.['user:Application'] === projectName : true;

      return matchesEnv && matchesProject;
    });

    return api?.apiId;
  } catch (error) {
    console.warn('Failed to fetch API ID from AWS:', error.message);
    return undefined;
  }
};

/**
 * Configuration for generating Amplify Gen 2 data resources from Gen 1 projects.
 */
export type DataDefinition = {
  /** Table mappings for the current environment */
  tableMappings?: DataTableMapping | undefined;
  /** GraphQL schema definition as a string */
  schema?: string;
  /* Override authorization config, which will apply on top of defaults based on availability of auth, etc. */
  authorizationModes?: AuthorizationModes;
  /* Additional authentication providers for AppSync API */
  additionalAuthProviders?: AdditionalAuthProvider[];
  /* Functions invokable by the API. The specific input type of the function is subject to change or removal. */
  functions?: Record<string, ConstructFactory<AmplifyFunction>>;
  /* Logging config for api */
  logging?: DataLoggingOptions;
  /* REST API definitions */
  restApis?: RestApiDefinition[];
};

// ============================================================================
// Schema Generation
// ============================================================================

/**
 * Generates the schema variable declaration statement.
 * Creates: const schema = `...graphql schema...`;
 * Handles ${env} substitution by replacing with ${branchName} and adding branchName declaration.
 *
 * @param schema - The GraphQL schema string
 * @returns Object containing the processed schema and array of TypeScript AST nodes for the schema declaration
 */
const generateSchemaStatement = (schema: string): { statements: ts.Node[]; processedSchema: string } => {
  const statements: ts.Node[] = [];
  let processedSchema = schema;

  // Handle ${env} substitution
  if (schema.includes('${env}')) {
    const branchNameStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'branchName',
            undefined,
            undefined,
            factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    statements.push(branchNameStatement);
    processedSchema = schema.replaceAll('${env}', '${branchName}');
  }

  const schemaVariableDeclaration = factory.createVariableDeclaration(
    'schema',
    undefined,
    undefined,
    factory.createIdentifier('`' + processedSchema + '`'),
  );

  const schemaStatementAssignment = factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const),
  );
  statements.push(schemaStatementAssignment);

  return { statements, processedSchema };
};

// ============================================================================
// Table Mappings Generation
// ============================================================================

/**
 * Generates the table mappings property for preserving existing DynamoDB tables.
 * Creates the migratedAmplifyGen1DynamoDbTableMappings array with branch and model mappings.
 *
 * @param tableMappings - Map of model names to DynamoDB table names
 * @param envName - Current environment/branch name
 * @returns ObjectLiteralElementLike for the table mappings property
 */
const generateTableMappingsProperty = (tableMappings: DataTableMapping, envName: string): ObjectLiteralElementLike => {
  const tableMappingProperties: ObjectLiteralElementLike[] = [];

  // Create model-to-table mappings for current environment
  for (const [tableName, tableId] of Object.entries(tableMappings)) {
    tableMappingProperties.push(
      factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
    );
  }

  // Add branchName with helpful comment
  const branchNameExpression = ts.addSyntheticLeadingComment(
    factory.createPropertyAssignment('branchName', factory.createStringLiteral(envName)),
    ts.SyntaxKind.SingleLineCommentTrivia,
    'The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
    true,
  );

  const tableMappingExpression = factory.createPropertyAssignment(
    'modelNameToTableNameMapping',
    factory.createObjectLiteralExpression(tableMappingProperties),
  );

  // Create single environment mapping object
  const tableMappingForEnvironment = factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true);

  return factory.createPropertyAssignment(MIGRATED_TABLE_MAPPINGS_KEY, factory.createArrayLiteralExpression([tableMappingForEnvironment]));
};

// ============================================================================
// Authorization Modes Generation
// ============================================================================

/**
 * Generates API key authorization mode configuration.
 *
 * @param apiKeyConfig - API key configuration from Gen1
 * @returns ObjectLiteralElementLike for apiKeyAuthorizationMode, or undefined
 */
const generateApiKeyAuthMode = (apiKeyConfig: { apiKeyExpirationDays?: number } | undefined): ObjectLiteralElementLike | undefined => {
  if (!apiKeyConfig?.apiKeyExpirationDays) {
    return undefined;
  }
  return factory.createPropertyAssignment(
    'apiKeyAuthorizationMode',
    factory.createObjectLiteralExpression([
      factory.createPropertyAssignment('expiresInDays', factory.createNumericLiteral(apiKeyConfig.apiKeyExpirationDays.toString())),
    ]),
  );
};

/**
 * Generates Lambda authorization mode configuration.
 *
 * @param lambdaConfig - Lambda authorizer configuration from Gen1
 * @returns ObjectLiteralElementLike for lambdaAuthorizationMode, or undefined
 */
const generateLambdaAuthMode = (lambdaConfig: { ttlSeconds?: number } | undefined): ObjectLiteralElementLike | undefined => {
  if (!lambdaConfig?.ttlSeconds) {
    return undefined;
  }
  return factory.createPropertyAssignment(
    'lambdaAuthorizationMode',
    factory.createObjectLiteralExpression([
      factory.createPropertyAssignment('timeToLiveInSeconds', factory.createNumericLiteral(lambdaConfig.ttlSeconds.toString())),
    ]),
  );
};

/**
 * Generates OIDC authorization mode configuration.
 *
 * @param oidcConfig - OpenID Connect configuration from Gen1
 * @returns ObjectLiteralElementLike for oidcAuthorizationMode, or undefined
 */
const generateOidcAuthMode = (oidcConfig: { issuer?: string; clientId?: string } | undefined): ObjectLiteralElementLike | undefined => {
  if (!oidcConfig) {
    return undefined;
  }

  const oidcProps: ObjectLiteralElementLike[] = [];

  if (oidcConfig.issuer) {
    oidcProps.push(factory.createPropertyAssignment('oidcIssuerUrl', factory.createStringLiteral(oidcConfig.issuer)));
  }
  if (oidcConfig.clientId) {
    oidcProps.push(factory.createPropertyAssignment('clientId', factory.createStringLiteral(oidcConfig.clientId)));
  }

  if (oidcProps.length === 0) {
    return undefined;
  }

  return factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(oidcProps));
};

/**
 * Generates the complete authorization modes property for the data configuration.
 * Maps Gen1 auth types to Gen2 format and includes mode-specific configurations.
 *
 * @param authorizationModes - Authorization configuration from Gen1
 * @returns ObjectLiteralElementLike for authorizationModes property, or undefined if no auth config
 */
const generateAuthModesProperty = (authorizationModes: AuthorizationModes | undefined): ObjectLiteralElementLike | undefined => {
  if (!authorizationModes) {
    return undefined;
  }

  const gen1AuthModes = authorizationModes as Gen1AuthorizationConfig;
  const authModeProperties: ObjectLiteralElementLike[] = [];

  // Add default authorization mode from Gen1 config
  const defaultAuthType = gen1AuthModes.defaultAuthentication?.authenticationType;
  if (defaultAuthType) {
    const gen2AuthMode = AUTH_MODE_MAP[defaultAuthType] || 'userPool';
    authModeProperties.push(factory.createPropertyAssignment('defaultAuthorizationMode', factory.createStringLiteral(gen2AuthMode)));

    // Add auth mode-specific configuration
    let modeSpecificConfig: ObjectLiteralElementLike | undefined;

    switch (defaultAuthType) {
      case 'API_KEY':
        modeSpecificConfig = generateApiKeyAuthMode(gen1AuthModes.defaultAuthentication?.apiKeyConfig);
        break;
      case 'AWS_LAMBDA':
        modeSpecificConfig = generateLambdaAuthMode(gen1AuthModes.defaultAuthentication?.lambdaAuthorizerConfig);
        break;
      case 'OPENID_CONNECT':
        modeSpecificConfig = generateOidcAuthMode(gen1AuthModes.defaultAuthentication?.openIDConnectConfig);
        break;
    }

    if (modeSpecificConfig) {
      authModeProperties.push(modeSpecificConfig);
    }
  }

  if (authModeProperties.length === 0) {
    return undefined;
  }

  return factory.createPropertyAssignment('authorizationModes', factory.createObjectLiteralExpression(authModeProperties, true));
};

// ============================================================================
// Logging Configuration Generation
// ============================================================================

/**
 * Generates the logging configuration property for the data configuration.
 * Supports both boolean (true) and detailed object configuration.
 *
 * @param logging - Logging configuration from Gen1
 * @returns ObjectLiteralElementLike for logging property, or undefined if no logging config
 */
const generateLoggingProperty = (logging: DataLoggingOptions | undefined): ObjectLiteralElementLike | undefined => {
  if (!logging) {
    return undefined;
  }

  // Handle simple boolean logging
  if (logging === true) {
    return factory.createPropertyAssignment('logging', factory.createTrue());
  }

  // Handle detailed logging configuration
  if (typeof logging === 'object') {
    const loggingProperties: ObjectLiteralElementLike[] = [];

    if (logging.fieldLogLevel !== undefined) {
      loggingProperties.push(factory.createPropertyAssignment('fieldLogLevel', factory.createStringLiteral(logging.fieldLogLevel)));
    }

    if (logging.excludeVerboseContent !== undefined) {
      loggingProperties.push(
        factory.createPropertyAssignment(
          'excludeVerboseContent',
          logging.excludeVerboseContent ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    if (logging.retention !== undefined) {
      loggingProperties.push(factory.createPropertyAssignment('retention', factory.createStringLiteral(logging.retention)));
    }

    if (loggingProperties.length > 0) {
      return factory.createPropertyAssignment('logging', factory.createObjectLiteralExpression(loggingProperties));
    }
  }

  return undefined;
};

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generates TypeScript AST nodes for an Amplify Gen 2 data resource configuration.
 *
 * This function creates the necessary code structure for migrating Amplify Gen 1 GraphQL APIs
 * to Gen 2, preserving existing DynamoDB table mappings to avoid data loss during migration.
 *
 * @param gen1Env - The Gen1 environment name
 * @param dataDefinition - Optional configuration containing schema and table mappings
 * @returns TypeScript AST nodes representing the complete data resource file
 *
 * @example
 * ```typescript
 * const dataDefinition = {
 *   schema: `type Todo @model { id: ID! content: String! }`,
 *   tableMappings: {
 *     'dev': { 'Todo': 'TodoTable-abc123' },
 *     'prod': { 'Todo': 'TodoTable-xyz789' }
 *   }
 * };
 * const nodes = generateDataSource(dataDefinition);
 * ```
 */
export const generateDataSource = async (gen1Env: string, dataDefinition?: DataDefinition): Promise<ts.NodeArray<ts.Node> | undefined> => {
  // Return undefined if no data definition is provided
  if (!dataDefinition) {
    return undefined;
  }

  // Return undefined if no schema and no REST APIs
  if (!dataDefinition.schema && (!dataDefinition.restApis || dataDefinition.restApis.length === 0)) {
    return undefined;
  }
<<<<<<< HEAD:packages/amplify-cli/src/commands/gen2-migration/generate/generators/data/index.ts
=======

>>>>>>> 91007e5104 (fix: updated code):packages/amplify-cli/src/commands/gen2-migration/codegen-generate/src/generators/data/index.ts
  // Properties for the defineData() function call
  const dataRenderProperties: ObjectLiteralElementLike[] = [];

  // Track required imports for the generated file
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');

  // Additional statements to include before the data export
  let schemaStatements: ts.Node[] = [];

  // Generate schema variable declaration if schema is provided
<<<<<<< HEAD:packages/amplify-cli/src/commands/gen2-migration/generate/generators/data/index.ts
  if (dataDefinition && dataDefinition.schema) {
    if (dataDefinition.schema.includes('${env}')) {
      const branchNameStatement = factory.createVariableStatement(
        [],
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              'branchName',
              undefined,
              undefined,
              factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );
      schemaStatements.push(branchNameStatement);
      dataDefinition.schema = dataDefinition.schema.replaceAll('${env}', '${branchName}');
    }

    const schemaVariableDeclaration = factory.createVariableDeclaration(
      'schema',
      undefined,
      undefined,
      factory.createIdentifier('`' + dataDefinition.schema + '`'),
    );
    const schemaStatementAssignment = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const),
    );
    schemaStatements.push(schemaStatementAssignment);
=======
  if (dataDefinition?.schema) {
    const schemaResult = generateSchemaStatement(dataDefinition.schema);
    schemaStatements = schemaResult.statements;
>>>>>>> 91007e5104 (fix: updated code):packages/amplify-cli/src/commands/gen2-migration/codegen-generate/src/generators/data/index.ts
  }

  // Generate table mappings for preserving existing DynamoDB tables during migration
  let tableMappings = dataDefinition?.tableMappings;

  // Generate table mappings if not provided but schema is available
  if (!tableMappings && dataDefinition?.schema) {
    const apiId = await getApiId();
    if (apiId) {
      tableMappings = createDataSourceMapping(dataDefinition.schema, apiId, gen1Env);
    }
  }

  // Add table mappings property if available
  if (tableMappings) {
<<<<<<< HEAD:packages/amplify-cli/src/commands/gen2-migration/generate/generators/data/index.ts
    const tableMappingProperties: ObjectLiteralElementLike[] = [];

    // Create model-to-table mappings for current environment
    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      tableMappingProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
      );
    }

    const branchNameExpression = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createStringLiteral(gen1Env)),
      ts.SyntaxKind.SingleLineCommentTrivia,
      'The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
      true,
    );

    const tableMappingExpression = factory.createPropertyAssignment(
      'modelNameToTableNameMapping',
      factory.createObjectLiteralExpression(tableMappingProperties),
    );

    // Create single environment mapping
    const tableMappingForEnvironment = factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true);

    // Add the table mappings array with single environment to the data configuration
    dataRenderProperties.push(
      factory.createPropertyAssignment(
        MIGRATED_TABLE_MAPPINGS_KEY,
        factory.createArrayLiteralExpression([tableMappingForEnvironment]),
      ),
    );
=======
    const tableMappingsProperty = generateTableMappingsProperty(tableMappings, gen1Env);
    dataRenderProperties.push(tableMappingsProperty);
>>>>>>> 91007e5104 (fix: updated code):packages/amplify-cli/src/commands/gen2-migration/codegen-generate/src/generators/data/index.ts
  }

  // Add authorization modes property if available
  const authModesProperty = generateAuthModesProperty(dataDefinition?.authorizationModes);
  if (authModesProperty) {
    dataRenderProperties.push(authModesProperty);
  }

  // Add logging configuration property if available
  const loggingProperty = generateLoggingProperty(dataDefinition?.logging);
  if (loggingProperty) {
    dataRenderProperties.push(loggingProperty);
  }

  // Add schema reference to the data configuration
  if (dataDefinition?.schema) {
    dataRenderProperties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));
  }

  // Generate the complete TypeScript file with imports, schema, and data export
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    postImportStatements: schemaStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
