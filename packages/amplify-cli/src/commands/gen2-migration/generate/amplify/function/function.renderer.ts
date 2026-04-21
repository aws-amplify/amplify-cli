import ts, { ObjectLiteralElementLike } from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';

const factory = ts.factory;

/**
 * Options for rendering a single defineFunction() resource file.
 */
export interface RenderDefineFunctionOptions {
  readonly resourceName: string;
  readonly entry: string;
  readonly name?: string;
  readonly timeoutSeconds?: number;
  readonly memoryMB?: number;
  readonly runtime?: string;
  readonly schedule?: string;
  readonly environment?: Readonly<Record<string, string>>;
}

/**
 * Options for rendering the complete function resource.ts file,
 * including defineFunction() and applyEscapeHatches().
 */
export interface RenderCompleteFunctionOptions extends RenderDefineFunctionOptions, RenderApplyEscapeHatchesOptions {
  /** The analytics construct type name for the type import, if needed. */
  readonly analyticsConstructType?: string;
  /** The import path for the analytics construct. */
  readonly analyticsConstructImportPath?: string;
}

/**
 * An environment variable that references a Gen2 backend resource.
 */
export interface EnvVarEscapeHatch {
  readonly name: string;
  readonly expression: ts.Expression;
}

/**
 * Options for rendering the applyEscapeHatches function body.
 */
export interface RenderApplyEscapeHatchesOptions {
  readonly resourceName: string;
  readonly escapeHatches: readonly EnvVarEscapeHatch[];
  readonly dynamoActions: readonly string[];
  readonly kinesisActions: readonly string[];
  readonly graphqlApiPermissions: { readonly hasMutation: boolean; readonly hasQuery: boolean };
  readonly triggerModels: readonly string[];
  readonly hasKinesisTrigger: boolean;
  readonly hasAnalytics: boolean;
  readonly analyticsConstructType?: string;
}

/**
 * Renders defineFunction() resource.ts files from Gen1 Lambda configuration.
 * Pure — no AWS calls, no side effects.
 */
export class FunctionRenderer {
  private readonly appId: string;
  private readonly backendEnvironmentName: string;

  public constructor(appId: string, backendEnvironmentName: string) {
    this.appId = appId;
    this.backendEnvironmentName = backendEnvironmentName;
  }

  /**
   * Produces the TypeScript AST for the defineFunction() call.
   */
  private renderDefineFunction(opts: RenderDefineFunctionOptions): ts.NodeArray<ts.Node> {
    const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set(['defineFunction']) };
    const postImportStatements: ts.Node[] = [];
    const properties: ObjectLiteralElementLike[] = [];

    const branchNameStatement = TS.createBranchNameDeclaration();
    postImportStatements.push(branchNameStatement);

    properties.push(factory.createPropertyAssignment('entry', factory.createStringLiteral(opts.entry)));

    if (opts.name) {
      properties.push(
        factory.createPropertyAssignment(
          'name',
          factory.createTemplateExpression(factory.createTemplateHead(`${opts.resourceName}-`), [
            factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
          ]),
        ),
      );
    }

    if (opts.timeoutSeconds) {
      properties.push(factory.createPropertyAssignment('timeoutSeconds', factory.createNumericLiteral(opts.timeoutSeconds)));
    }

    if (opts.memoryMB) {
      properties.push(factory.createPropertyAssignment('memoryMB', factory.createNumericLiteral(opts.memoryMB)));
    }

    this.renderEnvironment(properties, namedImports, opts);
    this.renderRuntime(properties, opts.runtime);
    this.renderSchedule(properties, opts.schedule);

