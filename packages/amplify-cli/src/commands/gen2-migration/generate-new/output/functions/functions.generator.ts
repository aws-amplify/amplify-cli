import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { FunctionsRenderer, RenderDefineFunctionOptions } from './functions.renderer';
import { RootPackageJsonGenerator } from '../root-package-json.generator';

const factory = ts.factory;

// Maps Gen1 environment variable patterns to Gen2 backend resource paths
const ENV_VAR_PATTERNS: Record<string, string> = {
  'API_.*_GRAPHQLAPIENDPOINTOUTPUT': 'data.graphqlUrl',
  'API_.*_GRAPHQLAPIIDOUTPUT': 'data.apiId',
  'API_.*_GRAPHQLAPIKEYOUTPUT': 'data.apiKey!',
  'API_.*TABLE_ARN': 'data.resources.tables[{table}].tableArn',
  'API_.*TABLE_NAME': 'data.resources.tables[{table}].tableName',
  'AUTH_.*_USERPOOLID': 'auth.resources.userPool.userPoolId',
  'STORAGE_.*_ARN': '{table}.tableArn',
  'STORAGE_.*_NAME': '{table}.tableName',
  'STORAGE_.*_STREAMARN': '{table}.tableStreamArn!',
  'STORAGE_.*_BUCKETNAME': 'storage.resources.bucket.bucketName',
  'FUNCTION_.*_NAME': '{function}.resources.lambda.functionName',
};

// Env var suffixes that should be filtered out and handled as escape hatches
const FILTERED_ENV_SUFFIXES = ['GRAPHQLAPIKEYOUTPUT', 'GRAPHQLAPIENDPOINTOUTPUT', 'GRAPHQLAPIIDOUTPUT', 'TABLE_ARN', 'TABLE_NAME'];

const STORAGE_ENV_SUFFIXES = ['ARN', 'NAME', 'STREAMARN', 'BUCKETNAME'];
const AUTH_ENV_SUFFIXES = ['USERPOOLID'];

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
  readonly filteredEnvironmentVariables: Record<string, string>;
  readonly dynamoActions: string[];
  readonly graphqlApiPermissions: { readonly hasMutation: boolean; readonly hasQuery: boolean };
}
/**
 * Generates Lambda function resources and contributes to backend.ts.
 *
 * For each function in the Gen1 app:
 * 1. Fetches Lambda config via Gen1App.aws.fetchFunctionConfig()
 * 2. Fetches CloudWatch schedules via Gen1App.aws.fetchFunctionSchedule()
 * 3. Identifies trigger relationships (auth, storage, scheduled)
 * 4. Generates amplify/{category}/{name}/resource.ts with defineFunction()
 * 5. Copies Gen1 function source files
 * 6. Contributes function imports, name overrides, env var escape hatches to backend.ts
 */
