import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { AmplifyMigrationOperation } from '../../../_operation';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Generator } from '../../generator';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { FunctionRenderer, RenderDefineFunctionOptions } from './function.renderer';
import { RootPackageJsonGenerator } from '../root-package-json.generator';
import { extractFilePathFromHandler, propAccess } from '../../ts-factory-utils';
import { AuthPermissions, AuthTriggerEvent } from '../auth/auth.renderer';
import { AuthGenerator } from '../auth/auth.generator';
import { S3Generator } from '../storage/s3.generator';
import { Permission } from '../storage/s3.renderer';

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
  readonly environment?: Readonly<Record<string, string>>;
  readonly escapeHatches: readonly EnvVarEscapeHatch[];
  readonly dynamoActions: readonly string[];
  readonly kinesisActions: readonly string[];
  readonly graphqlApiPermissions: { readonly hasMutation: boolean; readonly hasQuery: boolean };
  readonly authAccess: AuthPermissions;
}

/**
 * Constructor options for FunctionGenerator.
 */
interface FunctionGeneratorOptions {
  readonly gen1App: Gen1App;
  readonly backendGenerator: BackendGenerator;
  readonly authGenerator: AuthGenerator | undefined;
  readonly s3Generator: S3Generator | undefined;
  readonly packageJsonGenerator: RootPackageJsonGenerator;
  readonly outputDir: string;
  readonly resourceName: string;
  readonly category: string;
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
  private readonly authGenerator: AuthGenerator | undefined;
  private readonly s3Generator: S3Generator | undefined;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resourceName: string;
  private readonly category: string;
  private readonly renderer: FunctionRenderer;

  public constructor(options: FunctionGeneratorOptions) {
    this.gen1App = options.gen1App;
    this.backendGenerator = options.backendGenerator;
    this.authGenerator = options.authGenerator;
    this.s3Generator = options.s3Generator;
    this.packageJsonGenerator = options.packageJsonGenerator;
    this.outputDir = options.outputDir;
    this.resourceName = options.resourceName;
    this.category = options.category;
    this.renderer = new FunctionRenderer(options.gen1App.appId, options.gen1App.envName);
  }

  /**
   * Resolves this function's config and returns a single operation
   * that generates resource.ts, copies source files, and contributes
   * all backend.ts statements (imports, overrides, grants, triggers).
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const func = await this.resolve();
    await this.mergeFunctionDependencies(func);
    const triggerModels = await this.detectDynamoTriggerModels(func);
    this.contributeAuthAccess(func);
    this.contributeAuthTrigger();
    await this.contributeStorageAccess(this.category);
    this.contributeStorageTrigger();

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => [`Generate amplify/${this.category}/${func.resourceName}/resource.ts`],
        execute: async () => {
          await this.generateResource(func);
          this.contributeOverrides(func);
          this.contributeGrants(func);
          if (triggerModels.length > 0) {
            this.contributeDynamoTrigger(func.resourceName, triggerModels);
          }
        },
      },
    ];
  }

  /**
   * Resolves this function's deployed config from AWS.
   */
  private async resolve(): Promise<ResolvedFunction> {
    const functionCategory = this.gen1App.meta('function');
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

    const runtime = config.Runtime;
    if (runtime && !runtime.startsWith('nodejs')) {
      throw new Error(`Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`);
    }

    const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
    const entry = extractFilePathFromHandler(config.Handler ?? 'index.js');

    // Classify environment variables: retained ones stay in defineFunction(),
    // escape hatches become addEnvironment() calls in backend.ts.
    const { retained, escapeHatches } = classifyEnvVars(config.Environment?.Variables ?? {});

    // Extract DynamoDB/Kinesis actions and GraphQL API permissions from the function's CloudFormation template
    const { dynamoActions, kinesisActions, graphqlApiPermissions, authAccess } = this.extractCfnPermissions();

    return {
      resourceName: this.resourceName,
      category: this.category,
      entry,
      deployedName,
      timeoutSeconds: config.Timeout,
      memoryMB: config.MemorySize,
      runtime,
      schedule,
      environment: Object.keys(retained).length > 0 ? retained : undefined,
      escapeHatches,
      dynamoActions,
      kinesisActions,
      graphqlApiPermissions,
      authAccess,
    };
  }

