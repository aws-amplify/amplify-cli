import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { AmplifyMigrationOperation } from '../../../_operation';
import { Generator } from '../../generator';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { FunctionRenderer, RenderDefineFunctionOptions } from './function.renderer';
import { RootPackageJsonGenerator } from '../root-package-json.generator';
import { extractFilePathFromHandler } from '../../ts-factory-utils';

const factory = ts.factory;

/**
 * An environment variable that references a Gen2 backend resource.
 * The expression is the TypeScript AST node for the value argument
 * of `backend.functionName.addEnvironment(name, expression)`.
 */
interface EnvVarEscapeHatch {
  readonly name: string;
  readonly expression: ts.Expression;
}

/**
 * Resolved function definition combining local metadata and AWS config.
 */
interface ResolvedFunction {
  readonly resourceName: string;
  readonly category: string;
  readonly entry: string;
  readonly deployedName: string;
  readonly timeoutSeconds?: number;
  readonly memoryMB?: number;
  readonly runtime?: string;
  readonly schedule?: string;
  readonly environment?: Record<string, string>;
  readonly escapeHatches: readonly EnvVarEscapeHatch[];
  readonly dynamoActions: string[];
  readonly graphqlApiPermissions: { readonly hasMutation: boolean; readonly hasQuery: boolean };
}

/**
 * Generates Lambda function resources and contributes to backend.ts
 * for a single Gen1 function.
 *
 * 1. Fetches Lambda config via Gen1App.aws.fetchFunctionConfig()
 * 2. Fetches CloudWatch schedules via Gen1App.aws.fetchFunctionSchedule()
 * 3. Generates amplify/{category}/{name}/resource.ts with defineFunction()
 * 4. Copies Gen1 function source files
 * 5. Contributes function imports, name overrides, env var escape hatches,
 *    table grants, graphql grants, and dynamo triggers to backend.ts
 */