    return TS.renderResourceTsFile({
      exportedVariableName: factory.createIdentifier(opts.resourceName),
      functionCallParameter: factory.createObjectLiteralExpression(properties, true),
      backendFunctionConstruct: 'defineFunction',
      additionalImportedBackendIdentifiers: namedImports,
      postImportStatements,
    });
  }

  /**
   * Renders the complete resource.ts file including defineFunction(),
   * applyEscapeHatches(), all imports, and Backend/analytics type imports.
   */
  public render(opts: RenderCompleteFunctionOptions): ts.NodeArray<ts.Node> {
    const baseNodes = this.renderDefineFunction(opts);
    const escapeHatchResult = this.renderApplyEscapeHatches(opts);

    const additionalImportDecls = this.renderCdkImports(escapeHatchResult.additionalImports);
    const backendTypeImport = this.renderBackendTypeImport();
    const analyticsTypeImportDecl = this.renderAnalyticsTypeImport(opts);

    const allNodes: ts.Node[] = [];
    let foundFirstNonImport = false;
    for (const node of baseNodes) {
      if (!foundFirstNonImport && ts.isImportDeclaration(node as ts.Node)) {
        allNodes.push(node);
      } else {
        if (!foundFirstNonImport) {
          for (const decl of additionalImportDecls) allNodes.push(decl);
          allNodes.push(backendTypeImport);
          if (analyticsTypeImportDecl) allNodes.push(analyticsTypeImportDecl);
          foundFirstNonImport = true;
        }
        allNodes.push(node);
      }
    }
    if (!foundFirstNonImport) {
      for (const decl of additionalImportDecls) allNodes.push(decl);
      allNodes.push(backendTypeImport);
      if (analyticsTypeImportDecl) allNodes.push(analyticsTypeImportDecl);
    }
    for (const stmt of escapeHatchResult.postExportStatements) {
      allNodes.push(newLineIdentifier);
      allNodes.push(stmt);
    }

    return factory.createNodeArray(allNodes as ts.Statement[]);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../../backend', 'Backend');
  }

  private renderAnalyticsTypeImport(opts: RenderCompleteFunctionOptions): ts.ImportDeclaration | undefined {
    if (!opts.analyticsConstructType) return undefined;
    return TS.typeImport(opts.analyticsConstructImportPath!, opts.analyticsConstructType);
  }

  private renderCdkImports(additionalImports: Record<string, Set<string>>): ts.ImportDeclaration[] {
    const decls: ts.ImportDeclaration[] = [];
    for (const [source, identifiers] of Object.entries(additionalImports)) {
      decls.push(TS.namedImport(source, ...Array.from(identifiers)));
    }
    return decls;
  }

  /**
   * Renders the applyEscapeHatches function declaration and any
   * additional imports needed for it. Returns AST nodes to append
   * as postExportStatements in the resource.ts file.
   */
  private renderApplyEscapeHatches(opts: RenderApplyEscapeHatchesOptions): {
    readonly postExportStatements: ts.Node[];
    readonly additionalImports: Record<string, Set<string>>;
  } {
    const statements: ts.Statement[] = [];
    const additionalImports: Record<string, Set<string>> = {};

    // Function name override
    statements.push(createFunctionNameOverride(opts.resourceName));

    // Env var escape hatches
    for (const hatch of opts.escapeHatches) {
      statements.push(createAddEnvironmentCall(opts.resourceName, hatch));
    }

    // Table grants (AppSync-managed tables)
    const tableNames = new Set<string>();
    for (const hatch of opts.escapeHatches) {
      if (hatch.name.startsWith('API_') && hatch.name.includes('TABLE_')) {
        const tableName = extractTableName(hatch.name);
        if (tableName) tableNames.add(tableName);
      }
    }
    if (tableNames.size > 0 && opts.dynamoActions.length > 0) {
      for (const tableName of tableNames) {
        statements.push(createTableGrant(opts.resourceName, tableName, opts.dynamoActions));
      }
    }

    // Storage table grants (standalone DynamoDB tables)
    const storageTableNames = new Set<string>();
    for (const hatch of opts.escapeHatches) {
      if (!hatch.name.startsWith('STORAGE_') || hatch.name.endsWith('BUCKETNAME')) continue;
      const match = hatch.name.match(/STORAGE_(.+?)_(ARN|NAME|STREAMARN)$/);
      if (match) storageTableNames.add(match[1].toLowerCase());
    }
    if (storageTableNames.size > 0 && opts.dynamoActions.length > 0) {
      for (const tableName of storageTableNames) {
        statements.push(createStorageTableGrant(opts.resourceName, tableName, opts.dynamoActions));
      }
    }

    // GraphQL API grants
    if (opts.graphqlApiPermissions.hasMutation) {
      statements.push(createGraphqlGrant(opts.resourceName, 'grantMutation'));
    }
    if (opts.graphqlApiPermissions.hasQuery) {
      statements.push(createGraphqlGrant(opts.resourceName, 'grantQuery'));
    }

    // Kinesis grants (addToRolePolicy)
    if (opts.kinesisActions.length > 0) {
      additionalImports['aws-cdk-lib'] = new Set(['aws_iam']);
      statements.push(createKinesisGrant(opts.resourceName, opts.kinesisActions));
    }

    // DynamoDB triggers
    if (opts.triggerModels.length > 0) {
      additionalImports['aws-cdk-lib/aws-lambda-event-sources'] = new Set(['DynamoEventSource']);
      additionalImports['aws-cdk-lib/aws-lambda'] = new Set(['StartingPosition']);
      statements.push(createDynamoTrigger(opts.resourceName, opts.triggerModels));
    }

    // Kinesis triggers
    if (opts.hasKinesisTrigger) {
      if (!additionalImports['aws-cdk-lib/aws-lambda-event-sources']) {
        additionalImports['aws-cdk-lib/aws-lambda-event-sources'] = new Set();
      }
      additionalImports['aws-cdk-lib/aws-lambda-event-sources'].add('KinesisEventSource');
      if (!additionalImports['aws-cdk-lib/aws-lambda']) {
        additionalImports['aws-cdk-lib/aws-lambda'] = new Set();
      }
      additionalImports['aws-cdk-lib/aws-lambda'].add('StartingPosition');
      additionalImports['aws-cdk-lib/aws-kinesis'] = new Set(['Stream']);
      statements.push(...createKinesisTrigger(opts.resourceName));
    }

    // Build the extra parameters (beyond backend: Backend)
    const extraParams: ts.ParameterDeclaration[] = [];

    // Add analytics parameter if needed
    if (opts.hasAnalytics && opts.analyticsConstructType) {
      extraParams.push(
        factory.createParameterDeclaration(
          undefined,
          undefined,
          'analytics',
          undefined,
          factory.createTypeReferenceNode(opts.analyticsConstructType),
        ),
      );
    }

    const funcDecl = TS.exportedFunction('applyEscapeHatches', statements, extraParams.length > 0 ? extraParams : undefined);

    return { postExportStatements: [funcDecl], additionalImports };
  }

  private renderEnvironment(
    target: ObjectLiteralElementLike[],
    namedImports: Record<string, Set<string>>,
    opts: RenderDefineFunctionOptions,
  ): void {
    if (!opts.environment || Object.keys(opts.environment).length === 0) return;

    const envProps = Object.entries(opts.environment).map(([key, value]) => {
      if (key === 'API_KEY' && value.startsWith(`/amplify/${this.appId}/${this.backendEnvironmentName}`)) {
        namedImports['@aws-amplify/backend'].add('secret');
        return factory.createPropertyAssignment(
          key,
          factory.createCallExpression(factory.createIdentifier('secret'), undefined, [factory.createStringLiteral('API_KEY')]),
        );
      }

      if (key === 'ENV') {
        return factory.createPropertyAssignment(
          key,
          factory.createTemplateExpression(factory.createTemplateHead(''), [
            factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
          ]),
        );
      }

      return factory.createPropertyAssignment(key, factory.createStringLiteral(value));
    });

    target.push(factory.createPropertyAssignment('environment', factory.createObjectLiteralExpression(envProps)));
  }

  private renderRuntime(target: ObjectLiteralElementLike[], runtime?: string): void {
    if (!runtime || !runtime.includes('nodejs')) return;

    const nodeVersion = parseNodejsRuntime(runtime);
    if (nodeVersion === undefined) {
      throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }
    target.push(factory.createPropertyAssignment('runtime', factory.createNumericLiteral(nodeVersion)));
  }

  private renderSchedule(target: ObjectLiteralElementLike[], schedule?: string): void {
    if (!schedule) return;

    const converted = convertScheduleExpression(schedule);
    if (converted) {
      target.push(factory.createPropertyAssignment('schedule', factory.createStringLiteral(converted)));
    }
  }
}

