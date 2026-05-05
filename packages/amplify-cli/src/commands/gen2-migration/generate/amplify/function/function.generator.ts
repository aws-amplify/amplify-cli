import path from 'node:path';
import fs from 'node:fs/promises';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { AmplifyError, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { FunctionRenderer, FunctionRenderOptions, classifyEnvVars, DynamicEnvVar } from './function.renderer';
import { RootPackageJsonGenerator } from '../../package.json.generator';
import { AuthPermissions } from '../auth/auth.renderer';
import { AuthGenerator } from '../auth/auth.generator';
import { S3Generator } from '../storage/s3.generator';
import { Permission } from '../storage/s3.renderer';
import { DEFINE_ANALYTICS_VARIABLE_NAME } from '../analytics/kinesis.generator';
import { SINGULAR_AUTH_PERMISSIONS, GROUPED_AUTH_PERMISSIONS, AUTH_TRIGGER_SUFFIX_TO_EVENT } from './auth-mappings';
import { SpinningLogger } from '../../../_common/spinning-logger';

interface FunctionGeneratorOptions {
  readonly gen1App: Gen1App;
  readonly backendGenerator: BackendGenerator;
  readonly packageJsonGenerator: RootPackageJsonGenerator;
  readonly outputDir: string;
  readonly resource: DiscoveredResource;
  readonly logger: SpinningLogger;
}

export class FunctionGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private authGenerator: AuthGenerator | undefined;
  private s3Generator: S3Generator | undefined;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer: FunctionRenderer;
  private readonly logger: SpinningLogger;

  public constructor(options: FunctionGeneratorOptions) {
    this.gen1App = options.gen1App;
    this.backendGenerator = options.backendGenerator;
    this.packageJsonGenerator = options.packageJsonGenerator;
    this.outputDir = options.outputDir;
    this.resource = options.resource;
    this.renderer = new FunctionRenderer(options.gen1App.appId, options.gen1App.envName);
    this.logger = options.logger;
  }

  public setAuthGenerator(authGenerator: AuthGenerator): void {
    this.authGenerator = authGenerator;
  }
  public setS3Generator(s3Generator: S3Generator): void {
    this.s3Generator = s3Generator;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const resourceName = this.resource.resourceName;
    const deployedName = this.gen1App.resourceMetaOutput(this.resource, 'Name');

    this.logger.debug(`Fetching Lambda function config '${deployedName}'`);
    const config = await this.gen1App.aws.fetchFunctionConfig(deployedName);
    if (!config)
      throw new AmplifyError('LambdaFunctionNotFoundError', {
        message: `Lambda function '${deployedName}' not found`,
        resolution: 'Verify the Lambda function exists and the CLI has the correct AWS credentials and region configured.',
      });

    const runtime = config.Runtime;
    if (runtime && !runtime.startsWith('nodejs')) {
      throw new AmplifyError('UnsupportedRuntimeError', {
        message: `Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`,
        resolution: 'Migrate the function to a Node.js runtime before running the Gen 2 migration.',
      });
    }

    this.logger.debug(`Fetching Lambda function schedule '${deployedName}'`);
    const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
    const entry = TS.extractFilePathFromHandler(config.Handler ?? 'index.js');
    const { literalEnvVars, dynamicEnvVars } = classifyEnvVars(config.Environment?.Variables ?? {});

    const dynamoActions = this.extractDynamoActions();
    const kinesisActions = this.extractKinesisActions();
    const appSyncPermissions = this.extractAppSyncPermissions();
    const { authAccess, unMappedAuthActions } = this.extractAuthPermissions();

    const dataTriggerModels = this.detectDataTriggerModels();
    const storageTriggerTables = this.detectDynamoTriggerTables();
    const isKinesisTrigger = this.isKinesisTrigger();

    const hasAnalytics = kinesisActions.length > 0 || isKinesisTrigger;

    const renderOpts: FunctionRenderOptions = {
      resourceName,
      entry,
      name: deployedName,
      timeoutSeconds: config.Timeout,
      memoryMB: config.MemorySize,
      runtime,
      schedule,
      literalEnvVars,
      dynamicEnvVars,
      dynamoActions,
      appSyncPermissions,
      dataTriggerModels,
      storageTriggerTables,
      unMappedAuthActions,
      kinesisConfig: hasAnalytics
        ? {
            resourceName: this.gen1App.singleResourceName('analytics', 'Kinesis'),
            actions: kinesisActions,
            isTrigger: isKinesisTrigger,
          }
        : undefined,
    };

    this.contributeDependencies();
    this.contributeAuthAccess(authAccess);
    this.contributeAuthTrigger();
    this.contributeStorageAccess();
    this.contributeStorageTrigger();

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/function/${resourceName}/resource.ts`],
        execute: async () => {
          const dirPath = path.join(this.outputDir, 'amplify', 'function', resourceName);

          this.logger.info(`Rendering function/${resourceName}/resource.ts`);
          const nodes = this.renderer.render(renderOpts);
          const content = TS.printNodes(nodes);

          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(path.join(dirPath, 'resource.ts'), content, 'utf-8');
          await this.copyFunctionSource(resourceName, dirPath);

          const alias = resourceName;
          this.backendGenerator.addNamespaceImport(alias, `./function/${resourceName}/resource`);
          this.backendGenerator.addDefineBackendEntry(resourceName, alias, resourceName);

          const escapeHatchArgs = this.deriveApplyEscapeHatchArguments(hasAnalytics, dynamicEnvVars);
          this.backendGenerator.addApplyEscapeHatchesCall({ alias, extraArgs: escapeHatchArgs });
        },
      },
    ];
  }

  private contributeAuthAccess(authAccess: AuthPermissions): void {
    if (!this.authGenerator) return;
    if (Object.keys(authAccess).length > 0) {
      this.authGenerator.addFunctionAuthAccess({ resourceName: this.resource.resourceName, permissions: authAccess });
    }
  }

  private contributeAuthTrigger(): void {
    if (!this.authGenerator) return;
    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    if (!this.resource.resourceName.startsWith(authResourceName)) return;
    const suffix = this.resource.resourceName.slice(authResourceName.length);
    const event = AUTH_TRIGGER_SUFFIX_TO_EVENT[suffix];
    if (event) this.authGenerator.addTrigger({ event, resourceName: this.resource.resourceName });
  }

  private contributeStorageAccess(): void {
    if (!this.s3Generator) return;
    const S3_ACTION_TO_PERMISSION: Readonly<Record<string, Permission>> = {
      's3:GetObject': 'read',
      's3:PutObject': 'write',
      's3:DeleteObject': 'delete',
      's3:ListBucket': 'read',
    };
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
    const template = this.gen1App.json(templatePath);
    const policy = template.Resources?.AmplifyResourcesPolicy;
    if (!policy || policy.Type !== 'AWS::IAM::Policy') return;
    const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
    const permissions = new Set<Permission>();
    for (const statement of Array.isArray(statements) ? statements : [statements]) {
      if (statement.Effect !== 'Allow') continue;
      const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      for (const action of actions) {
        if (typeof action === 'string' && S3_ACTION_TO_PERMISSION[action]) permissions.add(S3_ACTION_TO_PERMISSION[action]);
      }
    }
    if (permissions.size > 0) this.s3Generator.addFunctionAccess(this.resource.resourceName, Array.from(permissions));
  }

  private contributeStorageTrigger(): void {
    if (!this.s3Generator) return;
    const storageCategory = this.gen1App.categoryMeta('storage');
    if (!storageCategory) return;
    const s3Entry = Object.entries(storageCategory).find(([, v]) => (v as Record<string, unknown>).service === 'S3');
    if (!s3Entry) return;
    const [storageName] = s3Entry;
    const templatePath = `storage/${storageName}/build/cloudformation-template.json`;
    const template = this.gen1App.json(templatePath);
    const lambdaConfigs = template?.Resources?.S3Bucket?.Properties?.NotificationConfiguration?.LambdaConfigurations ?? [];
    for (const config of lambdaConfigs) {
      const functionRef = config?.Function?.Ref as string | undefined;
      if (!functionRef || !functionRef.includes(this.resource.resourceName)) continue;
      const event = config.Event as string | undefined;
      if (event?.includes('ObjectCreated')) this.s3Generator.addTrigger('onUpload', this.resource.resourceName);
      else if (event?.includes('ObjectRemoved')) this.s3Generator.addTrigger('onDelete', this.resource.resourceName);
    }
  }

  private async copyFunctionSource(resourceName: string, destDir: string): Promise<void> {
    const srcDir = path.join('amplify', 'backend', 'function', resourceName, 'src');
    await fs.cp(srcDir, destDir, {
      recursive: true,
      filter: (src) => {
        const b = path.basename(src);
        return (
          b !== 'node_modules' &&
          b !== '.yarn' &&
          b !== 'package.json' &&
          b !== 'package-lock.json' &&
          b !== 'yarn.lock' &&
          b !== 'pnpm-lock.yaml'
        );
      },
    });
  }

  private contributeDependencies(): void {
    const packageJsonPath = path.join('amplify', 'backend', 'function', this.resource.resourceName, 'src', 'package.json');
    const pkg = JSONUtilities.readJson<Record<string, string>>(packageJsonPath, { throwIfNotExist: false });
    if (pkg?.dependencies) {
      for (const [n, v] of Object.entries(pkg.dependencies)) this.packageJsonGenerator.addDependency(n, v);
    }
    if (pkg?.devDependencies) {
      for (const [n, v] of Object.entries(pkg.devDependencies)) this.packageJsonGenerator.addDevDependency(n, v);
    }
  }

  private deriveApplyEscapeHatchArguments(hasAnalytics: boolean, dynamicEnvVars: readonly DynamicEnvVar[]): string[] {
    const args: string[] = [];
    for (const dynamicEnvVar of dynamicEnvVars) {
      if (!dynamicEnvVar.name.startsWith('STORAGE_') || dynamicEnvVar.name.endsWith('BUCKETNAME')) continue;
      const match = dynamicEnvVar.name.match(/STORAGE_(.+?)_(ARN|NAME|STREAMARN)$/);
      if (match) args.push(match[1].toLowerCase());
    }
    if (hasAnalytics) {
      args.push(DEFINE_ANALYTICS_VARIABLE_NAME);
    }
    return Array.from(new Set(args));
  }

  private detectDataTriggerModels(): string[] {
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
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
      if (match) models.push(match[1]);
    }
    return models;
  }

  /**
   * Detects storage DynamoDB table triggers by parsing this function's
   * CloudFormation template for EventSourceMapping resources that reference
   * storage table stream ARNs via `Ref: storage<tableName>StreamArn`.
   */
  private detectDynamoTriggerTables(): string[] {
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);
    const tables: string[] = [];

    for (const resource of Object.values(template.Resources)) {
      const res = resource as Record<string, unknown>;
      if (res.Type !== 'AWS::Lambda::EventSourceMapping') continue;

      const props = res.Properties as Record<string, unknown>;
      const eventSourceArn = props.EventSourceArn as Record<string, string>;
      if (!('Ref' in eventSourceArn)) continue;

      const match = eventSourceArn.Ref.match(/^storage(\w+)StreamArn$/);
      if (match) {
        tables.push(match[1]);
      }
    }

    return tables;
  }

  private isKinesisTrigger(): boolean {
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
    const template = this.gen1App.json(templatePath);
    for (const resource of Object.values(template.Resources ?? {})) {
      const res = resource as Record<string, unknown>;
      if (res.Type !== 'AWS::Lambda::EventSourceMapping') continue;
      const props = res.Properties as Record<string, unknown> | undefined;
      const eventSourceArn = props?.EventSourceArn as Record<string, string> | undefined;
      if (!eventSourceArn || !('Ref' in eventSourceArn)) continue;
      if (/^analytics\w+kinesisStreamArn$/.test(eventSourceArn.Ref)) return true;
    }
    return false;
  }

  /** Reads the AmplifyResourcesPolicy statements from this function's CloudFormation template. */
  private readPolicyStatements(): unknown[] {
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
    const template = this.gen1App.json(templatePath);
    const policy = template.Resources?.AmplifyResourcesPolicy;
    if (!policy || policy.Type !== 'AWS::IAM::Policy') return [];
    return policy.Properties?.PolicyDocument?.Statement ?? [];
  }

  /** Extracts DynamoDB actions from the function's IAM policy. */
  private extractDynamoActions(): string[] {
    const actions: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation policy statements
    for (const statement of this.readPolicyStatements() as any[]) {
      const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      for (const action of statementActions) {
        if (typeof action === 'string' && action.startsWith('dynamodb:')) actions.push(action);
      }
    }
    return actions;
  }

  /** Extracts unique Kinesis actions from the function's IAM policy. */
  private extractKinesisActions(): string[] {
    const actions: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation policy statements
    for (const statement of this.readPolicyStatements() as any[]) {
      const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      for (const action of statementActions) {
        if (typeof action === 'string' && action.startsWith('kinesis:') && !actions.includes(action)) actions.push(action);
      }
    }
    return actions;
  }

  /** Extracts GraphQL mutation/query permissions from the function's IAM policy resource ARNs. */
  private extractAppSyncPermissions(): { hasMutation: boolean; hasQuery: boolean } {
    let hasMutation = false;
    let hasQuery = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation policy statements
    for (const statement of this.readPolicyStatements() as any[]) {
      const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
      for (const resource of resources) {
        const resourceStr = JSON.stringify(resource);
        if (resourceStr.includes('/types/Mutation/')) hasMutation = true;
        if (resourceStr.includes('/types/Query/')) hasQuery = true;
      }
    }
    return { hasMutation, hasQuery };
  }

  /**
   * Extracts auth (Cognito) permissions from both the function's own IAM policy
   * and the auth-trigger CFN template (for auth trigger functions).
   */
  private extractAuthPermissions(): { authAccess: AuthPermissions; unMappedAuthActions: string[] } {
    const cognitoActions: string[] = [];
    const otherAuthActions: string[] = [];

    // From the function's own template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation policy statements
    for (const statement of this.readPolicyStatements() as any[]) {
      const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      const statementResources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
      const targetsUserPool =
        JSON.stringify(statementResources).includes('userpool/') || JSON.stringify(statementResources).includes('UserPool');

      for (const action of statementActions) {
        if (typeof action !== 'string') continue;
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
        } else if (targetsUserPool && !otherAuthActions.includes(action)) {
          otherAuthActions.push(action);
        }
      }
    }

    // From the auth-trigger template (for auth trigger functions only)
    const authCategory = this.gen1App.categoryMeta('auth');
    if (authCategory) {
      const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
      const templatePath = `auth/${authResourceName}/build/auth-trigger-cloudformation-template.json`;
      if (this.gen1App.fileExists(templatePath)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
        const template = this.gen1App.json(templatePath);
        const resources = template.Resources ?? {};
        for (const [logicalId, resource] of Object.entries(resources)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation resource
          const res = resource as any;
          if (res.Type !== 'AWS::IAM::Policy') continue;
          if (!logicalId.includes(this.resource.resourceName)) continue;
          const statements = res.Properties?.PolicyDocument?.Statement ?? [];
          for (const statement of statements) {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            for (const action of actions) {
              if (typeof action === 'string' && action.startsWith('cognito-idp:') && !cognitoActions.includes(action)) {
                cognitoActions.push(action);
              }
            }
          }
        }
      }
    }

    const { permissions: authAccess, unMapped } = resolveAuthAccess(cognitoActions);
    return { authAccess, unMappedAuthActions: [...unMapped, ...otherAuthActions] };
  }
}

function resolveAuthAccess(cognitoActions: string[]): { permissions: AuthPermissions; unMapped: string[] } {
  if (cognitoActions.length === 0) return { permissions: {}, unMapped: [] };
  const result: Record<string, boolean> = {};
  const covered = new Set<string>();
  for (const [group, required] of Object.entries(GROUPED_AUTH_PERMISSIONS)) {
    if (required.every((a) => cognitoActions.includes(a))) {
      result[group] = true;
      for (const a of required) covered.add(a);
    }
  }
  for (const action of cognitoActions) {
    if (covered.has(action)) continue;
    if (SINGULAR_AUTH_PERMISSIONS[action]) {
      result[SINGULAR_AUTH_PERMISSIONS[action]] = true;
      covered.add(action);
    }
  }

  const unMapped = cognitoActions.filter((a) => !covered.has(a));
  return { permissions: result as AuthPermissions, unMapped: unMapped };
}
