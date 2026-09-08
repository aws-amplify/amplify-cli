import ts, { ObjectLiteralElementLike } from 'typescript';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { newLineIdentifier, TS } from '../../ts';
import { ClassifiedVtlFiles, ParsedExtended } from './data.generator';

const factory = ts.factory;

// ── Resolver Utility Types ─────────────────────────────────────────────

/** A grouped extended resolver pair (req + res for same slot/order). */
export interface ExtendedResolverFile {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly reqFile?: string;
  readonly resFile?: string;
}

/** A splice operation to insert a function at a pipeline index. */
export interface SpliceEntry {
  readonly resolverFile: ExtendedResolverFile;
  readonly spliceIndex: number;
}

/** Pipeline splice result for a single typeName.fieldName. */
export interface PipelineSpliceResult {
  readonly typeName: string;
  readonly fieldName: string;
  readonly entries: readonly SpliceEntry[];
}

// ── Slot Constants ─────────────────────────────────────────────────────

/** Union of all valid slots across all operation types. */
export const ALL_SLOTS: readonly string[] = [
  'init',
  'preAuth',
  'auth',
  'postAuth',
  'preDataLoad',
  'postDataLoad',
  'preUpdate',
  'postUpdate',
  'preSubscribe',
  'finish',
];

/**
 * Maps each slot to its base pipeline index for the 3-function pipeline
 * shape (Query, Subscription, delete-Mutation): [auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_3_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 0,
  preAuth: 0,
  auth: 1,
  postAuth: 2,
  preDataLoad: 2,
  postDataLoad: 3,
  preUpdate: 2,
  postUpdate: 3,
  preSubscribe: 2,
  finish: 3,
};

/**
 * Maps each slot to its base pipeline index for the 4-function pipeline
 * shape (create/update Mutation): [init0, auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_4_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 1,
  preAuth: 1,
  auth: 2,
  postAuth: 3,
  preUpdate: 3,
  postUpdate: 4,
  finish: 4,
};

// ── Resolver Utility Functions ─────────────────────────────────────────

/** Canonical slot execution order used for sorting. */
const SLOT_ORDER: Readonly<Record<string, number>> = Object.fromEntries(ALL_SLOTS.map((slot, i) => [slot, i]));

/**
 * Groups ParsedExtended entries by typeName.fieldName, sorts by slot
 * pipeline execution order then numeric order, and pairs req/res templates.
 */
export function groupExtendedResolverFiles(extended: readonly ParsedExtended[]): Map<string, ExtendedResolverFile[]> {
  // Collect entries by field key.
  const byField = new Map<string, ParsedExtended[]>();
  for (const entry of extended) {
    const key = `${entry.typeName}.${entry.fieldName}`;
    const list = byField.get(key);
    if (list) {
      list.push(entry);
    } else {
      byField.set(key, [entry]);
    }
  }

  const result = new Map<string, ExtendedResolverFile[]>();

  for (const [key, entries] of byField) {
    // Sort by slot pipeline order, then by numeric order within the same slot.
    entries.sort((a, b) => {
      const slotDiff = (SLOT_ORDER[a.slot] ?? 0) - (SLOT_ORDER[b.slot] ?? 0);
      if (slotDiff !== 0) return slotDiff;
      return a.order - b.order;
    });

    // Pair req/res templates for the same slot+order.
    const pairMap = new Map<string, { reqFile?: string; resFile?: string }>();
    const pairOrder: string[] = [];

    for (const entry of entries) {
      const pairKey = `${entry.slot}.${entry.order}`;
      let pair = pairMap.get(pairKey);
      if (!pair) {
        pair = {};
        pairMap.set(pairKey, pair);
        pairOrder.push(pairKey);
      }
      if (entry.templateType === 'req') {
        pair.reqFile = entry.filename;
      } else {
        pair.resFile = entry.filename;
      }
    }

    // Build resolver files in sorted order.
    const resolverFiles: ExtendedResolverFile[] = [];
    for (const pairKey of pairOrder) {
      const pair = pairMap.get(pairKey)!;
      const [slot, orderStr] = pairKey.split('.');
      // Use the first entry's typeName/fieldName (all entries in this key share them).
      const sample = entries[0];
      resolverFiles.push({
        typeName: sample.typeName,
        fieldName: sample.fieldName,
        slot,
        order: Number(orderStr),
        reqFile: pair.reqFile,
        resFile: pair.resFile,
      });
    }

    result.set(key, resolverFiles);
  }

  return result;
}

