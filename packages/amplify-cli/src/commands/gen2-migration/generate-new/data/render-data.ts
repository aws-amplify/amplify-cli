import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource';
import type { AuthorizationModes, DataLoggingOptions } from '@aws-amplify/backend-data';

const factory = ts.factory;

/**
 * Maps model names to their corresponding DynamoDB table names.
 */
export type DataTableMapping = Record<string, string>;

/**
 * Options for rendering a defineData() resource file.
 */
export interface RenderDefineDataOptions {
  readonly envName: string;
  readonly schema: string;
  readonly tableMappings: DataTableMapping;
  readonly authorizationModes?: AuthorizationModes;
  readonly logging?: DataLoggingOptions;
}

const MIGRATED_TABLE_MAPPINGS_KEY = 'migratedAmplifyGen1DynamoDbTableMappings';

const AUTH_MODE_MAP: Record<string, string> = {
  AWS_IAM: 'iam',
  AMAZON_COGNITO_USER_POOLS: 'userPool',
  API_KEY: 'apiKey',
  AWS_LAMBDA: 'lambda',
  OPENID_CONNECT: 'oidc',
};

/**
 * Renders a defineData() resource.ts file from Gen1 AppSync configuration.
 * Pure — no AWS calls, no side effects.
 */
export class DataRenderer {
  private readonly namedImports: Record<string, Set<string>> = {
    '@aws-amplify/backend': new Set(['defineData']),
  };
  private readonly properties: ObjectLiteralElementLike[] = [];