export class FunctionGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resourceName: string;
  private readonly renderer: FunctionRenderer;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    packageJsonGenerator: RootPackageJsonGenerator,
    outputDir: string,
    resourceName: string,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.packageJsonGenerator = packageJsonGenerator;
    this.outputDir = outputDir;
    this.resourceName = resourceName;
    this.renderer = new FunctionRenderer(gen1App.appId, gen1App.envName);
  }

  /**
   * Resolves this function's config and returns a flat array of operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const func = await this.resolve();

    await this.mergeFunctionDependencies(func);

    const operations: AmplifyMigrationOperation[] = [this.planResource(func), this.planOverrides(func), this.planGrants(func)];

    const triggerOp = await this.planTrigger(func);
    if (triggerOp) {
      operations.push(triggerOp);
    }

    return operations;
  }

  /**
   * Resolves this function's deployed config from AWS.
   */
  private async resolve(): Promise<ResolvedFunction> {
    const functionCategory = await this.gen1App.fetchMetaCategory('function');
    if (!functionCategory || !functionCategory[this.resourceName]) {
      throw new Error(`Function '${this.resourceName}' not found in amplify-meta.json`);
    }

    const resourceMeta = functionCategory[this.resourceName] as Record<string, unknown>;
    const output = resourceMeta.output as Record<string, string> | undefined;
    const deployedName = output?.Name;
    if (!deployedName) {
      throw new Error(`Function '${this.resourceName}' has no deployed name in amplify-meta.json output`);
    }

    const config = await this.gen1App.aws.fetchFunctionConfig(deployedName);
    if (!config) {
      throw new Error(`Lambda function '${deployedName}' not found`);
    }

    const categoryMap = await this.gen1App.fetchFunctionCategoryMap();
    const category = categoryMap.get(this.resourceName) || 'function';

    const runtime = config.Runtime;
    if (runtime && !runtime.startsWith('nodejs')) {
      throw new Error(`Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`);
    }

    const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
    const entry = extractFilePathFromHandler(config.Handler ?? 'index.js');

    // Classify environment variables: retained ones stay in defineFunction(),
    // escape hatches become addEnvironment() calls in backend.ts.
    const { retained, escapeHatches } = classifyEnvVars(config.Environment?.Variables ?? {});

    // Extract DynamoDB actions and GraphQL API permissions from the function's CloudFormation template
    const { dynamoActions, graphqlApiPermissions } = await this.extractCfnPermissions();

    return {
      resourceName: this.resourceName,
      category,
      entry,
      deployedName,
      timeoutSeconds: config.Timeout,
      memoryMB: config.MemorySize,
      runtime,
      schedule,
      environment: Object.keys(retained).length > 0 ? retained : undefined,
      escapeHatches,
      dynamoActions,
      graphqlApiPermissions,
    };
  }

  /**
   * Creates the resource.ts generation + source copy + backend.ts import operation.
   */
  private planResource(func: ResolvedFunction): AmplifyMigrationOperation {
    const dirPath = path.join(this.outputDir, 'amplify', func.category, func.resourceName);

    return {
      describe: async () => [`Generate ${func.category}/${func.resourceName}/resource.ts`],
      execute: async () => {
        const renderOpts: RenderDefineFunctionOptions = {
          resourceName: func.resourceName,
          entry: func.entry,
          name: func.deployedName,
          timeoutSeconds: func.timeoutSeconds,
          memoryMB: func.memoryMB,
          runtime: func.runtime,
          schedule: func.schedule,
          environment: func.environment,
        };

        const nodes = this.renderer.render(renderOpts);
        const content = printNodes(nodes);

        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(path.join(dirPath, 'resource.ts'), content, 'utf-8');

        // Copy Gen1 function source files
        await this.copyFunctionSource(func.resourceName, dirPath);

        // Contribute to backend.ts
        this.backendGenerator.addImport(`./${func.category}/${func.resourceName}/resource`, [func.resourceName]);
        this.backendGenerator.addDefineBackendProperty(
          factory.createShorthandPropertyAssignment(factory.createIdentifier(func.resourceName)),
        );
      },
    };
  }

  /**
   * Creates the name override + env var escape hatch operation.
   */
  private planOverrides(func: ResolvedFunction): AmplifyMigrationOperation {
    return {
      describe: async () => [`Generate function name override and env var escape hatches for ${func.resourceName}`],
      execute: async () => {
        this.backendGenerator.ensureBranchName();
        this.backendGenerator.addStatement(createFunctionNameOverride(func.resourceName));
        for (const hatch of func.escapeHatches) {
          this.backendGenerator.addStatement(createAddEnvironmentCall(func.resourceName, hatch));
        }
      },
    };
  }

  /**
   * Creates the table grants + graphql grants operation.
   */
  private planGrants(func: ResolvedFunction): AmplifyMigrationOperation {
    return {
      describe: async () => [`Generate DynamoDB table grants and GraphQL API grants for ${func.resourceName}`],
      execute: async () => {
        this.contributeTableGrants(func);
        this.contributeStorageTableGrants(func);
        this.contributeGraphqlApiGrants(func);
      },
    };
  }

  /**
   * Creates the DynamoDB trigger operation if this function has triggers.
   */
  private async planTrigger(func: ResolvedFunction): Promise<AmplifyMigrationOperation | undefined> {
    const models = await this.detectDynamoTriggerModels(func);
    if (models.length === 0) return undefined;

    return {
      describe: async () => [`Generate DynamoDB stream event source mappings for ${func.resourceName}`],
      execute: async () => {
        this.contributeDynamoTrigger(func.resourceName, models);
      },
    };
  }

  private async copyFunctionSource(resourceName: string, destDir: string): Promise<void> {
    const srcDir = path.join('amplify', 'backend', 'function', resourceName, 'src');
    try {
      await fs.cp(srcDir, destDir, {
        recursive: true,
        filter: (src) => {
          const basename = path.basename(src);
          return (
            basename !== 'node_modules' &&
            basename !== '.yarn' &&
            basename !== 'package.json' &&
            basename !== 'package-lock.json' &&
            basename !== 'yarn.lock' &&
            basename !== 'pnpm-lock.yaml'
          );
        },
      });
    } catch {
      // Source directory may not exist for some functions
    }
  }

  /**
   * Reads this function's package.json and merges dependencies into the root package.json.
   */
  private async mergeFunctionDependencies(func: ResolvedFunction): Promise<void> {
    const packageJsonPath = path.join('amplify', 'backend', 'function', func.resourceName, 'src', 'package.json');
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          this.packageJsonGenerator.addDependency(name, version as string);
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          this.packageJsonGenerator.addDevDependency(name, version as string);
        }
      }
    } catch {
      // No package.json for this function
    }
  }

  /**
   * Generates DynamoDB table grant statements for this function
   * accessing AppSync-managed tables (detected via API_*TABLE_* env vars).
   */
  private contributeTableGrants(func: ResolvedFunction): void {
    if (func.dynamoActions.length === 0) return;

    // Extract unique table names from escape hatches that reference API tables
    const tableNames = new Set<string>();
    for (const hatch of func.escapeHatches) {
      if (hatch.name.startsWith('API_') && hatch.name.includes('TABLE_')) {
        const tableName = extractTableName(hatch.name);
        if (tableName) tableNames.add(tableName);
      }
    }
    if (tableNames.size === 0) return;

    for (const tableName of tableNames) {
      const grantCall = factory.createExpressionStatement(
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
                factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(func.resourceName)),
                factory.createIdentifier('resources'),
              ),
              factory.createIdentifier('lambda'),
            ),
            ...func.dynamoActions.map((action) => factory.createStringLiteral(action)),
          ],
        ),
      );
      this.backendGenerator.addStatement(grantCall);
    }
  }

  /**
   * Generates GraphQL API grant statements for this function when it
   * has AppSync mutation or query permissions.
   */
  private contributeGraphqlApiGrants(func: ResolvedFunction): void {
    const { hasMutation, hasQuery } = func.graphqlApiPermissions;
    if (!hasMutation && !hasQuery) return;

    const lambdaRef = factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(func.resourceName)),
        factory.createIdentifier('resources'),
      ),
      factory.createIdentifier('lambda'),
    );

    const graphqlApi = factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('data')),
        factory.createIdentifier('resources'),
      ),
      factory.createIdentifier('graphqlApi'),
    );

    if (hasMutation) {
      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(graphqlApi, factory.createIdentifier('grantMutation')),
            undefined,
            [lambdaRef],
          ),
        ),
      );
    }

    if (hasQuery) {
      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(graphqlApi, factory.createIdentifier('grantQuery')),
            undefined,
            [lambdaRef],
          ),
        ),
      );
    }
  }

  /**
   * Reads the function's CloudFormation template from the cloud backend
   * and extracts DynamoDB IAM actions and GraphQL API permissions.
   */
  private async extractCfnPermissions(): Promise<{
    dynamoActions: string[];
    graphqlApiPermissions: { hasMutation: boolean; hasQuery: boolean };
  }> {
    const templatePath = `function/${this.resourceName}/${this.resourceName}-cloudformation-template.json`;
    const content = await this.gen1App.readCloudBackendFile(templatePath);
    if (!content) return { dynamoActions: [], graphqlApiPermissions: { hasMutation: false, hasQuery: false } };

    try {
      const template = JSON.parse(content);
      const policy = template.Resources?.AmplifyResourcesPolicy;
      if (!policy || policy.Type !== 'AWS::IAM::Policy') {
        return { dynamoActions: [], graphqlApiPermissions: { hasMutation: false, hasQuery: false } };
      }

      const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
      const dynamoActions: string[] = [];
      let hasMutation = false;
      let hasQuery = false;

      for (const stmt of statements) {
        const stmtActions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        for (const action of stmtActions) {
          if (typeof action === 'string' && action.startsWith('dynamodb:')) {
            dynamoActions.push(action);
          }
        }

        // Check for GraphQL API permissions in resource ARNs
        const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
        for (const resource of resources) {
          const resourceStr = JSON.stringify(resource);
          if (resourceStr.includes('/types/Mutation/')) hasMutation = true;
          if (resourceStr.includes('/types/Query/')) hasQuery = true;
        }
      }

      return { dynamoActions, graphqlApiPermissions: { hasMutation, hasQuery } };
    } catch {
      return { dynamoActions: [], graphqlApiPermissions: { hasMutation: false, hasQuery: false } };
    }
  }

  /**
   * Generates grant statements for this function accessing standalone
   * DynamoDB tables (STORAGE_ env vars).
   */
  private contributeStorageTableGrants(func: ResolvedFunction): void {
    if (func.dynamoActions.length === 0) return;

    // Extract the table variable name from STORAGE_ escape hatches (excluding S3 bucket)
    const tableNames = new Set<string>();
    for (const hatch of func.escapeHatches) {
      if (!hatch.name.startsWith('STORAGE_') || hatch.name.endsWith('BUCKETNAME')) continue;
      const match = hatch.name.match(/STORAGE_(.+?)_(ARN|NAME|STREAMARN)$/);
      if (match) {
        tableNames.add(match[1].toLowerCase());
      }
    }
    if (tableNames.size === 0) return;

    for (const tableName of tableNames) {
      const grantCall = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier(tableName), factory.createIdentifier('grant')),
          undefined,
          [
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(func.resourceName)),
                factory.createIdentifier('resources'),
              ),
              factory.createIdentifier('lambda'),
            ),
            ...func.dynamoActions.map((action) => factory.createStringLiteral(action)),
          ],
        ),
      );
      this.backendGenerator.addStatement(grantCall);
    }
  }

  /**
   * Detects DynamoDB stream trigger models for this function by reading
   * its CloudFormation template for EventSourceMapping resources.
   */
  private async detectDynamoTriggerModels(func: ResolvedFunction): Promise<string[]> {
    const templatePath = `function/${func.resourceName}/${func.resourceName}-cloudformation-template.json`;
    const templateContent = await this.gen1App.readCloudBackendFile(templatePath);
    if (!templateContent) return [];

    const template = JSON.parse(templateContent);
    const models: string[] = [];

    for (const resource of Object.values(template.Resources ?? {})) {
      const res = resource as Record<string, unknown>;
      if (res.Type !== 'AWS::Lambda::EventSourceMapping') continue;

      const props = res.Properties as Record<string, unknown> | undefined;
      const eventSourceArn = props?.EventSourceArn as Record<string, unknown> | undefined;
      const fnImportValue = eventSourceArn?.['Fn::ImportValue'] as Record<string, string> | undefined;
      const fnSub = fnImportValue?.['Fn::Sub'];
      if (!fnSub) continue;

      const match = fnSub.match(/:GetAtt:(\w+)Table:StreamArn/);
      if (match) {
        models.push(match[1]);
      }
    }

    return models;
  }

  /**
   * Generates DynamoDB stream event source code for this function.
   */
  private contributeDynamoTrigger(functionName: string, models: string[]): void {
    this.backendGenerator.addImport('aws-cdk-lib/aws-lambda-event-sources', ['DynamoEventSource']);
    this.backendGenerator.addImport('aws-cdk-lib/aws-lambda', ['StartingPosition']);

    const forStatement = factory.createForOfStatement(
      undefined,
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration('model', undefined, undefined, undefined)],
        ts.NodeFlags.Const,
      ),
      factory.createArrayLiteralExpression(models.map((model) => factory.createStringLiteral(model))),
      factory.createBlock(
        [
          // const table = backend.data.resources.tables[model];
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
          // backend.functionName.resources.lambda.addEventSource(...)
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
                  factory.createObjectLiteralExpression([
                    factory.createPropertyAssignment(
                      'startingPosition',
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier('StartingPosition'),
                        factory.createIdentifier('LATEST'),
                      ),
                    ),
                  ]),
                ]),
              ],
            ),
          ),
          // table.grantStreamRead(backend.functionName.resources.lambda.role!)
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
          // table.grantTableListStreams(backend.functionName.resources.lambda.role!)
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
    this.backendGenerator.addStatement(forStatement);
  }
}