export class FunctionsGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineFunction: FunctionsRenderer;
  private readonly functionNamesAndCategories: Map<string, string>;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    functionNamesAndCategories: Map<string, string>,
    packageJsonGenerator: RootPackageJsonGenerator,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.defineFunction = new FunctionsRenderer();
    this.functionNamesAndCategories = functionNamesAndCategories;
    this.packageJsonGenerator = packageJsonGenerator;
  }

  /**
   * Plans the function generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const functionCategory = await this.gen1App.fetchMetaCategory('function');
    if (!functionCategory) {
      return [];
    }

    const meta = await this.gen1App.fetchMeta();
    const categoryMap = this.buildCategoryMap(meta);
    const resolvedFunctions = await this.resolveFunctions(functionCategory, categoryMap);

    if (resolvedFunctions.length === 0) {
      return [];
    }

    // Populate the shared functionNamesAndCategories map
    for (const func of resolvedFunctions) {
      this.functionNamesAndCategories.set(func.resourceName, func.category);
    }

    // Merge function dependencies into root package.json
    await this.mergeFunctionDependencies(resolvedFunctions);

    const operations: AmplifyMigrationOperation[] = [];

    for (const func of resolvedFunctions) {
      operations.push(this.planFunction(func));
    }

    // Contribute function name overrides and env var escape hatches to backend.ts,
    // interleaved per function (name override + env vars for each function).
    operations.push({
      describe: async () => ['Generate function name overrides and env var escape hatches in backend.ts'],
      execute: async () => {
        this.backendGenerator.ensureBranchName();
        for (const func of resolvedFunctions) {
          this.backendGenerator.addStatement(createFunctionNameOverride(func.resourceName));
          if (Object.keys(func.filteredEnvironmentVariables).length > 0) {
            const statements = generateLambdaEnvVars(func.resourceName, func.filteredEnvironmentVariables);
            for (const stmt of statements) {
              this.backendGenerator.addStatement(stmt);
            }
          }
        }
      },
    });

    // Contribute DynamoDB table grants and GraphQL API grants to backend.ts
    operations.push({
      describe: async () => ['Generate DynamoDB table grants and GraphQL API grants in backend.ts'],
      execute: async () => {
        for (const func of resolvedFunctions) {
          this.contributeTableGrants(func);
        }
        this.contributeStorageTableGrants(resolvedFunctions);
        for (const func of resolvedFunctions) {
          this.contributeGraphqlApiGrants(func);
        }
      },
    });

    // Detect and contribute DynamoDB stream event sources
    const dynamoTriggers = await this.detectDynamoTriggers(resolvedFunctions);
    if (dynamoTriggers.length > 0) {
      operations.push({
        describe: async () => ['Generate DynamoDB stream event source mappings in backend.ts'],
        execute: async () => {
          this.contributeDynamoTriggers(dynamoTriggers);
        },
      });
    }

    return operations;
  }

  private planFunction(func: ResolvedFunction): AmplifyMigrationOperation {
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

        const nodes = this.defineFunction.render(renderOpts);
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

  private async resolveFunctions(functionCategory: Record<string, unknown>, categoryMap: Map<string, string>): Promise<ResolvedFunction[]> {
    const resolved: ResolvedFunction[] = [];

    for (const [resourceName, resourceValue] of Object.entries(functionCategory)) {
      const resourceMeta = resourceValue as Record<string, unknown>;
      const output = resourceMeta.output as Record<string, string> | undefined;
      const deployedName = output?.Name;
      if (!deployedName) continue;

      const config = await this.gen1App.aws.fetchFunctionConfig(deployedName);
      if (!config) continue;

      const runtime = config.Runtime;
      if (runtime && !runtime.startsWith('nodejs')) {
        throw new Error(
          `Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`,
        );
      }

      const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
      const category = categoryMap.get(resourceName) || 'function';
      const entry = extractFilePathFromHandler(config.Handler ?? 'index.js');

      // Filter environment variables that reference other Amplify resources
      const envVars = { ...(config.Environment?.Variables ?? {}) };
      const filteredEnvVars: Record<string, string> = {};
      filterResourceEnvVars(envVars, filteredEnvVars);

      // Extract DynamoDB actions and GraphQL API permissions from the function's CloudFormation template
      const { dynamoActions, graphqlApiPermissions } = await this.extractCfnPermissions(resourceName);

      resolved.push({
        resourceName,
        category,
        entry,
        deployedName,
        timeoutSeconds: config.Timeout,
        memoryMB: config.MemorySize,
        runtime,
        schedule,
        environment: Object.keys(envVars).length > 0 ? envVars : undefined,
        filteredEnvironmentVariables: filteredEnvVars,
        dynamoActions,
        graphqlApiPermissions,
      });
    }

    return resolved;
  }

  private buildCategoryMap(meta: Record<string, unknown>): Map<string, string> {
    const categoryMap = new Map<string, string>();
    const auth = meta.auth as Record<string, Record<string, unknown>> | undefined;
    const storage = meta.storage as Record<string, Record<string, unknown>> | undefined;
    const functions = meta.function as Record<string, Record<string, unknown>> | undefined;

    // Auth triggers (auth depends on function)
    if (auth) {
      for (const authResource of Object.values(auth)) {
        if (authResource.dependsOn) {
          for (const dep of authResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'function') {
              categoryMap.set(dep.resourceName, 'auth');
            }
          }
        }
      }
    }

    // Storage triggers (storage depends on function)
    if (storage) {
      for (const storageResource of Object.values(storage)) {
        if (storageResource.dependsOn) {
          for (const dep of storageResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'function') {
              categoryMap.set(dep.resourceName, 'storage');
            }
          }
        }
      }
    }

    // DynamoDB stream triggers (function depends on storage)
    if (functions) {
      for (const [funcName, funcResource] of Object.entries(functions)) {
        if (funcResource.dependsOn) {
          for (const dep of funcResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'storage') {
              categoryMap.set(funcName, 'storage');
            }
          }
        }
      }
    }

    return categoryMap;
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
   * Reads each function's package.json and merges dependencies into the root package.json.
   */
  private async mergeFunctionDependencies(resolvedFunctions: ResolvedFunction[]): Promise<void> {
    for (const func of resolvedFunctions) {
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
  }

  /**
   * Generates DynamoDB table grant statements for functions that access
   * AppSync-managed tables (detected via API_*TABLE_* env vars).
   */
  /**
   * Generates DynamoDB table grant statements for functions that access
   * AppSync-managed tables (detected via API_*TABLE_* env vars).
   */
  private contributeTableGrants(func: ResolvedFunction): void {
    if (func.dynamoActions.length === 0) return;

    const tableEnvVars = Object.keys(func.filteredEnvironmentVariables).filter((key) => key.startsWith('API_') && key.includes('TABLE_'));
    if (tableEnvVars.length === 0) return;

    // Extract unique table names from env vars
    const tableNames = new Set<string>();
    for (const envVar of tableEnvVars) {
      const tableName = extractTableName(envVar);
      if (tableName) tableNames.add(tableName);
    }

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
   * Generates GraphQL API grant statements for functions that have
   * AppSync mutation or query permissions.
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
  private async extractCfnPermissions(
    resourceName: string,
  ): Promise<{ dynamoActions: string[]; graphqlApiPermissions: { hasMutation: boolean; hasQuery: boolean } }> {
    const templatePath = `function/${resourceName}/${resourceName}-cloudformation-template.json`;
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
   * Generates grant statements for functions that access standalone
   * DynamoDB tables (STORAGE_ env vars). Uses the CDK construct
   * variable name (e.g. `activity`) rather than backend.data.resources.
   */
  private contributeStorageTableGrants(resolvedFunctions: ResolvedFunction[]): void {
    // Group functions by storage table, merging their DynamoDB actions
    const tableGrants = new Map<string, Map<string, string[]>>();

    for (const func of resolvedFunctions) {
      if (func.dynamoActions.length === 0) continue;

      const storageEnvVars = Object.keys(func.filteredEnvironmentVariables).filter(
        (key) => key.startsWith('STORAGE_') && !key.endsWith('BUCKETNAME'),
      );
      if (storageEnvVars.length === 0) continue;

      // Extract the table variable name from STORAGE_ env vars
      const tableNames = new Set<string>();
      for (const envVar of storageEnvVars) {
        const match = envVar.match(/STORAGE_(.+?)_(ARN|NAME|STREAMARN)$/);
        if (match) {
          tableNames.add(match[1].toLowerCase());
        }
      }

      for (const tableName of tableNames) {
        if (!tableGrants.has(tableName)) {
          tableGrants.set(tableName, new Map());
        }
        const funcMap = tableGrants.get(tableName)!;
        const existing = funcMap.get(func.resourceName) ?? [];
        const merged = [...new Set([...existing, ...func.dynamoActions])];
        funcMap.set(func.resourceName, merged);
      }
    }

    for (const [tableName, funcMap] of tableGrants) {
      for (const [funcName, actions] of funcMap) {
        const grantCall = factory.createExpressionStatement(
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
        this.backendGenerator.addStatement(grantCall);
      }
    }
  }

  /**
   * Detects functions that have DynamoDB stream triggers by reading
   * their CloudFormation templates for EventSourceMapping resources.
   */
  private async detectDynamoTriggers(
    resolvedFunctions: ResolvedFunction[],
  ): Promise<Array<{ readonly functionName: string; readonly models: string[] }>> {
    const triggers: Array<{ readonly functionName: string; readonly models: string[] }> = [];

    for (const func of resolvedFunctions) {
      const templatePath = `function/${func.resourceName}/${func.resourceName}-cloudformation-template.json`;
      const templateContent = await this.gen1App.readCloudBackendFile(templatePath);
      if (!templateContent) continue;

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

      if (models.length > 0) {
        triggers.push({ functionName: func.resourceName, models });
      }
    }

    return triggers;
  }

  /**
   * Generates DynamoDB stream event source code: a for-of loop that
   * adds DynamoEventSource to each triggered model's table.
   */
  private contributeDynamoTriggers(triggers: ReadonlyArray<{ readonly functionName: string; readonly models: string[] }>): void {
    this.backendGenerator.addImport('aws-cdk-lib/aws-lambda-event-sources', ['DynamoEventSource']);
    this.backendGenerator.addImport('aws-cdk-lib/aws-lambda', ['StartingPosition']);

    for (const trigger of triggers) {
      const forStatement = factory.createForOfStatement(
        undefined,
        factory.createVariableDeclarationList(
          [factory.createVariableDeclaration('model', undefined, undefined, undefined)],
          ts.NodeFlags.Const,
        ),
        factory.createArrayLiteralExpression(trigger.models.map((model) => factory.createStringLiteral(model))),
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
            // backend.functionName.resources.lambda.addEventSource(new DynamoEventSource(table, { startingPosition: StartingPosition.LATEST }))
            factory.createExpressionStatement(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(`backend.${trigger.functionName}.resources`),
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
                      factory.createIdentifier(`backend.${trigger.functionName}.resources.lambda`),
                      factory.createIdentifier('role'),
                    ),
                  ),
                ],
              ),
            ),
            // table.grantTableListStreams(backend.functionName.resources.lambda.role!)
            factory.createExpressionStatement(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('table'),
                  factory.createIdentifier('grantTableListStreams'),
                ),
                undefined,
                [
                  factory.createNonNullExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier(`backend.${trigger.functionName}.resources.lambda`),
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
}

/**
 * Extracts the file path from an AWS Lambda handler string.
 * 'index.handler' → './index.js', 'src/handler.myFunction' → './src/handler.js'
 */
function extractFilePathFromHandler(handler: string): string {
  const lastDotIndex = handler.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `./${handler}.js`;
  }
  return `./${handler.substring(0, lastDotIndex)}.js`;
}

/**
 * Filters environment variables that reference other Amplify resources.
 * Moves them from envVars to filteredEnvVars.
 *
 * Iterates by suffix first, then by env var, so the insertion order in
 * filteredEnvVars follows the suffix order — matching the old code's
 * behavior and the expected snapshot output.
 */
function filterResourceEnvVars(envVars: Record<string, string>, filteredEnvVars: Record<string, string>): void {
  const suffixGroups: ReadonlyArray<{ readonly prefix: string; readonly suffixes: readonly string[] }> = [
    { prefix: 'API_', suffixes: FILTERED_ENV_SUFFIXES },
    { prefix: 'STORAGE_', suffixes: STORAGE_ENV_SUFFIXES },
    { prefix: 'AUTH_', suffixes: AUTH_ENV_SUFFIXES },
  ];

  for (const { prefix, suffixes } of suffixGroups) {
    for (const suffix of suffixes) {
      for (const variable of Object.keys(envVars)) {
        if (variable.startsWith(prefix) && variable.endsWith(suffix)) {
          filteredEnvVars[variable] = envVars[variable];
          delete envVars[variable];
        }
      }
    }
  }
}

/**
 * Generates escape hatch statements for Lambda function environment variables.
 * Creates backend.functionName.addEnvironment() calls for Gen1 env vars
 * that reference other Amplify resources.
 */
function generateLambdaEnvVars(functionName: string, envVars: Record<string, string>): ts.ExpressionStatement[] {
  const statements: ts.ExpressionStatement[] = [];

  for (const envVar of Object.keys(envVars)) {
    for (const [pattern, backendPath] of Object.entries(ENV_VAR_PATTERNS)) {
      if (!new RegExp(`^${pattern}$`).test(envVar)) continue;

      let resolvedPath = backendPath;
      let isDirect = false;

      // Extract table name from environment variable for DynamoDB resources
      if (resolvedPath.includes('{table}')) {
        const tableName = extractTableName(envVar);
        if (tableName) {
          resolvedPath = resolvedPath.replace('{table}', tableName);
          isDirect = envVar.startsWith('STORAGE_');
        }
      }

      // Extract function name from environment variable
      if (resolvedPath.includes('{function}')) {
        const funcMatch = envVar.match(/FUNCTION_(.+?)_NAME/);
        if (funcMatch) {
          resolvedPath = resolvedPath.replace('{function}', funcMatch[1].toLowerCase());
        }
      }

      const expression = isDirect ? buildDirectExpression(resolvedPath) : buildBackendExpression(resolvedPath);

      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
              factory.createIdentifier('addEnvironment'),
            ),
            undefined,
            [factory.createStringLiteral(envVar), expression],
          ),
        ),
      );
      break;
    }
  }

  return statements;
}