  /**
   * Generates resource.ts, copies source files, and registers the
   * function import + defineBackend property in backend.ts.
   */
  private async generateResource(func: ResolvedFunction): Promise<void> {
    const dirPath = path.join(this.outputDir, 'amplify', this.category, func.resourceName);
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
    await this.copyFunctionSource(func.resourceName, dirPath);

    this.backendGenerator.addImport(`./${this.category}/${func.resourceName}/resource`, [func.resourceName]);
    this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier(func.resourceName)));
  }

  /**
   * Contributes function name override and env var escape hatches to backend.ts.
   */
  private contributeOverrides(func: ResolvedFunction): void {
    this.backendGenerator.ensureBranchName();
    this.backendGenerator.addStatement(createFunctionNameOverride(func.resourceName));
    for (const hatch of func.escapeHatches) {
      this.backendGenerator.addStatement(createAddEnvironmentCall(func.resourceName, hatch));
    }
  }

  /**
   * Contributes DynamoDB table grants and GraphQL API grants to backend.ts.
   */
  private contributeGrants(func: ResolvedFunction): void {
    this.contributeTableGrants(func);
    this.contributeStorageTableGrants(func);
    this.contributeGraphqlApiGrants(func);
    this.contributeKinesisGrants(func);
  }

  /**
   * Parses Cognito auth access from the function's CFN template
   * and contributes it to the AuthGenerator.
   */
  private contributeAuthAccess(func: ResolvedFunction): void {
    if (!this.authGenerator) return;
    if (Object.keys(func.authAccess).length > 0) {
      this.authGenerator.addFunctionAuthAccess({ resourceName: this.resourceName, permissions: func.authAccess });
    }
  }

  private contributeAuthTrigger(): void {
    if (!this.authGenerator || this.category !== 'auth') return;
    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    if (!this.resourceName.startsWith(authResourceName)) return;
    const suffix = this.resourceName.slice(authResourceName.length);
    const event = TRIGGER_SUFFIX_TO_EVENT[suffix];
    if (event) {
      this.authGenerator.addTrigger({ event, resourceName: this.resourceName });
    }
  }

  /**
   * Parses S3 storage access from the function's CFN template
   * and contributes it to the S3Generator.
   */
  private async contributeStorageAccess(category: string): Promise<void> {
    if (!this.s3Generator) return;

    const S3_ACTION_TO_PERMISSION: Readonly<Record<string, Permission>> = {
      's3:GetObject': 'read',
      's3:PutObject': 'write',
      's3:DeleteObject': 'delete',
      's3:ListBucket': 'read',
    };

    const templatePath = `function/${this.resourceName}/${this.resourceName}-cloudformation-template.json`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);
    const policy = template.Resources?.AmplifyResourcesPolicy;
    if (!policy || policy.Type !== 'AWS::IAM::Policy') return;

    const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
    const permissions = new Set<Permission>();

    for (const stmt of Array.isArray(statements) ? statements : [statements]) {
      if (stmt.Effect !== 'Allow') continue;
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      for (const action of actions) {
        if (typeof action === 'string' && S3_ACTION_TO_PERMISSION[action]) {
          permissions.add(S3_ACTION_TO_PERMISSION[action]);
        }
      }
    }

    if (permissions.size > 0) {
      this.s3Generator.addFunctionStorageAccess(this.resourceName, category, Array.from(permissions));
    }
  }

  /**
   * Detects S3 trigger events from the storage CFN template and
   * contributes them to the S3Generator. Only runs when this
   * function's category is 'storage' (i.e., it's a storage trigger).
   */
  private contributeStorageTrigger(): void {
    if (!this.s3Generator || this.category !== 'storage') return;

    const storageCategory = this.gen1App.meta('storage');
    if (!storageCategory) return;

    const s3Entry = Object.entries(storageCategory).find(([, value]) => (value as Record<string, unknown>).service === 'S3');
    if (!s3Entry) return;

    const [storageName] = s3Entry;
    const templatePath = `storage/${storageName}/build/cloudformation-template.json`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);

    const lambdaConfigs = template?.Resources?.S3Bucket?.Properties?.NotificationConfiguration?.LambdaConfigurations ?? [];

    for (const config of lambdaConfigs) {
      const functionRef = config?.Function?.Ref as string | undefined;
      if (!functionRef || !functionRef.includes(this.resourceName)) continue;

      const event = config.Event as string | undefined;
      if (event?.includes('ObjectCreated')) {
        this.s3Generator.addTrigger('onUpload', this.resourceName);
      } else if (event?.includes('ObjectRemoved')) {
        this.s3Generator.addTrigger('onDelete', this.resourceName);
      }
    }
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
    } catch (e) {
      throw new Error(`Failed to copy source files for function '${this.resourceName}': ${e}`);
    }
  }

  /**
   * Reads this function's package.json and merges dependencies into the root package.json.
   */
  private async mergeFunctionDependencies(func: ResolvedFunction): Promise<void> {
    const packageJsonPath = path.join('amplify', 'backend', 'function', func.resourceName, 'src', 'package.json');
    try {
      const pkg = JSONUtilities.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
        packageJsonPath,
      );
      if (pkg?.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          this.packageJsonGenerator.addDependency(name, version);
        }
      }
      if (pkg?.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          this.packageJsonGenerator.addDevDependency(name, version);
        }
      }
    } catch (e) {
      throw new Error(`Failed to read package.json for function '${this.resourceName}': ${e}`);
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
   * Contributes addToRolePolicy statements for functions with Kinesis stream access.
   * Generates: backend.funcName.resources.lambda.addToRolePolicy(new aws_iam.PolicyStatement({...}))
   */
  private contributeKinesisGrants(func: ResolvedFunction): void {
    if (func.kinesisActions.length === 0) return;

    this.backendGenerator.addImport('aws-cdk-lib', ['aws_iam']);

    const lambdaRef = factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(func.resourceName)),
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
              factory.createArrayLiteralExpression(func.kinesisActions.map((action) => factory.createStringLiteral(action))),
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

    this.backendGenerator.addStatement(
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(lambdaRef, factory.createIdentifier('addToRolePolicy')),
          undefined,
          [policyStatement],
        ),
      ),
    );
  }

  /**
   * Reads the function's CloudFormation template from the cloud backend
   * and extracts DynamoDB IAM actions and GraphQL API permissions.
   */
  private extractCfnPermissions(): {
    dynamoActions: string[];
    kinesisActions: string[];
    graphqlApiPermissions: { hasMutation: boolean; hasQuery: boolean };
    authAccess: AuthPermissions;
  } {
    const templatePath = `function/${this.resourceName}/${this.resourceName}-cloudformation-template.json`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);
    const policy = template.Resources?.AmplifyResourcesPolicy;
    if (!policy || policy.Type !== 'AWS::IAM::Policy') {
      return { dynamoActions: [], kinesisActions: [], graphqlApiPermissions: { hasMutation: false, hasQuery: false }, authAccess: {} };
    }

    const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
    const dynamoActions: string[] = [];
    const kinesisActions: string[] = [];
    const cognitoActions: string[] = [];
    let hasMutation = false;
    let hasQuery = false;

    for (const stmt of statements) {
      const stmtActions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      for (const action of stmtActions) {
        if (typeof action !== 'string') continue;
        if (action.startsWith('dynamodb:')) dynamoActions.push(action);
        if (action.startsWith('kinesis:')) kinesisActions.push(action);
        if (action.startsWith('cognito-idp:')) {
          if (action === 'cognito-idp:AdminList*') {
            for (const a of ['cognito-idp:AdminListDevices', 'cognito-idp:AdminListGroupsForUser']) {
              if (!cognitoActions.includes(a)) cognitoActions.push(a);
            }
          } else if (action === 'cognito-idp:List*') {
            for (const a of ['cognito-idp:ListUsers', 'cognito-idp:ListUsersInGroup', 'cognito-idp:ListGroups']) {
              if (!cognitoActions.includes(a)) cognitoActions.push(a);
            }
          } else if (!cognitoActions.includes(action)) {
            cognitoActions.push(action);
          }
        }
      }

      const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
      for (const resource of resources) {
        const resourceStr = JSON.stringify(resource);
        if (resourceStr.includes('/types/Mutation/')) hasMutation = true;
        if (resourceStr.includes('/types/Query/')) hasQuery = true;
      }
    }

    const authAccess = resolveAuthAccess(cognitoActions);
    return { dynamoActions, kinesisActions, graphqlApiPermissions: { hasMutation, hasQuery }, authAccess };
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);
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
  return propAccess('backend', ...segments);
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
  return propAccess(varName, property);
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