// ── Helper functions for rendering escape hatches ──────────────────

/**
 * Classifies Lambda environment variables into two groups:
 * - retained: stay in the defineFunction() environment block
 * - escapeHatches: become addEnvironment() calls in applyEscapeHatches
 */
export function classifyEnvVars(variables: Record<string, string>): {
  readonly retained: Record<string, string>;
  readonly escapeHatches: readonly EnvVarEscapeHatch[];
} {
  const retained: Record<string, string> = {};
  const escapeHatches: EnvVarEscapeHatch[] = [];

  const suffixGroups: ReadonlyArray<{
    readonly prefix: string;
    readonly suffixes: ReadonlyArray<{ readonly suffix: string; readonly build: (envVar: string) => ts.Expression }>;
  }> = [
    {
      prefix: 'API_',
      suffixes: [
        { suffix: '_GRAPHQLAPIKEYOUTPUT', build: () => nonNull(backendPath('data', 'apiKey')) },
        { suffix: '_GRAPHQLAPIENDPOINTOUTPUT', build: () => backendPath('data', 'graphqlUrl') },
        { suffix: '_GRAPHQLAPIIDOUTPUT', build: () => backendPath('data', 'apiId') },
        {
          suffix: 'TABLE_ARN',
          build: (envVar) => backendTableProp(extractTableName(envVar) ?? 'unknown', 'tableArn'),
        },
        {
          suffix: 'TABLE_NAME',
          build: (envVar) => backendTableProp(extractTableName(envVar) ?? 'unknown', 'tableName'),
        },
      ],
    },
    {
      prefix: 'STORAGE_',
      suffixes: [
        { suffix: '_STREAMARN', build: (envVar) => nonNull(directProp(extractStorageVarName(envVar), 'tableStreamArn')) },
        { suffix: '_BUCKETNAME', build: () => backendPath('storage', 'resources', 'bucket', 'bucketName') },
        { suffix: '_ARN', build: (envVar) => directProp(extractStorageVarName(envVar), 'tableArn') },
        { suffix: '_NAME', build: (envVar) => directProp(extractStorageVarName(envVar), 'tableName') },
      ],
    },
    {
      prefix: 'AUTH_',
      suffixes: [{ suffix: '_USERPOOLID', build: () => backendPath('auth', 'resources', 'userPool', 'userPoolId') }],
    },
    {
      prefix: 'FUNCTION_',
      suffixes: [
        {
          suffix: '_NAME',
          build: (envVar) => {
            const match = envVar.match(/FUNCTION_(.+?)_NAME/);
            const funcName = match ? match[1].toLowerCase() : 'unknown';
            return backendPath(funcName, 'resources', 'lambda', 'functionName');
          },
        },
      ],
    },
    {
      prefix: 'ANALYTICS_',
      suffixes: [
        {
          suffix: '_KINESISSTREAMARN',
          build: () => directProp('analytics', 'kinesisStreamArn'),
        },
      ],
    },
  ];

  const classified = new Set<string>();
  for (const { prefix, suffixes } of suffixGroups) {
    for (const { suffix, build } of suffixes) {
      for (const envVar of Object.keys(variables)) {
        if (envVar.startsWith(prefix) && envVar.endsWith(suffix) && !classified.has(envVar)) {
          escapeHatches.push({ name: envVar, expression: build(envVar) });
          classified.add(envVar);
        }
      }
    }
  }

  for (const [key, value] of Object.entries(variables)) {
    if (!classified.has(key)) {
      retained[key] = value;
    }
  }

  return { retained, escapeHatches };
}

