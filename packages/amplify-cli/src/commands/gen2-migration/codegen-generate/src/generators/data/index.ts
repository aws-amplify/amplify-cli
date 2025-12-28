import ts, { ObjectLiteralElementLike, ObjectLiteralExpression } from 'typescript';
import { renderResourceTsFile } from '../../resource/resource';
import type { ConstructFactory, AmplifyFunction } from '@aws-amplify/plugin-types';
import type { AuthorizationModes, DataLoggingOptions } from '@aws-amplify/backend-data';
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

const factory = ts.factory;

const gen2BranchNameVariableName = 'branchName';

/**
 * Helper function to create a variable statement with const declaration
 */
const createVariableStatement = (variableDeclaration: ts.VariableDeclaration): ts.VariableStatement => {
  return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
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
  schema: string;
  /* Override authorization config, which will apply on top of defaults based on availability of auth, etc. */
  authorizationModes?: AuthorizationModes;
  /* Additional authentication providers for AppSync API */
  additionalAuthProviders?: AdditionalAuthProvider[];
  /* Functions invokable by the API. The specific input type of the function is subject to change or removal. */
  functions?: Record<string, ConstructFactory<AmplifyFunction>>;
  /* Logging config for api */
  logging?: DataLoggingOptions;
};

/** Key name for the migrated table mappings property in the generated data resource */
const migratedAmplifyGen1DynamoDbTableMappingsKeyName = 'migratedAmplifyGen1DynamoDbTableMappings';

