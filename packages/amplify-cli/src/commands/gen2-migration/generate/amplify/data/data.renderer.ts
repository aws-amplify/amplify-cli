import ts, { ObjectLiteralElementLike } from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';

const factory = ts.factory;

/**
 * Maps model names to their corresponding DynamoDB table names.
 */
export type DataTableMapping = Record<string, string>;

/**
 * Options for rendering a defineData() resource file.
 */
export interface RenderDefineDataOptions {
  readonly schema: string;
  readonly tableMappings: DataTableMapping;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from amplify-meta.json authConfig
  readonly authorizationModes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from AppSync logConfig
  readonly logging?: any;
  /** Additional auth providers for the applyEscapeHatches function. */
  readonly additionalAuthProviders?: readonly Record<string, unknown>[];
  /** Whether the Gen1 app has an auth category (needed for user pool references). */
  readonly hasAuth?: boolean;
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
  private readonly envName: string;

  public constructor(envName: string) {
    this.envName = envName;
  }

  /**
   * Produces the complete TypeScript AST for data/resource.ts.
   */
  public render(opts: RenderDefineDataOptions): ts.NodeArray<ts.Node> {
    const baseNodes = this.renderDefineData(opts);
    const backendTypeImport = this.renderBackendTypeImport();

    const allNodes: ts.Node[] = [];
    let foundFirstNonImport = false;
    for (const node of baseNodes) {
      if (!foundFirstNonImport && ts.isImportDeclaration(node as ts.Node)) {
        allNodes.push(node);
      } else {
        if (!foundFirstNonImport) {
          allNodes.push(backendTypeImport);
          foundFirstNonImport = true;
        }
        allNodes.push(node);
      }
    }
    if (!foundFirstNonImport) {
      allNodes.push(backendTypeImport);
    }

    const escapeHatchDecl = this.renderApplyEscapeHatches(opts);
    if (escapeHatchDecl) {
      allNodes.push(newLineIdentifier);
      allNodes.push(escapeHatchDecl);
    }

    return factory.createNodeArray(allNodes as ts.Statement[]);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../backend'),
    );
  }

  private renderDefineData(opts: RenderDefineDataOptions): ts.NodeArray<ts.Node> {
    const properties: ObjectLiteralElementLike[] = [];
    const namedImports: Record<string, Set<string>> = {
      '@aws-amplify/backend': new Set(['defineData']),
    };

    const { schema, preSchemaStatements } = this.prepareSchema(opts.schema);

    this.renderTableMappings(properties, opts.tableMappings);
    this.renderAuthorizationModes(properties, opts.authorizationModes);
    this.renderLogging(properties, opts.logging);

    properties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

    const schemaVarDecl = factory.createVariableDeclaration('schema', undefined, undefined, factory.createIdentifier('`' + schema + '`'));
    const schemaStatements: ts.Node[] = [
      ...preSchemaStatements,
      factory.createVariableStatement([], factory.createVariableDeclarationList([schemaVarDecl], ts.NodeFlags.Const)),
    ];

    return TS.renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('data'),
      functionCallParameter: factory.createObjectLiteralExpression(properties, true),
      backendFunctionConstruct: 'defineData',
      postImportStatements: schemaStatements,
      additionalImportedBackendIdentifiers: namedImports,
    });
  }

  private renderApplyEscapeHatches(opts: RenderDefineDataOptions): ts.FunctionDeclaration | undefined {
    const needsEscapeHatches = opts.additionalAuthProviders && opts.additionalAuthProviders.length > 0 && opts.hasAuth;
    if (!needsEscapeHatches) return undefined;

    const escapeHatchStatements = this.buildAdditionalAuthProviderStatements(opts.additionalAuthProviders!);
    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      'applyEscapeHatches',
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, 'backend', undefined, factory.createTypeReferenceNode('Backend'))],
      undefined,
      factory.createBlock(escapeHatchStatements, true),
    );
  }

  private prepareSchema(raw: string): { schema: string; preSchemaStatements: ts.Node[] } {
    if (!raw.includes('${env}')) {
      return { schema: raw, preSchemaStatements: [] };
    }

    const branchNameStatement = TS.createBranchNameDeclaration();

    return {
      schema: raw.replaceAll('${env}', '${branchName}'),
      preSchemaStatements: [branchNameStatement],
    };
  }

  private renderTableMappings(properties: ObjectLiteralElementLike[], tableMappings: DataTableMapping): void {
    const mappingProps: ObjectLiteralElementLike[] = [];
    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      mappingProps.push(factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)));
    }

    const branchNameProp = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createStringLiteral(this.envName)),
      ts.SyntaxKind.SingleLineCommentTrivia,
      'The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
      true,
    );

    const modelMappingProp = factory.createPropertyAssignment(
      'modelNameToTableNameMapping',
      factory.createObjectLiteralExpression(mappingProps),
    );

    const envMapping = factory.createObjectLiteralExpression([branchNameProp, modelMappingProp], true);

    properties.push(factory.createPropertyAssignment(MIGRATED_TABLE_MAPPINGS_KEY, factory.createArrayLiteralExpression([envMapping])));
  }

  private renderAuthorizationModes(properties: ObjectLiteralElementLike[], authorizationModes?: any): void {
    if (!authorizationModes) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gen1AuthModes = authorizationModes;
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
      properties.push(
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

  private renderLogging(properties: ObjectLiteralElementLike[], logging?: any): void {
    if (!logging) return;

    if (logging === true) {
      properties.push(factory.createPropertyAssignment('logging', factory.createTrue()));
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
      properties.push(factory.createPropertyAssignment('logging', factory.createObjectLiteralExpression(props)));
    }
  }

  /** Builds additional auth provider override statements for applyEscapeHatches. */
  private buildAdditionalAuthProviderStatements(providers: readonly Record<string, unknown>[]): ts.Statement[] {
    const statements: ts.Statement[] = [];
    statements.push(TS.constFromBackend('cfnGraphqlApi', 'data', 'resources', 'cfnResources', 'cfnGraphqlApi'));

    const providerElements = providers.map((provider) => {
      const props: ts.PropertyAssignment[] = [];
      if (provider.authenticationType) {
        props.push(
          factory.createPropertyAssignment('authenticationType', factory.createStringLiteral(provider.authenticationType as string)),
        );
      }
      if (provider.userPoolConfig) {
        const userPoolConfig = provider.userPoolConfig as Record<string, unknown>;
        const userPoolConfigProps: ts.PropertyAssignment[] = [];
        if (userPoolConfig.userPoolId) {
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              'userPoolId',
              TS.propAccess('backend', 'auth', 'resources', 'userPool', 'userPoolId') as ts.PropertyAccessExpression,
            ),
          );
          userPoolConfigProps.push(
            factory.createPropertyAssignment(
              'awsRegion',
              TS.propAccess('backend', 'auth', 'stack', 'region') as ts.PropertyAccessExpression,
            ),
          );
        }
        props.push(factory.createPropertyAssignment('userPoolConfig', factory.createObjectLiteralExpression(userPoolConfigProps, true)));
      }
      return factory.createObjectLiteralExpression(props, true);
    });

    const assignment = factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('cfnGraphqlApi'),
          factory.createIdentifier('additionalAuthenticationProviders'),
        ),
        factory.createArrayLiteralExpression(providerElements, true),
      ),
    );
    statements.push(assignment);
    return statements;
  }
}