/** Creates `backend.functionName.addEnvironment(name, expression)`. */
function createAddEnvironmentCall(functionName: string, hatch: EnvVarEscapeHatch): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
        factory.createIdentifier('addEnvironment'),
      ),
      undefined,
      [factory.createStringLiteral(hatch.name), hatch.expression],
    ),
  );
}

/** Creates `backend.{funcName}.resources.cfnResources.cfnFunction.functionName = `{funcName}-${branchName}`;` */
function createFunctionNameOverride(funcName: string): ts.ExpressionStatement {
  const lhs = factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
          factory.createIdentifier('resources'),
        ),
        factory.createIdentifier('cfnResources'),
      ),
      factory.createIdentifier('cfnFunction'),
    ),
    factory.createIdentifier('functionName'),
  );

  const rhs = factory.createTemplateExpression(factory.createTemplateHead(`${funcName}-`), [
    factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
  ]);

  return factory.createExpressionStatement(factory.createAssignment(lhs, rhs));
}

/** Builds `backend.a.b.c` from path segments. */
function backendPath(...segments: string[]): ts.Expression {
  return TS.propAccess('backend', ...segments);
}

/** Builds `backend.data.resources.tables['tableName'].property`. */
function backendTableProp(tableName: string, property: string): ts.Expression {
  const tables = factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
      factory.createIdentifier('resources'),
    ),
    factory.createIdentifier('tables'),
  );
  const indexed = factory.createElementAccessExpression(tables, factory.createStringLiteral(tableName));
  return factory.createPropertyAccessExpression(indexed, factory.createIdentifier(property));
}