function extractTableName(envVar: string): string | undefined {
  if (envVar.startsWith('API_') && envVar.includes('TABLE_')) {
    const match = envVar.match(/API_.*_(.+?)TABLE_/);
    if (match) {
      const raw = match[1];
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  } else if (envVar.startsWith('STORAGE_')) {
    const storageMatch = envVar.match(/STORAGE_(.+?)TABLE_/);
    if (storageMatch) return storageMatch[1].toLowerCase();
    const fallbackMatch = envVar.match(/STORAGE_(.+?)_/);
    if (fallbackMatch) return fallbackMatch[1].toLowerCase();
  }
  return undefined;
}

function buildDirectExpression(pathStr: string): ts.Expression {
  const parts = pathStr.split('.');
  let expression: ts.Expression = factory.createIdentifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.endsWith('!')) {
      expression = factory.createNonNullExpression(
        factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
      );
    } else {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
    }
  }
  return expression;
}

function buildBackendExpression(pathStr: string): ts.Expression {
  const parts = ['backend', ...pathStr.split('.')];
  let expression: ts.Expression = factory.createIdentifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.endsWith('!')) {
      expression = factory.createNonNullExpression(
        factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
      );
    } else if (part.includes('[') && part.includes(']')) {
      const bracketMatch = part.match(/(.+?)\[(.+?)\](.*)/);
      if (bracketMatch) {
        const [, beforeBracket, insideBracket, afterBracket] = bracketMatch;
        expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(beforeBracket));
        expression = factory.createElementAccessExpression(expression, factory.createStringLiteral(insideBracket));
        if (afterBracket) {
          expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(afterBracket));
        }
      }
    } else {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
    }
  }
  return expression;
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