// ── Auth access extraction from CFN policy ────────────────────────

const GROUPED_AUTH_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  manageUsers: [
    'cognito-idp:AdminConfirmSignUp',
    'cognito-idp:AdminCreateUser',
    'cognito-idp:AdminDeleteUser',
    'cognito-idp:AdminDeleteUserAttributes',
    'cognito-idp:AdminDisableUser',
    'cognito-idp:AdminEnableUser',
    'cognito-idp:AdminGetUser',
    'cognito-idp:AdminListGroupsForUser',
    'cognito-idp:AdminRespondToAuthChallenge',
    'cognito-idp:AdminSetUserMFAPreference',
    'cognito-idp:AdminSetUserSettings',
    'cognito-idp:AdminUpdateUserAttributes',
    'cognito-idp:AdminUserGlobalSignOut',
  ],
  manageGroupMembership: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRemoveUserFromGroup'],
  manageGroups: [
    'cognito-idp:GetGroup',
    'cognito-idp:ListGroups',
    'cognito-idp:CreateGroup',
    'cognito-idp:DeleteGroup',
    'cognito-idp:UpdateGroup',
  ],
  manageUserDevices: [
    'cognito-idp:AdminForgetDevice',
    'cognito-idp:AdminGetDevice',
    'cognito-idp:AdminListDevices',
    'cognito-idp:AdminUpdateDeviceStatus',
  ],
  managePasswordRecovery: ['cognito-idp:AdminResetUserPassword', 'cognito-idp:AdminSetUserPassword'],
};