/** Builds `varName.property`. */
function directProp(varName: string, property: string): ts.Expression {
  return TS.propAccess(varName, property);
}

/** Wraps an expression with TypeScript non-null assertion (`expr!`). */
function nonNull(expr: ts.Expression): ts.Expression {
  return factory.createNonNullExpression(expr);
}

/** Extracts the table name from an API_*TABLE_* env var. */
export function extractTableName(envVar: string): string | undefined {
  const match = envVar.match(/API_.*_(.+?)TABLE_/);
  if (!match) return undefined;
  const raw = match[1];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/** Extracts the lowercase variable name from a STORAGE_* env var. */
function extractStorageVarName(envVar: string): string {
  const tableMatch = envVar.match(/STORAGE_(.+?)TABLE_/);
  if (tableMatch) return tableMatch[1].toLowerCase();
  const fallbackMatch = envVar.match(/STORAGE_(.+?)_/);
  if (fallbackMatch) return fallbackMatch[1].toLowerCase();
  return 'unknown';
}

/** Creates a table grant statement for AppSync-managed tables. */
function createTableGrant(funcName: string, tableName: string, actions: readonly string[]): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createElementAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
              factory.createIdentifier('resources'),
            ),
            factory.createIdentifier('tables'),
          ),
          factory.createStringLiteral(tableName),
        ),
        factory.createIdentifier('grant'),
      ),
      undefined,
      [
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
            factory.createIdentifier('resources'),
          ),
          factory.createIdentifier('lambda'),
        ),
        ...actions.map((action) => factory.createStringLiteral(action)),
      ],
    ),
  );
}

/** Creates a storage table grant statement for standalone DynamoDB tables. */
function createStorageTableGrant(funcName: string, tableName: string, actions: readonly string[]): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier(tableName), factory.createIdentifier('grant')),
      undefined,
      [
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
            factory.createIdentifier('resources'),
          ),
          factory.createIdentifier('lambda'),
        ),
        ...actions.map((action) => factory.createStringLiteral(action)),
      ],
    ),
  );
}

/** Creates a GraphQL API grant statement. */
function createGraphqlGrant(funcName: string, grantMethod: string): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
            factory.createIdentifier('resources'),
          ),
          factory.createIdentifier('graphqlApi'),
        ),
        factory.createIdentifier(grantMethod),
      ),
      undefined,
      [
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
            factory.createIdentifier('resources'),
          ),
          factory.createIdentifier('lambda'),
        ),
      ],
    ),
  );
}

/** Creates a Kinesis addToRolePolicy statement. */
function createKinesisGrant(funcName: string, actions: readonly string[]): ts.ExpressionStatement {
  const lambdaRef = factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
      factory.createIdentifier('resources'),
    ),
    factory.createIdentifier('lambda'),
  );

  const policyStatement = factory.createNewExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier('aws_iam'), factory.createIdentifier('PolicyStatement')),
    undefined,
    [
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            'actions',
            factory.createArrayLiteralExpression(actions.map((action) => factory.createStringLiteral(action))),
          ),
          factory.createPropertyAssignment(
            'resources',
            factory.createArrayLiteralExpression([
              factory.createPropertyAccessExpression(factory.createIdentifier('analytics'), factory.createIdentifier('kinesisStreamArn')),
            ]),
          ),
        ],
        true,
      ),
    ],
  );

  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(lambdaRef, factory.createIdentifier('addToRolePolicy')),
      undefined,
      [policyStatement],
    ),
  );
}

