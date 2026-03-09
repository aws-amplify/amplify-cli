import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';
import type { AuthorizationModes, DataLoggingOptions } from '@aws-amplify/backend-data';

const factory = ts.factory;

/**
 * Maps model names to their corresponding DynamoDB table names for a specific environment.
 */
export type DataTableMapping = Record<string, string>;

/**
 * Options for generating the data resource TypeScript AST.
 */
interface GenerateDataSourceOptions {
  readonly envName: string;
  readonly schema: string;
  readonly authorizationModes?: AuthorizationModes;
  readonly logging?: DataLoggingOptions;
  readonly tableMappings?: DataTableMapping;
}

const createDataSourceMapping = (schema: string, apiId: string, envName: string): Record<string, string> => {
  const models = extractModelsFromSchema(schema);
  const mapping: Record<string, string> = {};

  models.forEach((modelName) => {
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

const getApiId = async (envName: string): Promise<string | undefined> => {
  const client = new AppSyncClient({});

  const projectName = getProjectName();

  for await (const page of paginateListGraphqlApis({ client }, {})) {
    for (const api of page.graphqlApis ?? []) {
      const matchesEnv = api.tags?.['user:Stack'] === envName;
      const matchesProject = projectName ? api.tags?.['user:Application'] === projectName : true;
      if (matchesEnv && matchesProject) {
        return api.apiId;
      }
    }
  }
  return undefined;
};

/** Key name for the migrated table mappings property in the generated data resource */
const migratedAmplifyGen1DynamoDbTableMappingsKeyName = 'migratedAmplifyGen1DynamoDbTableMappings';

/**
 * Generates TypeScript AST nodes for an Amplify Gen 2 data resource configuration.
 */
export async function generateDataSource(opts: GenerateDataSourceOptions): Promise<ts.NodeArray<ts.Node>> {
  let schema = opts.schema;
  const dataRenderProperties: ObjectLiteralElementLike[] = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');
  const schemaStatements: ts.Node[] = [];

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
    schemaStatements.push(branchNameStatement);
    schema = schema.replaceAll('${env}', '${branchName}');
  }

  const schemaVariableDeclaration = factory.createVariableDeclaration(
    'schema',
    undefined,
    undefined,
    factory.createIdentifier('`' + schema + '`'),
  );
  const schemaStatementAssignment = factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const),
  );
  schemaStatements.push(schemaStatementAssignment);

  let tableMappings = opts.tableMappings;

  if (!tableMappings) {
    const apiId = await getApiId(opts.envName);
    if (apiId) {
      tableMappings = createDataSourceMapping(schema, apiId, opts.envName);
    } else {
      throw new Error(`Unable to find AppSync API for environment '${opts.envName}'. Ensure the API exists and is properly tagged.`);
    }
  }

  if (tableMappings) {
    const tableMappingProperties: ObjectLiteralElementLike[] = [];

    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      tableMappingProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
      );
    }

    const branchNameExpression = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createStringLiteral(opts.envName)),
      ts.SyntaxKind.SingleLineCommentTrivia,
      'The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
      true,
    );

    const tableMappingExpression = factory.createPropertyAssignment(
      'modelNameToTableNameMapping',
      factory.createObjectLiteralExpression(tableMappingProperties),
    );

    const tableMappingForEnvironment = factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true);

    dataRenderProperties.push(
      factory.createPropertyAssignment(
        migratedAmplifyGen1DynamoDbTableMappingsKeyName,
        factory.createArrayLiteralExpression([tableMappingForEnvironment]),
      ),
    );
  }

  // Add authorization modes if available
  if (opts.authorizationModes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gen1AuthModes = opts.authorizationModes as any;
    const authModeProperties: ObjectLiteralElementLike[] = [];

    const authModeMap: Record<string, string> = {
      AWS_IAM: 'iam',
      AMAZON_COGNITO_USER_POOLS: 'userPool',
      API_KEY: 'apiKey',
      AWS_LAMBDA: 'lambda',
      OPENID_CONNECT: 'oidc',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addAuthModeConfig = (provider: any) => {
      switch (provider.authenticationType) {
        case 'API_KEY':
          if (provider.apiKeyConfig) {
            const apiKeyProps = [];
            if (provider.apiKeyConfig.apiKeyExpirationDays) {
              apiKeyProps.push(
                factory.createPropertyAssignment(
                  'expiresInDays',
                  factory.createNumericLiteral(provider.apiKeyConfig.apiKeyExpirationDays.toString()),
                ),
              );
            }
            if (provider.apiKeyConfig.description) {
              apiKeyProps.push(
                factory.createPropertyAssignment('description', factory.createStringLiteral(provider.apiKeyConfig.description)),
              );
            }
            if (apiKeyProps.length > 0) {
              authModeProperties.push(
                factory.createPropertyAssignment('apiKeyAuthorizationMode', factory.createObjectLiteralExpression(apiKeyProps)),
              );
            }
          }
          break;
        case 'AWS_LAMBDA':
          if (provider.lambdaAuthorizerConfig) {
            const lambdaProps = [];
            if (provider.lambdaAuthorizerConfig.lambdaFunction) {
              lambdaProps.push(
                factory.createPropertyAssignment('function', factory.createIdentifier(provider.lambdaAuthorizerConfig.lambdaFunction)),
              );
            }
            if (provider.lambdaAuthorizerConfig.ttlSeconds) {
              lambdaProps.push(
                factory.createPropertyAssignment(
                  'timeToLiveInSeconds',
                  factory.createNumericLiteral(provider.lambdaAuthorizerConfig.ttlSeconds.toString()),
                ),
              );
            }
            if (lambdaProps.length > 0) {
              authModeProperties.push(
                factory.createPropertyAssignment('lambdaAuthorizationMode', factory.createObjectLiteralExpression(lambdaProps)),
              );
            }
          }
          break;
        case 'OPENID_CONNECT':
          if (provider.openIDConnectConfig?.issuerUrl) {
            const oidcProps = [];
            oidcProps.push(
              factory.createPropertyAssignment(
                'oidcProviderName',
                factory.createStringLiteral(provider.openIDConnectConfig.name || 'DefaultOIDCProvider'),
              ),
            );
            oidcProps.push(
              factory.createPropertyAssignment('oidcIssuerUrl', factory.createStringLiteral(provider.openIDConnectConfig.issuerUrl)),
            );
            if (provider.openIDConnectConfig.clientId) {
              oidcProps.push(
                factory.createPropertyAssignment('clientId', factory.createStringLiteral(provider.openIDConnectConfig.clientId)),
              );
            }
            if (provider.openIDConnectConfig.authTTL) {
              oidcProps.push(
                factory.createPropertyAssignment(
                  'tokenExpiryFromAuthInSeconds',
                  factory.createNumericLiteral(provider.openIDConnectConfig.authTTL.toString()),
                ),
              );
            }
            if (provider.openIDConnectConfig.iatTTL) {
              oidcProps.push(
                factory.createPropertyAssignment(
                  'tokenExpireFromIssueInSeconds',
                  factory.createNumericLiteral(provider.openIDConnectConfig.iatTTL.toString()),
                ),
              );
            }
            authModeProperties.push(
              factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(oidcProps)),
            );
          }
          break;
      }
    };

    if (gen1AuthModes.defaultAuthentication?.authenticationType) {
      const gen2AuthMode = authModeMap[gen1AuthModes.defaultAuthentication.authenticationType] || 'userPool';
      authModeProperties.push(factory.createPropertyAssignment('defaultAuthorizationMode', factory.createStringLiteral(gen2AuthMode)));
      addAuthModeConfig(gen1AuthModes.defaultAuthentication);
    }

    if (gen1AuthModes.additionalAuthenticationProviders) {
      for (const provider of gen1AuthModes.additionalAuthenticationProviders) {
        addAuthModeConfig(provider);
      }
    }

    if (authModeProperties.length > 0) {
      dataRenderProperties.push(
        factory.createPropertyAssignment('authorizationModes', factory.createObjectLiteralExpression(authModeProperties, true)),
      );
    }
  }

  // Add logging configuration if available
  if (opts.logging) {
    if (opts.logging === true) {
      dataRenderProperties.push(factory.createPropertyAssignment('logging', factory.createTrue()));
    } else if (typeof opts.logging === 'object') {
      const loggingConfig = opts.logging;
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
}