/**
 * Classifies Lambda environment variables into two groups:
 * - retained: stay in the defineFunction() environment block
 * - escapeHatches: become addEnvironment() calls in backend.ts
 *
 * Each escape hatch carries the pre-built AST expression for the Gen2
 * resource it references. The ordering within escapeHatches follows
 * suffix order within each prefix group (API_, STORAGE_, AUTH_) to
 * produce deterministic output.
 */
function classifyEnvVars(variables: Record<string, string>): {
  readonly retained: Record<string, string>;
  readonly escapeHatches: readonly EnvVarEscapeHatch[];
} {
  const retained: Record<string, string> = {};
  const escapeHatches: EnvVarEscapeHatch[] = [];

  // Collect escape hatches in suffix order within each prefix group.
  // This produces deterministic output matching the expected snapshots.
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
      // Longer suffixes first: _STREAMARN before _ARN, _BUCKETNAME before _NAME.
      // This prevents _STREAMARN from incorrectly matching the _ARN suffix.
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
  ];

  // Build escape hatches preserving suffix order within each prefix group.
  // The `classified` set prevents double-matching (e.g., _STREAMARN already
  // matched won't re-match _ARN).
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

  // Everything not classified is retained in defineFunction()
  for (const [key, value] of Object.entries(variables)) {
    if (!classified.has(key)) {
      retained[key] = value;
    }
  }

  return { retained, escapeHatches };
}