/** Creates a DynamoDB stream trigger for-of loop. */
function createDynamoTrigger(functionName: string, models: readonly string[]): ts.ForOfStatement {
  return factory.createForOfStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration('model', undefined, undefined, undefined)],
      ts.NodeFlags.Const,
    ),
    factory.createArrayLiteralExpression(models.map((model) => factory.createStringLiteral(model))),
    factory.createBlock(
      [
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                'table',
                undefined,
                undefined,
                factory.createElementAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('backend.data.resources'),
                    factory.createIdentifier('tables'),
                  ),
                  factory.createIdentifier('model'),
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(`backend.${functionName}.resources`),
                factory.createIdentifier('lambda'),
              ),
              factory.createIdentifier('addEventSource'),
            ),
            undefined,
            [
              factory.createNewExpression(factory.createIdentifier('DynamoEventSource'), undefined, [
                factory.createIdentifier('table'),
                factory.createObjectLiteralExpression([TS.enumProp('startingPosition', 'StartingPosition', 'LATEST')]),
              ]),
            ],
          ),
        ),
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('table'), factory.createIdentifier('grantStreamRead')),
            undefined,
            [
              factory.createNonNullExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(`backend.${functionName}.resources.lambda`),
                  factory.createIdentifier('role'),
                ),
              ),
            ],
          ),
        ),
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('table'), factory.createIdentifier('grantTableListStreams')),
            undefined,
            [
              factory.createNonNullExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(`backend.${functionName}.resources.lambda`),
                  factory.createIdentifier('role'),
                ),
              ),
            ],
          ),
        ),
      ],
      true,
    ),
  );
}

/** Creates a Kinesis stream trigger. */
function createKinesisTrigger(functionName: string): ts.Statement[] {
  const fromStreamArn = factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          'kinesisStream',
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Stream'), factory.createIdentifier('fromStreamArn')),
            undefined,
            [
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(`backend.${functionName}`),
                    factory.createIdentifier('resources'),
                  ),
                  factory.createIdentifier('lambda'),
                ),
                factory.createIdentifier('stack'),
              ),
              factory.createStringLiteral('KinesisStream'),
              factory.createPropertyAccessExpression(factory.createIdentifier('analytics'), factory.createIdentifier('kinesisStreamArn')),
            ],
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  const addEventSource = factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(`backend.${functionName}.resources`),
          factory.createIdentifier('lambda'),
        ),
        factory.createIdentifier('addEventSource'),
      ),
      undefined,
      [
        factory.createNewExpression(factory.createIdentifier('KinesisEventSource'), undefined, [
          factory.createIdentifier('kinesisStream'),
          factory.createObjectLiteralExpression([TS.enumProp('startingPosition', 'StartingPosition', 'LATEST')]),
        ]),
      ],
    ),
  );

  return [fromStreamArn, addEventSource];
}

/** Converts a nodejs runtime string to a version number. */
function parseNodejsRuntime(runtime: string): number | undefined {
  const match = runtime.match(/nodejs(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Converts CloudWatch schedule expressions to Gen2 format. */
function convertScheduleExpression(raw: string): string | undefined {
  const startIndex = raw.indexOf('(') + 1;
  const endIndex = raw.lastIndexOf(')');
  const inner = startIndex > 0 && endIndex > startIndex ? raw.slice(startIndex, endIndex) : undefined;

  if (raw.startsWith('rate(') && inner) {
    const [value, unit] = inner.split(' ');
    const unitMap: Record<string, string> = {
      minute: 'm',
      minutes: 'm',
      hour: 'h',
      hours: 'h',
      day: 'd',
      days: 'd',
    };
    return unitMap[unit] ? `every ${value}${unitMap[unit]}` : undefined;
  }

  if (raw.startsWith('cron(') && inner) {
    return inner;
  }

  return undefined;
}