/**
 * Selects the pipeline slot map based on typeName and fieldName.
 *
 * Query, Subscription, and delete-Mutation use the 3-function pipeline.
 * Other Mutations and custom types use the 4-function pipeline.
 */
function selectSlotMap(typeName: string, fieldName: string): Readonly<Record<string, number>> {
  if (typeName === 'Query' || typeName === 'Subscription') {
    return PIPELINE_3_SLOT_MAP;
  }
  if (typeName === 'Mutation' && fieldName.startsWith('delete')) {
    return PIPELINE_3_SLOT_MAP;
  }
  return PIPELINE_4_SLOT_MAP;
}

/**
 * Computes splice indexes for a set of grouped extended resolvers for a single field.
 *
 * Each entry's spliceIndex = baseSlotMap[slot] + runningOffset, where
 * runningOffset increments by 1 for each preceding entry.
 */
export function computeSpliceIndexes(
  typeName: string,
  fieldName: string,
  resolverFiles: readonly ExtendedResolverFile[],
): PipelineSpliceResult {
  const slotMap = selectSlotMap(typeName, fieldName);
  const entries: SpliceEntry[] = [];
  let runningOffset = 0;

  for (const resolverFile of resolverFiles) {
    const baseIndex = slotMap[resolverFile.slot];
    if (baseIndex === undefined) {
      throw new Error(`Unknown slot '${resolverFile.slot}' for ${typeName}.${fieldName}`);
    }
    entries.push({
      resolverFile,
      spliceIndex: baseIndex + runningOffset,
    });
    runningOffset++;
  }

  return { typeName, fieldName, entries };
}

/**
 * Options for rendering a defineData() resource file.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- authorizationModes is untyped JSON */
/**
 * Describes a Lambda authorizer function that needs to be imported
 * into data/resource.ts for the lambdaAuthorizationMode config.
 */
export interface LambdaAuthFunctionRef {
  readonly name: string;
  readonly importPath: string;
}

export interface DataRenderOptions {
  readonly schema: string;
  readonly tableMappings: Record<string, string>;
  readonly authorizationModes?: any;
  readonly graphqlApi: GraphqlApi;
  readonly hasAuth?: boolean;
  readonly apiId?: string;
  readonly classifiedResolvers?: ClassifiedVtlFiles;
  readonly lambdaAuthFunction?: LambdaAuthFunctionRef;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  public render(opts: DataRenderOptions): ts.NodeArray<ts.Node> {
    const { schema, preSchemaStatements } = this.prepareSchema(opts.schema);

    const nodes: ts.Node[] = [this.renderNamedImport('defineData', '@aws-amplify/backend'), this.renderBackendTypeImport()];

    if (opts.lambdaAuthFunction) {
      nodes.push(this.renderNamedImport(opts.lambdaAuthFunction.name, opts.lambdaAuthFunction.importPath));
    }

    const escapeHatchResult = this.renderApplyEscapeHatches(opts);
    for (const imp of escapeHatchResult.additionalImports) {
      nodes.push(imp);
    }

    nodes.push(
      newLineIdentifier,
      ...preSchemaStatements,
      this.renderSchemaDeclaration(schema),
      newLineIdentifier,
      this.renderDefineDataExport(opts),
    );

    if (escapeHatchResult.func) {
      nodes.push(newLineIdentifier, escapeHatchResult.func);
    }

    return factory.createNodeArray(nodes);
  }

  private renderNamedImport(identifier: string, source: string): ts.ImportDeclaration {
    return TS.namedImport(source, identifier);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../backend', 'Backend');
  }

