import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource';
import type { AuthorizationModes, DataLoggingOptions } from '@aws-amplify/backend-data';

const factory = ts.factory;

/**
 * Maps model names to their corresponding DynamoDB table names.
 */
export type DataTableMapping = Record<string, string>;

interface GenerateDataSourceOptions {
  readonly envName: string;
  readonly schema: string;
  readonly tableMappings: DataTableMapping;
  readonly authorizationModes?: AuthorizationModes;
  readonly logging?: DataLoggingOptions;
}

/** Key name for the migrated table mappings property */
const migratedAmplifyGen1DynamoDbTableMappingsKeyName = 'migratedAmplifyGen1DynamoDbTableMappings';

/**
 * Generates TypeScript AST nodes for an Amplify Gen 2 data resource.
 * Pure rendering function — no AWS calls, no side effects.
 */
export function generateDataSource(opts: GenerateDataSourceOptions): ts.NodeArray<ts.Node> {
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
  schemaStatements.push(
    factory.createVariableStatement([], factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const)),
  );

  // Table mappings
  const tableMappingProperties: ObjectLiteralElementLike[] = [];
  for (const [tableName, tableId] of Object.entries(opts.tableMappings)) {
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

  dataRenderProperties.push(
    factory.createPropertyAssignment(
      migratedAmplifyGen1DynamoDbTableMappingsKeyName,
      factory.createArrayLiteralExpression([factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true)]),
    ),
  );

  // Authorization modes
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
            const props = [];
            if (provider.apiKeyConfig.apiKeyExpirationDays)
              props.push(
                factory.createPropertyAssignment(
                  'expiresInDays',
                  factory.createNumericLiteral(provider.apiKeyConfig.apiKeyExpirationDays.toString()),
                ),
              );
            if (provider.apiKeyConfig.description)
              props.push(factory.createPropertyAssignment('description', factory.createStringLiteral(provider.apiKeyConfig.description)));
            if (props.length > 0)
              authModeProperties.push(
                factory.createPropertyAssignment('apiKeyAuthorizationMode', factory.createObjectLiteralExpression(props)),
              );
          }
          break;
        case 'AWS_LAMBDA':
          if (provider.lambdaAuthorizerConfig) {
            const props = [];
            if (provider.lambdaAuthorizerConfig.lambdaFunction)
              props.push(
                factory.createPropertyAssignment('function', factory.createIdentifier(provider.lambdaAuthorizerConfig.lambdaFunction)),
              );
            if (provider.lambdaAuthorizerConfig.ttlSeconds)
              props.push(
                factory.createPropertyAssignment(
                  'timeToLiveInSeconds',
                  factory.createNumericLiteral(provider.lambdaAuthorizerConfig.ttlSeconds.toString()),
                ),
              );
            if (props.length > 0)
              authModeProperties.push(
                factory.createPropertyAssignment('lambdaAuthorizationMode', factory.createObjectLiteralExpression(props)),
              );
          }
          break;
        case 'OPENID_CONNECT':
          if (provider.openIDConnectConfig?.issuerUrl) {
            const props = [];
            props.push(
              factory.createPropertyAssignment(
                'oidcProviderName',
                factory.createStringLiteral(provider.openIDConnectConfig.name || 'DefaultOIDCProvider'),
              ),
            );
            props.push(
              factory.createPropertyAssignment('oidcIssuerUrl', factory.createStringLiteral(provider.openIDConnectConfig.issuerUrl)),
            );
            if (provider.openIDConnectConfig.clientId)
              props.push(factory.createPropertyAssignment('clientId', factory.createStringLiteral(provider.openIDConnectConfig.clientId)));
            if (provider.openIDConnectConfig.authTTL)
              props.push(
                factory.createPropertyAssignment(
                  'tokenExpiryFromAuthInSeconds',
                  factory.createNumericLiteral(provider.openIDConnectConfig.authTTL.toString()),
                ),
              );
            if (provider.openIDConnectConfig.iatTTL)
              props.push(
                factory.createPropertyAssignment(
                  'tokenExpireFromIssueInSeconds',
                  factory.createNumericLiteral(provider.openIDConnectConfig.iatTTL.toString()),
                ),
              );
            authModeProperties.push(
              factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(props)),
            );
          }
          break;
      }
    };

    if (gen1AuthModes.defaultAuthentication?.authenticationType) {
      authModeProperties.push(
        factory.createPropertyAssignment(
          'defaultAuthorizationMode',
          factory.createStringLiteral(authModeMap[gen1AuthModes.defaultAuthentication.authenticationType] || 'userPool'),
        ),
      );
      addAuthModeConfig(gen1AuthModes.defaultAuthentication);
    }
    if (gen1AuthModes.additionalAuthenticationProviders) {
      for (const provider of gen1AuthModes.additionalAuthenticationProviders) addAuthModeConfig(provider);
    }
    if (authModeProperties.length > 0) {
      dataRenderProperties.push(
        factory.createPropertyAssignment('authorizationModes', factory.createObjectLiteralExpression(authModeProperties, true)),
      );
    }
  }

  // Logging
  if (opts.logging) {
    if (opts.logging === true) {
      dataRenderProperties.push(factory.createPropertyAssignment('logging', factory.createTrue()));
    } else if (typeof opts.logging === 'object') {
      const loggingProperties: ObjectLiteralElementLike[] = [];
      if (opts.logging.fieldLogLevel !== undefined)
        loggingProperties.push(factory.createPropertyAssignment('fieldLogLevel', factory.createStringLiteral(opts.logging.fieldLogLevel)));
      if (opts.logging.excludeVerboseContent !== undefined)
        loggingProperties.push(
          factory.createPropertyAssignment(
            'excludeVerboseContent',
            opts.logging.excludeVerboseContent ? factory.createTrue() : factory.createFalse(),
          ),
        );
      if (opts.logging.retention !== undefined)
        loggingProperties.push(factory.createPropertyAssignment('retention', factory.createStringLiteral(opts.logging.retention)));
      if (loggingProperties.length > 0)
        dataRenderProperties.push(factory.createPropertyAssignment('logging', factory.createObjectLiteralExpression(loggingProperties)));
    }
  }

  // Schema reference
  dataRenderProperties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    postImportStatements: schemaStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
}