  /**
   * Produces the complete TypeScript AST for data/resource.ts.
   */
  public render(opts: RenderDefineDataOptions): ts.NodeArray<ts.Node> {
    this.properties.length = 0;

    const { schema, preSchemaStatements } = this.prepareSchema(opts.schema);

    this.renderTableMappings(opts.tableMappings, opts.envName);
    this.renderAuthorizationModes(opts.authorizationModes);
    this.renderLogging(opts.logging);

    this.properties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

    const schemaVarDecl = factory.createVariableDeclaration('schema', undefined, undefined, factory.createIdentifier('`' + schema + '`'));
    const schemaStatements: ts.Node[] = [
      ...preSchemaStatements,
      factory.createVariableStatement([], factory.createVariableDeclarationList([schemaVarDecl], ts.NodeFlags.Const)),
    ];

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('data'),
      functionCallParameter: factory.createObjectLiteralExpression(this.properties, true),
      backendFunctionConstruct: 'defineData',
      postImportStatements: schemaStatements,
      additionalImportedBackendIdentifiers: this.namedImports,
    });
  }

  private prepareSchema(raw: string): { schema: string; preSchemaStatements: ts.Node[] } {
    if (!raw.includes('${env}')) {
      return { schema: raw, preSchemaStatements: [] };
    }

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

    return {
      schema: raw.replaceAll('${env}', '${branchName}'),
      preSchemaStatements: [branchNameStatement],
    };
  }

  private renderTableMappings(tableMappings: DataTableMapping, envName: string): void {
    const mappingProps: ObjectLiteralElementLike[] = [];
    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      mappingProps.push(factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)));
    }

    const branchNameProp = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createStringLiteral(envName)),
      ts.SyntaxKind.SingleLineCommentTrivia,
      'The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
      true,
    );

    const modelMappingProp = factory.createPropertyAssignment(
      'modelNameToTableNameMapping',
      factory.createObjectLiteralExpression(mappingProps),
    );

    const envMapping = factory.createObjectLiteralExpression([branchNameProp, modelMappingProp], true);

    this.properties.push(factory.createPropertyAssignment(MIGRATED_TABLE_MAPPINGS_KEY, factory.createArrayLiteralExpression([envMapping])));
  }

  private renderAuthorizationModes(authorizationModes?: AuthorizationModes): void {
    if (!authorizationModes) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gen1AuthModes = authorizationModes as any;
    const authModeProperties: ObjectLiteralElementLike[] = [];

    if (gen1AuthModes.defaultAuthentication?.authenticationType) {
      authModeProperties.push(
        factory.createPropertyAssignment(
          'defaultAuthorizationMode',
          factory.createStringLiteral(AUTH_MODE_MAP[gen1AuthModes.defaultAuthentication.authenticationType] || 'userPool'),
        ),
      );
      this.addAuthModeConfig(authModeProperties, gen1AuthModes.defaultAuthentication);
    }

    if (gen1AuthModes.additionalAuthenticationProviders) {
      for (const provider of gen1AuthModes.additionalAuthenticationProviders) {
        this.addAuthModeConfig(authModeProperties, provider);
      }
    }

    if (authModeProperties.length > 0) {
      this.properties.push(
        factory.createPropertyAssignment('authorizationModes', factory.createObjectLiteralExpression(authModeProperties, true)),
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addAuthModeConfig(target: ObjectLiteralElementLike[], provider: any): void {
    switch (provider.authenticationType) {
      case 'API_KEY':
        this.addApiKeyConfig(target, provider);
        break;
      case 'AWS_LAMBDA':
        this.addLambdaConfig(target, provider);
        break;
      case 'OPENID_CONNECT':
        this.addOidcConfig(target, provider);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addApiKeyConfig(target: ObjectLiteralElementLike[], provider: any): void {
    if (!provider.apiKeyConfig) return;
    const props: ts.PropertyAssignment[] = [];
    if (provider.apiKeyConfig.apiKeyExpirationDays) {
      props.push(
        factory.createPropertyAssignment(
          'expiresInDays',
          factory.createNumericLiteral(provider.apiKeyConfig.apiKeyExpirationDays.toString()),
        ),
      );
    }
    if (provider.apiKeyConfig.description) {
      props.push(factory.createPropertyAssignment('description', factory.createStringLiteral(provider.apiKeyConfig.description)));
    }
    if (props.length > 0) {
      target.push(factory.createPropertyAssignment('apiKeyAuthorizationMode', factory.createObjectLiteralExpression(props)));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addLambdaConfig(target: ObjectLiteralElementLike[], provider: any): void {
    if (!provider.lambdaAuthorizerConfig) return;
    const props: ts.PropertyAssignment[] = [];
    if (provider.lambdaAuthorizerConfig.lambdaFunction) {
      props.push(factory.createPropertyAssignment('function', factory.createIdentifier(provider.lambdaAuthorizerConfig.lambdaFunction)));
    }
    if (provider.lambdaAuthorizerConfig.ttlSeconds) {
      props.push(
        factory.createPropertyAssignment(
          'timeToLiveInSeconds',
          factory.createNumericLiteral(provider.lambdaAuthorizerConfig.ttlSeconds.toString()),
        ),
      );
    }
    if (props.length > 0) {
      target.push(factory.createPropertyAssignment('lambdaAuthorizationMode', factory.createObjectLiteralExpression(props)));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addOidcConfig(target: ObjectLiteralElementLike[], provider: any): void {
    if (!provider.openIDConnectConfig?.issuerUrl) return;
    const cfg = provider.openIDConnectConfig;
    const props: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment('oidcProviderName', factory.createStringLiteral(cfg.name || 'DefaultOIDCProvider')),
      factory.createPropertyAssignment('oidcIssuerUrl', factory.createStringLiteral(cfg.issuerUrl)),
    ];
    if (cfg.clientId) props.push(factory.createPropertyAssignment('clientId', factory.createStringLiteral(cfg.clientId)));
    if (cfg.authTTL)
      props.push(factory.createPropertyAssignment('tokenExpiryFromAuthInSeconds', factory.createNumericLiteral(cfg.authTTL.toString())));
    if (cfg.iatTTL)
      props.push(factory.createPropertyAssignment('tokenExpireFromIssueInSeconds', factory.createNumericLiteral(cfg.iatTTL.toString())));
    target.push(factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(props)));
  }

  private renderLogging(logging?: DataLoggingOptions): void {
    if (!logging) return;

    if (logging === true) {
      this.properties.push(factory.createPropertyAssignment('logging', factory.createTrue()));
      return;
    }

    if (typeof logging !== 'object') return;

    const props: ObjectLiteralElementLike[] = [];
    if (logging.fieldLogLevel !== undefined) {
      props.push(factory.createPropertyAssignment('fieldLogLevel', factory.createStringLiteral(logging.fieldLogLevel)));
    }
    if (logging.excludeVerboseContent !== undefined) {
      props.push(
        factory.createPropertyAssignment(
          'excludeVerboseContent',
          logging.excludeVerboseContent ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }
    if (logging.retention !== undefined) {
      props.push(factory.createPropertyAssignment('retention', factory.createStringLiteral(logging.retention)));
    }
    if (props.length > 0) {
      this.properties.push(factory.createPropertyAssignment('logging', factory.createObjectLiteralExpression(props)));
    }
  }
}

/**
 * Convenience function that creates a DataRenderer and calls render().
 */
export function renderDefineData(opts: RenderDefineDataOptions): ts.NodeArray<ts.Node> {
  return new DataRenderer().render(opts);
}