/**
 * Creates `backend.functionName.addEnvironment(name, expression)`.
 */
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

// ── AST expression builders for env var escape hatches ──────────────

/**
 * Builds `backend.a.b.c` from path segments.
 */
function backendPath(...segments: string[]): ts.Expression {
  let expr: ts.Expression = factory.createIdentifier('backend');
  for (const segment of segments) {
    expr = factory.createPropertyAccessExpression(expr, factory.createIdentifier(segment));
  }
  return expr;
}

/**
 * Builds `backend.data.resources.tables['tableName'].property`.
 */
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

/**
 * Builds `varName.property` (no `backend.` prefix — for standalone DynamoDB tables).
 */
function directProp(varName: string, property: string): ts.Expression {
  return factory.createPropertyAccessExpression(factory.createIdentifier(varName), factory.createIdentifier(property));
}

/**
 * Wraps an expression with TypeScript non-null assertion (`expr!`).
 */
function nonNull(expr: ts.Expression): ts.Expression {
  return factory.createNonNullExpression(expr);
}

/**
 * Extracts the table name from an API_*TABLE_* env var.
 * 'API_MYAPI_MEALTABLE_ARN' → 'Meal'
 */
function extractTableName(envVar: string): string | undefined {
  const match = envVar.match(/API_.*_(.+?)TABLE_/);
  if (!match) return undefined;
  const raw = match[1];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * Extracts the lowercase variable name from a STORAGE_* env var.
 * 'STORAGE_ACTIVITY_ARN' → 'activity'
 * 'STORAGE_ACTIVITYTABLE_NAME' → 'activity' (strips TABLE suffix)
 */
function extractStorageVarName(envVar: string): string {
  const tableMatch = envVar.match(/STORAGE_(.+?)TABLE_/);
  if (tableMatch) return tableMatch[1].toLowerCase();
  const fallbackMatch = envVar.match(/STORAGE_(.+?)_/);
  if (fallbackMatch) return fallbackMatch[1].toLowerCase();
  return 'unknown';
}

/**
 * Creates `backend.{funcName}.resources.cfnResources.cfnFunction.functionName = `{funcName}-${branchName}`;`
 */
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