  private renderSchemaDeclaration(schema: string): ts.VariableStatement {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration('schema', undefined, undefined, factory.createIdentifier('`' + schema + '`'))],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderDefineDataExport(opts: DataRenderOptions): ts.VariableStatement {
    const properties: ObjectLiteralElementLike[] = [];
    this.renderTableMappings(properties, opts.tableMappings);
    this.renderAuthorizationModes(properties, opts.authorizationModes);
    this.renderLogging(properties, this.extractLoggingConfig(opts.graphqlApi));
    properties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

    return factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'data',
            undefined,
            undefined,
            factory.createCallExpression(factory.createIdentifier('defineData'), undefined, [
              factory.createObjectLiteralExpression(properties, true),
            ]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderApplyEscapeHatches(opts: DataRenderOptions): {
    func: ts.FunctionDeclaration | undefined;
    additionalImports: ts.ImportDeclaration[];
  } {
    const providers = this.extractAdditionalAuthProviders(opts.graphqlApi);
    const escapeHatchStatements: ts.Statement[] = [];
    const additionalImports: ts.ImportDeclaration[] = [];

    if (providers && providers.length > 0) {
      escapeHatchStatements.push(...this.buildAdditionalAuthProviderStatements(providers));
    }

    const iamGrantStatements = this.buildIamAuthGrantStatements(opts);
    if (iamGrantStatements.length > 0) {
      additionalImports.push(TS.namedImport('aws-cdk-lib', 'aws_iam'));
      escapeHatchStatements.push(...iamGrantStatements);
    }

    // Resolver escape hatch statements
    const classified = opts.classifiedResolvers;
    if (classified) {
      const hasOverrides = classified.overrides.length > 0;
      const hasExtended = classified.extended.length > 0;

      if (hasOverrides || hasExtended) {
        // Common imports and declarations
        additionalImports.push(TS.namedImport('path', 'join', 'dirname'));
        additionalImports.push(TS.namedImport('url', 'fileURLToPath'));
        escapeHatchStatements.push(TS.declareConst('__dirname', factory.createIdentifier('dirname(fileURLToPath(import.meta.url))')));
        escapeHatchStatements.push(TS.declareConst('resolversDir', factory.createIdentifier('join(__dirname, "resolvers")')));
      }

      if (hasOverrides) {
        additionalImports.push(TS.namedImport('fs', 'readdirSync'));
        additionalImports.push(TS.namespaceImport('assets', 'aws-cdk-lib/aws-s3-assets'));
        escapeHatchStatements.push(...this.buildOverrideResolverStatements());
      }

      if (hasExtended) {
        additionalImports.push(TS.namedImport('aws-cdk-lib', 'aws_appsync'));
        additionalImports.push(TS.namedImport('aws-cdk-lib/aws-appsync', 'CfnResolver'));
        escapeHatchStatements.push(...this.buildExtendedResolverStatements(classified));
      }
    }

    if (escapeHatchStatements.length === 0) return { func: undefined, additionalImports: [] };

    return {
      func: TS.exportedFunction('applyEscapeHatches', escapeHatchStatements),
      additionalImports,
    };
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

  private renderTableMappings(properties: ObjectLiteralElementLike[], tableMappings: Record<string, string>): void {
    const mappingProps: ObjectLiteralElementLike[] = [];
    for (const [tableName, tableId] of Object.entries(tableMappings)) {
      mappingProps.push(factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)));
    }

    const branchNameProp = ts.addSyntheticLeadingComment(
      factory.createPropertyAssignment('branchName', factory.createStringLiteral(this.envName)),
      ts.SyntaxKind.SingleLineCommentTrivia,
      'The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables',
      true,
    );

    const modelMappingProp = factory.createPropertyAssignment(
      'modelNameToTableNameMapping',
      factory.createObjectLiteralExpression(mappingProps),
    );

    const envMapping = factory.createObjectLiteralExpression([branchNameProp, modelMappingProp], true);

    properties.push(factory.createPropertyAssignment(MIGRATED_TABLE_MAPPINGS_KEY, factory.createArrayLiteralExpression([envMapping])));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from amplify-meta.json authConfig
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
      props.push(
        factory.createPropertyAssignment(
          'tokenExpiryFromAuthInSeconds',
          factory.createNumericLiteral(Math.floor(Number(cfg.authTTL) / 1000).toString()),
        ),
      );
    if (cfg.iatTTL)
      props.push(
        factory.createPropertyAssignment(
          'tokenExpireFromIssueInSeconds',
          factory.createNumericLiteral(Math.floor(Number(cfg.iatTTL) / 1000).toString()),
        ),
      );
    target.push(factory.createPropertyAssignment('oidcAuthorizationMode', factory.createObjectLiteralExpression(props)));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from AppSync logConfig
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

  /** Extracts logging configuration from the raw AppSync API object. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from AppSync logConfig
  private extractLoggingConfig(graphqlApi: GraphqlApi): any {
    const logConfig = graphqlApi.logConfig;
    if (!logConfig?.fieldLogLevel || logConfig.fieldLogLevel === 'NONE') {
      return undefined;
    }
    return {
      fieldLogLevel: logConfig.fieldLogLevel.toLowerCase(),
      ...(logConfig.excludeVerboseContent !== undefined && {
        excludeVerboseContent: logConfig.excludeVerboseContent,
      }),
    };
  }

  /** Extracts additional auth providers from the raw AppSync API object. */
  private extractAdditionalAuthProviders(graphqlApi: GraphqlApi): Record<string, unknown>[] | undefined {
    return graphqlApi.additionalAuthenticationProviders?.map((provider) => ({
      authenticationType: provider.authenticationType,
      ...(provider.lambdaAuthorizerConfig && { lambdaAuthorizerConfig: provider.lambdaAuthorizerConfig }),
      ...(provider.openIDConnectConfig && { openIdConnectConfig: provider.openIDConnectConfig }),
      ...(provider.userPoolConfig && { userPoolConfig: provider.userPoolConfig }),
    }));
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

  /**
   * Builds the IAM auth grant statement when the Gen1 API uses AWS_IAM auth.
   *
   * Post-refactor, the identity pool moves to the Gen2 stack with a new AuthRole.
   * The new role needs an explicit policy to call appsync:GraphQL on the Gen1 API.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
  private buildIamAuthGrantStatements(opts: DataRenderOptions): ts.Statement[] {
    if (!opts.hasAuth || !opts.apiId) return [];

    const authModes = opts.authorizationModes;
    const defaultAuthType = authModes?.defaultAuthentication?.authenticationType;
    const hasIamDefault = defaultAuthType === 'AWS_IAM';
    const additionalProviders = opts.graphqlApi.additionalAuthenticationProviders ?? [];
    const hasIamAdditional = additionalProviders.some((p) => p.authenticationType === 'AWS_IAM');

    if (!hasIamDefault && !hasIamAdditional) return [];

    // backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
    //   new aws_iam.PolicyStatement({
    //     effect: aws_iam.Effect.ALLOW,
    //     actions: ['appsync:GraphQL'],
    //     resources: [`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/<apiId>/*`],
    //   })
    // )
    const policyStatement = factory.createNewExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('aws_iam'), factory.createIdentifier('PolicyStatement')),
      undefined,
      [
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              'effect',
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('aws_iam'), factory.createIdentifier('Effect')),
                factory.createIdentifier('ALLOW'),
              ),
            ),
            factory.createPropertyAssignment(
              'actions',
              factory.createArrayLiteralExpression([factory.createStringLiteral('appsync:GraphQL')]),
            ),
            factory.createPropertyAssignment(
              'resources',
              factory.createArrayLiteralExpression([
                factory.createTemplateExpression(factory.createTemplateHead('arn:aws:appsync:'), [
                  factory.createTemplateSpan(
                    TS.propAccess('backend', 'data', 'stack', 'region') as ts.Expression,
                    factory.createTemplateMiddle(':'),
                  ),
                  factory.createTemplateSpan(
                    TS.propAccess('backend', 'data', 'stack', 'account') as ts.Expression,
                    factory.createTemplateTail(`:apis/${opts.apiId}/*`),
                  ),
                ]),
              ]),
            ),
          ],
          true,
        ),
      ],
    );

    return [
      factory.createExpressionStatement(
        factory.createCallExpression(
          TS.propAccess('backend', 'auth', 'resources', 'authenticatedUserIamRole', 'addToPrincipalPolicy') as ts.PropertyAccessExpression,
          undefined,
          [policyStatement],
        ),
      ),
    ];
  }

  /** Builds override resolver statements for the applyEscapeHatches function. */
  private buildOverrideResolverStatements(): ts.Statement[] {
    const statements: ts.Statement[] = [];

    // const overiddenResolverFiles = readdirSync(resolversDir).filter(...)
    const filterCallback = factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, 'f')],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createBinaryExpression(
        factory.createParenthesizedExpression(
          factory.createBinaryExpression(
            factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('f'), 'endsWith'), undefined, [
              factory.createStringLiteral('.req.vtl'),
            ]),
            ts.SyntaxKind.BarBarToken,
            factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('f'), 'endsWith'), undefined, [
              factory.createStringLiteral('.res.vtl'),
            ]),
          ),
        ),
        ts.SyntaxKind.AmpersandAmpersandToken,
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('f'), 'split'), undefined, [
              factory.createStringLiteral('.'),
            ]),
            'length',
          ),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          factory.createNumericLiteral(4),
        ),
      ),
    );

    statements.push(
      TS.declareConst(
        'overiddenResolverFiles',
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createCallExpression(factory.createIdentifier('readdirSync'), undefined, [factory.createIdentifier('resolversDir')]),
            'filter',
          ),
          undefined,
          [filterCallback],
        ),
      ),
    );

    // for-of loop over overiddenResolverFiles
    const loopBody = this.buildOverrideLoopBody();
    statements.push(
      factory.createForOfStatement(
        undefined,
        factory.createVariableDeclarationList([factory.createVariableDeclaration('file')], ts.NodeFlags.Const),
        factory.createIdentifier('overiddenResolverFiles'),
        factory.createBlock(loopBody, true),
      ),
    );

    return statements;
  }

  /** Builds the body statements for the override resolver for-of loop. */
  private buildOverrideLoopBody(): ts.Statement[] {
    const statements: ts.Statement[] = [];

    // const [typeName, fieldName, templateType] = file.split(".");
    statements.push(
      factory.createVariableStatement(
        [],
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createArrayBindingPattern([
                factory.createBindingElement(undefined, undefined, 'typeName'),
                factory.createBindingElement(undefined, undefined, 'fieldName'),
                factory.createBindingElement(undefined, undefined, 'templateType'),
              ]),
              undefined,
              undefined,
              factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('file'), 'split'), undefined, [
                factory.createStringLiteral('.'),
              ]),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );

    // const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    statements.push(
      TS.declareConst(
        'capitalizedFieldName',
        factory.createBinaryExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('fieldName'), 'charAt'),
                undefined,
                [factory.createNumericLiteral(0)],
              ),
              'toUpperCase',
            ),
            undefined,
            [],
          ),
          ts.SyntaxKind.PlusToken,
          factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('fieldName'), 'slice'), undefined, [
            factory.createNumericLiteral(1),
          ]),
        ),
      ),
    );

    // const functionId = `${typeName}${capitalizedFieldName}DataResolverFn`;
    statements.push(
      TS.declareConst(
        'functionId',
        factory.createTemplateExpression(factory.createTemplateHead(''), [
          factory.createTemplateSpan(factory.createIdentifier('typeName'), factory.createTemplateMiddle('')),
          factory.createTemplateSpan(factory.createIdentifier('capitalizedFieldName'), factory.createTemplateTail('DataResolverFn')),
        ]),
      ),
    );

    // const fn = backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
    statements.push(
      TS.declareConst(
        'fn',
        factory.createElementAccessExpression(
          TS.propAccess('backend', 'data', 'resources', 'cfnResources', 'cfnFunctionConfigurations') as ts.Expression,
          factory.createIdentifier('functionId'),
        ),
      ),
    );

    // const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, { path: join(resolversDir, file) });
    statements.push(
      TS.declareConst(
        'vtlTemplate',
        factory.createNewExpression(TS.propAccess('assets', 'Asset') as ts.Expression, undefined, [
          TS.propAccess('backend', 'data') as ts.Expression,
          factory.createTemplateExpression(factory.createTemplateHead('VTLTemplate-'), [
            factory.createTemplateSpan(factory.createIdentifier('file'), factory.createTemplateTail('')),
          ]),
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                'path',
                factory.createCallExpression(factory.createIdentifier('join'), undefined, [
                  factory.createIdentifier('resolversDir'),
                  factory.createIdentifier('file'),
                ]),
              ),
            ],
            false,
          ),
        ]),
      ),
    );

    // if (templateType === "req") { ... } else { ... }
    const s3ObjectUrl = TS.propAccess('vtlTemplate', 's3ObjectUrl') as ts.Expression;
    statements.push(
      factory.createIfStatement(
        factory.createBinaryExpression(
          factory.createIdentifier('templateType'),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          factory.createStringLiteral('req'),
        ),
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createAssignment(
                factory.createPropertyAccessExpression(factory.createIdentifier('fn'), 'requestMappingTemplateS3Location'),
                s3ObjectUrl,
              ),
            ),
          ],
          true,
        ),
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createAssignment(
                factory.createPropertyAccessExpression(factory.createIdentifier('fn'), 'responseMappingTemplateS3Location'),
                s3ObjectUrl,
              ),
            ),
          ],
          true,
        ),
      ),
    );

    return statements;
  }

  /** Builds extended resolver statements for the applyEscapeHatches function. */
  private buildExtendedResolverStatements(classified: ClassifiedVtlFiles): ts.Statement[] {
    const statements: ts.Statement[] = [];

    // noneDataSource declaration
    const noneDataSourceStmt = ts.addSyntheticLeadingComment(
      this.renderNoneDataSource(),
      ts.SyntaxKind.SingleLineCommentTrivia,
      ' extending resolvers',
      true,
    );
    statements.push(noneDataSourceStmt);

    const grouped = groupExtendedResolverFiles(classified.extended);

    for (const [key, resolverFiles] of grouped) {
      const [typeName, fieldName] = key.split('.');

      // Render AppsyncFunction constructs for each extended resolver file
      for (const resolverFile of resolverFiles) {
        statements.push(this.renderAppsyncFunction(resolverFile));
      }

      // Compute splice indexes and render splice statements
      const spliceResult = computeSpliceIndexes(typeName, fieldName, resolverFiles);
      statements.push(...this.renderSpliceStatements(spliceResult));
    }

    return statements;
  }

  /** Renders `const noneDataSource = backend.data.resources.graphqlApi.addNoneDataSource("none");` */
  public renderNoneDataSource(): ts.Statement {
    return TS.declareConst(
      'noneDataSource',
      factory.createCallExpression(
        TS.propAccess('backend', 'data', 'resources', 'graphqlApi', 'addNoneDataSource') as ts.PropertyAccessExpression,
        undefined,
        [factory.createStringLiteral('none')],
      ),
    );
  }

  /** Renders an `AppsyncFunction` construct for a given extended resolver file. */
  public renderAppsyncFunction(resolverFile: ExtendedResolverFile): ts.Statement {
    const constructName = `${resolverFile.typeName}${resolverFile.fieldName}${resolverFile.slot}${resolverFile.order}`;

    const requestMapping = resolverFile.reqFile
      ? factory.createCallExpression(
          TS.propAccess('aws_appsync', 'MappingTemplate', 'fromFile') as ts.PropertyAccessExpression,
          undefined,
          [
            factory.createCallExpression(factory.createIdentifier('join'), undefined, [
              factory.createIdentifier('resolversDir'),
              factory.createStringLiteral(resolverFile.reqFile),
            ]),
          ],
        )
      : factory.createCallExpression(
          TS.propAccess('aws_appsync', 'MappingTemplate', 'fromString') as ts.PropertyAccessExpression,
          undefined,
          [factory.createStringLiteral('$util.toJson({})')],
        );

    const responseMapping = resolverFile.resFile
      ? factory.createCallExpression(
          TS.propAccess('aws_appsync', 'MappingTemplate', 'fromFile') as ts.PropertyAccessExpression,
          undefined,
          [
            factory.createCallExpression(factory.createIdentifier('join'), undefined, [
              factory.createIdentifier('resolversDir'),
              factory.createStringLiteral(resolverFile.resFile),
            ]),
          ],
        )
      : factory.createCallExpression(
          TS.propAccess('aws_appsync', 'MappingTemplate', 'fromString') as ts.PropertyAccessExpression,
          undefined,
          [factory.createStringLiteral('$util.toJson($ctx.prev.result)')],
        );

    const properties: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment('name', factory.createStringLiteral(constructName)),
      factory.createPropertyAssignment('api', TS.propAccess('backend', 'data', 'resources', 'graphqlApi') as ts.PropertyAccessExpression),
      factory.createPropertyAssignment('dataSource', factory.createIdentifier('noneDataSource')),
      factory.createPropertyAssignment('requestMappingTemplate', requestMapping),
      factory.createPropertyAssignment('responseMappingTemplate', responseMapping),
    ];

    const newExpr = factory.createNewExpression(TS.propAccess('aws_appsync', 'AppsyncFunction') as ts.PropertyAccessExpression, undefined, [
      TS.propAccess('backend', 'data', 'stack') as ts.Expression,
      factory.createStringLiteral(constructName),
      factory.createObjectLiteralExpression(properties, true),
    ]);

    return TS.declareConst(constructName, newExpr);
  }

  /** Renders splice statements inserting extended functions into a pipeline resolver. */
  public renderSpliceStatements(spliceResult: PipelineSpliceResult): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const capitalizedFieldName = spliceResult.fieldName.charAt(0).toUpperCase() + spliceResult.fieldName.slice(1);
    const resolverVarName = `${spliceResult.typeName.toLowerCase()}${capitalizedFieldName}Resolver`;
    const pipelineFunctionsVarName = resolverVarName.replace('Resolver', '') + 'PipelineFunctions';

    // const <resolverVarName> = backend.data.resources.cfnResources.cfnResolvers["TypeName.fieldName"] as CfnResolver;
    const resolverLookup = factory.createElementAccessExpression(
      TS.propAccess('backend', 'data', 'resources', 'cfnResources', 'cfnResolvers') as ts.Expression,
      factory.createStringLiteral(`${spliceResult.typeName}.${spliceResult.fieldName}`),
    );
    statements.push(
      TS.declareConst(resolverVarName, factory.createAsExpression(resolverLookup, factory.createTypeReferenceNode('CfnResolver'))),
    );

    // const <pipelineFunctionsVarName> = (<resolverVarName>.pipelineConfig as CfnResolver.PipelineConfigProperty).functions || [];
    const pipelineConfigAccess = factory.createPropertyAccessExpression(
      factory.createIdentifier(resolverVarName),
      factory.createIdentifier('pipelineConfig'),
    );
    const castPipelineConfig = factory.createParenthesizedExpression(
      factory.createAsExpression(
        pipelineConfigAccess,
        factory.createTypeReferenceNode(
          factory.createQualifiedName(factory.createIdentifier('CfnResolver'), factory.createIdentifier('PipelineConfigProperty')),
        ),
      ),
    );
    const functionsAccess = factory.createPropertyAccessExpression(castPipelineConfig, factory.createIdentifier('functions'));
    const functionsOrEmpty = factory.createBinaryExpression(
      functionsAccess,
      ts.SyntaxKind.BarBarToken,
      factory.createArrayLiteralExpression([]),
    );
    statements.push(TS.declareConst(pipelineFunctionsVarName, functionsOrEmpty));

    // For each splice entry: <pipelineFunctionsVarName>.splice(spliceIndex, 0, <constructName>.functionId);
    for (const entry of spliceResult.entries) {
      const constructName = `${entry.resolverFile.typeName}${entry.resolverFile.fieldName}${entry.resolverFile.slot}${entry.resolverFile.order}`;
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(pipelineFunctionsVarName), factory.createIdentifier('splice')),
            undefined,
            [
              factory.createNumericLiteral(entry.spliceIndex),
              factory.createNumericLiteral(0),
              factory.createPropertyAccessExpression(factory.createIdentifier(constructName), factory.createIdentifier('functionId')),
            ],
          ),
        ),
      );
    }

    // <resolverVarName>.pipelineConfig = { functions: <pipelineFunctionsVarName> };
    statements.push(
      factory.createExpressionStatement(
        factory.createAssignment(
          factory.createPropertyAccessExpression(factory.createIdentifier(resolverVarName), factory.createIdentifier('pipelineConfig')),
          factory.createObjectLiteralExpression(
            [factory.createPropertyAssignment(factory.createIdentifier('functions'), factory.createIdentifier(pipelineFunctionsVarName))],
            false,
          ),
        ),
      ),
    );

    return statements;
  }
}