/**
 * Generates TypeScript AST nodes for an Amplify Gen 2 data resource configuration.
 *
 * This function creates the necessary code structure for migrating Amplify Gen 1 GraphQL APIs
 * to Gen 2, preserving existing DynamoDB table mappings to avoid data loss during migration.
 *
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
export const generateDataSource = async (dataDefinition?: DataDefinition): Promise<ts.NodeArray<ts.Node>> => {
  // Properties for the defineData() function call
  const dataRenderProperties: ObjectLiteralElementLike[] = [];

  // Track required imports for the generated file
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');

  // Additional statements to include before the data export
  const schemaStatements: ts.Node[] = [];

  // Add branchName constant declaration
  const branchNameStatement = createVariableStatement(
    factory.createVariableDeclaration(
      gen2BranchNameVariableName,
      undefined,
      undefined,
      factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
    ),
  );
  schemaStatements.push(branchNameStatement);

  // Generate schema variable declaration if schema is provided
  if (dataDefinition && dataDefinition.schema) {
    const schemaVariableDeclaration = factory.createVariableDeclaration(
      'schema',
      undefined,
      undefined,
      factory.createNoSubstitutionTemplateLiteral(dataDefinition.schema),
    );
    const schemaStatementAssignment = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const),
    );
    schemaStatements.push(schemaStatementAssignment);
  }

  // Generate table mappings for preserving existing DynamoDB tables during migration
  let tableMappings = dataDefinition?.tableMappings;

  // Generate table mappings if not provided but schema is available
  if (!tableMappings && dataDefinition?.schema) {
    const apiId = await getApiId();
    if (apiId) {
      const currentEnv = getCurrentEnvironment();
      tableMappings = createDataSourceMapping(dataDefinition.schema, apiId, currentEnv);
    }
  }

  if (tableMappings) {
    const tableMappingProperties: ObjectLiteralElementLike[] = [];

    // Create model-to-table mappings for current environment
    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      tableMappingProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
      );
    }

    const currentEnv = getCurrentEnvironment();
    const branchNameExpression = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createIdentifier(gen2BranchNameVariableName)),
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
        migratedAmplifyGen1DynamoDbTableMappingsKeyName,
        factory.createArrayLiteralExpression([tableMappingForEnvironment]),
      ),
    );
  }

  // Add authorization modes if available
  if (dataDefinition?.authorizationModes) {
    const gen1AuthModes = dataDefinition.authorizationModes as any;
    const authModeProperties: ObjectLiteralElementLike[] = [];

    const authModeMap: Record<string, string> = {
      AWS_IAM: 'iam',
      AMAZON_COGNITO_USER_POOLS: 'userPool',
      API_KEY: 'apiKey',
      AWS_LAMBDA: 'lambda',
      OPENID_CONNECT: 'oidc',
    };

    // Add default authorization mode from Gen1 config
    if (gen1AuthModes.defaultAuthentication?.authenticationType) {
      const gen2AuthMode = authModeMap[gen1AuthModes.defaultAuthentication.authenticationType] || 'userPool';
      authModeProperties.push(factory.createPropertyAssignment('defaultAuthorizationMode', factory.createStringLiteral(gen2AuthMode)));

      // Add auth mode config based on default authentication type
      switch (gen1AuthModes.defaultAuthentication.authenticationType) {
        case 'API_KEY':
          if (gen1AuthModes.defaultAuthentication.apiKeyConfig?.apiKeyExpirationDays) {
            authModeProperties.push(
              factory.createPropertyAssignment(
                'apiKeyAuthorizationMode',
                factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment(
                    'expiresInDays',
                    factory.createNumericLiteral(gen1AuthModes.defaultAuthentication.apiKeyConfig.apiKeyExpirationDays.toString()),
                  ),
                ]),
              ),
            );
          }
          break;
        case 'AWS_LAMBDA':
          if (gen1AuthModes.defaultAuthentication.lambdaAuthorizerConfig?.ttlSeconds) {
            authModeProperties.push(
              factory.createPropertyAssignment(
                'lambdaAuthorizationMode',
                factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment(
                    'timeToLiveInSeconds',
                    factory.createNumericLiteral(gen1AuthModes.defaultAuthentication.lambdaAuthorizerConfig.ttlSeconds.toString()),
                  ),
                ]),
              ),
            );
          }
          break;
        case 'OPENID_CONNECT':
          if (gen1AuthModes.defaultAuthentication.openIDConnectConfig) {
            const oidcProps = [];
            if (gen1AuthModes.defaultAuthentication.openIDConnectConfig.issuer) {
              oidcProps.push(
                factory.createPropertyAssignment(
                  'oidcIssuerUrl',
                  factory.createStringLiteral(gen1AuthModes.defaultAuthentication.openIDConnectConfig.issuer),
                ),
              );
            }
            if (gen1AuthModes.defaultAuthentication.openIDConnectConfig.clientId) {
              oidcProps.push(
                factory.createPropertyAssignment(
                  'clientId',
                  factory.createStringLiteral(gen1AuthModes.defaultAuthentication.openIDConnectConfig.clientId),
                ),
              );
            }
            if (oidcProps.length > 0) {
              authModeProperties.push(
                factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(oidcProps)),
              );
            }
          }
          break;
      }
    }

    if (authModeProperties.length > 0) {
      dataRenderProperties.push(
        factory.createPropertyAssignment('authorizationModes', factory.createObjectLiteralExpression(authModeProperties, true)),
      );
    }
  }

  // Add logging configuration if available
  if (dataDefinition?.logging) {
    if (dataDefinition.logging === true) {
      dataRenderProperties.push(factory.createPropertyAssignment('logging', factory.createTrue()));
    } else if (typeof dataDefinition.logging === 'object') {
      const loggingConfig = dataDefinition.logging;
      const loggingProperties: ObjectLiteralElementLike[] = [];

      if (loggingConfig.fieldLogLevel !== undefined) {
        loggingProperties.push(factory.createPropertyAssignment('fieldLogLevel', factory.createStringLiteral(loggingConfig.fieldLogLevel)));
      }

      if (loggingConfig.excludeVerboseContent !== undefined) {
        loggingProperties.push(
          factory.createPropertyAssignment(
            'excludeVerboseContent',
            loggingConfig.excludeVerboseContent ? factory.createTrue() : factory.createFalse(),
          ),
        );
      }

      if (loggingConfig.retention !== undefined) {
        loggingProperties.push(factory.createPropertyAssignment('retention', factory.createStringLiteral(loggingConfig.retention)));
      }

      if (loggingProperties.length > 0) {
        dataRenderProperties.push(factory.createPropertyAssignment('logging', factory.createObjectLiteralExpression(loggingProperties)));
      }
    }
  }

  // Add schema reference to the data configuration
  dataRenderProperties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

  // Generate the complete TypeScript file with imports, schema, and data export
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    postImportStatements: schemaStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