const AUTH_ACTION_MAPPING: Readonly<Record<string, keyof AuthPermissions>> = {
  'cognito-idp:AdminAddUserToGroup': 'addUserToGroup',
  'cognito-idp:AdminCreateUser': 'createUser',
  'cognito-idp:AdminDeleteUser': 'deleteUser',
  'cognito-idp:AdminDeleteUserAttributes': 'deleteUserAttributes',
  'cognito-idp:AdminDisableUser': 'disableUser',
  'cognito-idp:AdminEnableUser': 'enableUser',
  'cognito-idp:AdminForgetDevice': 'forgetDevice',
  'cognito-idp:AdminGetDevice': 'getDevice',
  'cognito-idp:AdminGetUser': 'getUser',
  'cognito-idp:AdminListDevices': 'listDevices',
  'cognito-idp:AdminListGroupsForUser': 'listGroupsForUser',
  'cognito-idp:AdminRemoveUserFromGroup': 'removeUserFromGroup',
  'cognito-idp:AdminResetUserPassword': 'resetUserPassword',
  'cognito-idp:AdminSetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:AdminSetUserPassword': 'setUserPassword',
  'cognito-idp:AdminSetUserSettings': 'setUserSettings',
  'cognito-idp:AdminUpdateDeviceStatus': 'updateDeviceStatus',
  'cognito-idp:AdminUpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:ListUsers': 'listUsers',
  'cognito-idp:ListUsersInGroup': 'listUsersInGroup',
  'cognito-idp:ListGroups': 'listGroups',
  'cognito-idp:AdminConfirmSignUp': 'manageUsers',
  'cognito-idp:AdminRespondToAuthChallenge': 'manageUsers',
  'cognito-idp:AdminUserGlobalSignOut': 'manageUsers',
  'cognito-idp:AdminInitiateAuth': 'manageUsers',
  'cognito-idp:AdminUpdateAuthEventFeedback': 'manageUsers',
  'cognito-idp:ForgetDevice': 'forgetDevice',
  'cognito-idp:VerifyUserAttribute': 'updateUserAttributes',
  'cognito-idp:UpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:SetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:SetUserSettings': 'setUserSettings',
};

function resolveAuthAccess(cognitoActions: string[]): AuthPermissions {
  if (cognitoActions.length === 0) return {};
  const result: Record<string, boolean> = {};
  const covered = new Set<string>();

  for (const [group, required] of Object.entries(GROUPED_AUTH_PERMISSIONS)) {
    if (required.every((a) => cognitoActions.includes(a))) {
      result[group] = true;
      for (const a of required) covered.add(a);
    }
  }

  for (const action of cognitoActions) {
    if (!covered.has(action) && AUTH_ACTION_MAPPING[action]) {
      result[AUTH_ACTION_MAPPING[action]] = true;
    }
  }

  return result as AuthPermissions;
}

// ── Auth trigger suffix mapping ───────────────────────────────────

const TRIGGER_SUFFIX_TO_EVENT: Readonly<Record<string, AuthTriggerEvent>> = {
  PreSignup: 'preSignUp',
  CustomMessage: 'customMessage',
  UserMigration: 'userMigration',
  PostConfirmation: 'postConfirmation',
  PreAuthentication: 'preAuthentication',
  PostAuthentication: 'postAuthentication',
  PreTokenGeneration: 'preTokenGeneration',
  DefineAuthChallenge: 'defineAuthChallenge',
  CreateAuthChallenge: 'createAuthChallenge',
  VerifyAuthChallengeResponse: 'verifyAuthChallengeResponse',
};
