import ts, { ObjectLiteralElementLike } from 'typescript';
import { TS } from '../../_infra/ts';

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
}

/** Describes a single extended resolver function with its computed splice index. */
export interface ExtendedResolverFunctionEntry {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly requestFile: string | undefined;
  readonly responseFile: string | undefined;
  readonly spliceIndex: number;
}

/** Options for rendering extended resolver statements in backend.ts. */
export interface RenderExtendedResolverOptions {
  readonly groups: readonly {
    readonly typeName: string;
    readonly fieldName: string;
    readonly functions: readonly ExtendedResolverFunctionEntry[];
  }[];
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

  /** Renders a NoneDataSource declaration statement. */
  public renderNoneDataSource(): ts.Statement {
    const graphqlApi = TS.propAccess('backend', 'data', 'resources', 'graphqlApi');
    const addNoneCall = factory.createCallExpression(factory.createPropertyAccessExpression(graphqlApi, 'addNoneDataSource'), undefined, [
      factory.createStringLiteral('none'),
    ]);
    return TS.constDecl('noneDataSource', addNoneCall);
  }

  /** Renders an AppsyncFunction declaration for an extended resolver. */
  public renderAppsyncFunction(fn: ExtendedResolverFunctionEntry): ts.Statement {
    const constructName = `${fn.typeName}${fn.fieldName}${fn.slot}${fn.order}`;

    const graphqlApi = TS.propAccess('backend', 'data', 'resources', 'graphqlApi');
    const awsAppsync = factory.createIdentifier('aws_appsync');

    const requestMapping =
      fn.requestFile !== undefined
        ? factory.createCallExpression(TS.propAccess(awsAppsync, 'MappingTemplate', 'fromFile'), undefined, [
            factory.createCallExpression(factory.createIdentifier('join'), undefined, [
              factory.createIdentifier('resolversDir'),
              factory.createStringLiteral(fn.requestFile),
            ]),
          ])
        : factory.createCallExpression(TS.propAccess(awsAppsync, 'MappingTemplate', 'fromString'), undefined, [
            factory.createStringLiteral('$util.toJson({})'),
          ]);

    const responseMapping =
      fn.responseFile !== undefined
        ? factory.createCallExpression(TS.propAccess(awsAppsync, 'MappingTemplate', 'fromFile'), undefined, [
            factory.createCallExpression(factory.createIdentifier('join'), undefined, [
              factory.createIdentifier('resolversDir'),
              factory.createStringLiteral(fn.responseFile),
            ]),
          ])
        : factory.createCallExpression(TS.propAccess(awsAppsync, 'MappingTemplate', 'fromString'), undefined, [
            factory.createStringLiteral('$util.toJson($ctx.prev.result)'),
          ]);

    const properties: ts.ObjectLiteralElementLike[] = [
      factory.createPropertyAssignment('name', factory.createStringLiteral(constructName)),
      factory.createPropertyAssignment('api', graphqlApi),
      factory.createPropertyAssignment('dataSource', factory.createIdentifier('noneDataSource')),
      factory.createPropertyAssignment('requestMappingTemplate', requestMapping),
      factory.createPropertyAssignment('responseMappingTemplate', responseMapping),
    ];

    const newExpr = factory.createNewExpression(TS.propAccess(awsAppsync, 'AppsyncFunction'), undefined, [
      TS.propAccess('backend', 'data', 'stack'),
      factory.createStringLiteral(constructName),
      factory.createObjectLiteralExpression(properties, true),
    ]);

    return TS.constDecl(constructName, newExpr);
  }

  /** Renders statements to splice extended resolver functions into a pipeline resolver. */
  public renderSpliceStatements(
    typeName: string,
    fieldName: string,
    functions: readonly { readonly constructName: string; readonly spliceIndex: number }[],
  ): ts.Statement[] {
    const resolverVarName = `${typeName.toLowerCase()}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Resolver`;
    const pipelineFunctionsVarName = `${resolverVarName.replace('Resolver', '')}PipelineFunctions`;

    // const queryListProductsResolver = backend.data.resources.cfnResources.cfnResolvers['Query.listProducts'] as CfnResolver;
    const resolverAccess = factory.createElementAccessExpression(
      TS.propAccess('backend', 'data', 'resources', 'cfnResources', 'cfnResolvers'),
      factory.createStringLiteral(`${typeName}.${fieldName}`),
    );
    const resolverAsExpr = factory.createAsExpression(resolverAccess, factory.createTypeReferenceNode('CfnResolver'));
    const resolverDecl = TS.constDecl(resolverVarName, resolverAsExpr);

    // const queryListProductsPipelineFunctions = (queryListProductsResolver.pipelineConfig as CfnResolver.PipelineConfigProperty).functions || [];
    const pipelineConfigAccess = factory.createPropertyAccessExpression(factory.createIdentifier(resolverVarName), 'pipelineConfig');
    const pipelineConfigCast = factory.createAsExpression(
      pipelineConfigAccess,
      factory.createTypeReferenceNode(factory.createQualifiedName(factory.createIdentifier('CfnResolver'), 'PipelineConfigProperty')),
    );
    const functionsAccess = factory.createPropertyAccessExpression(factory.createParenthesizedExpression(pipelineConfigCast), 'functions');
    const functionsOrEmpty = factory.createBinaryExpression(
      functionsAccess,
      ts.SyntaxKind.BarBarToken,
      factory.createArrayLiteralExpression([]),
    );
    const pipelineFunctionsDecl = TS.constDecl(pipelineFunctionsVarName, functionsOrEmpty);

    const statements: ts.Statement[] = [resolverDecl, pipelineFunctionsDecl];

    // Generate splice calls for each function
    for (const fn of functions) {
      const spliceCall = factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(pipelineFunctionsVarName), 'splice'),
        undefined,
        [factory.createNumericLiteral(fn.spliceIndex), factory.createNumericLiteral(0), TS.propAccess(fn.constructName, 'functionId')],
      );
      statements.push(factory.createExpressionStatement(spliceCall));
    }

    // queryListProductsResolver.pipelineConfig = { functions: queryListProductsPipelineFunctions };
    const reassignment = factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier(resolverVarName), 'pipelineConfig'),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('functions', factory.createIdentifier(pipelineFunctionsVarName)),
        ]),
      ),
    );
    statements.push(reassignment);

    return statements;
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
}
