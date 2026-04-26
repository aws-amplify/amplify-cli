import path from 'node:path';
import fs from 'node:fs/promises';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_infra/planner';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { FunctionRenderer, RenderCompleteFunctionOptions, EnvVarEscapeHatch, classifyEnvVars } from './function.renderer';
import { RootPackageJsonGenerator } from '../../package.json.generator';
import { AuthPermissions, AuthTriggerEvent } from '../auth/auth.renderer';
import { AuthGenerator } from '../auth/auth.generator';
import { S3Generator } from '../storage/s3.generator';
import { Permission } from '../storage/s3.renderer';

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
  readonly unMappedAuthActions: readonly string[];
}

interface FunctionGeneratorOptions {
  readonly gen1App: Gen1App;
  readonly backendGenerator: BackendGenerator;
  readonly packageJsonGenerator: RootPackageJsonGenerator;
  readonly outputDir: string;
  readonly resource: DiscoveredResource;
  readonly category: string;
}

export class FunctionGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private authGenerator: AuthGenerator | undefined;
  private s3Generator: S3Generator | undefined;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly category: string;
  private readonly renderer: FunctionRenderer;

  public constructor(options: FunctionGeneratorOptions) {
    this.gen1App = options.gen1App;
    this.backendGenerator = options.backendGenerator;
    this.packageJsonGenerator = options.packageJsonGenerator;
    this.outputDir = options.outputDir;
    this.resource = options.resource;
    this.category = options.category;
    this.renderer = new FunctionRenderer(options.gen1App.appId, options.gen1App.envName);
  }

  public setAuthGenerator(authGenerator: AuthGenerator): void {
    this.authGenerator = authGenerator;
  }
  public setS3Generator(s3Generator: S3Generator): void {
    this.s3Generator = s3Generator;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const func = await this.resolve();
    await this.mergeFunctionDependencies(func);
    const triggerModels = await this.detectDynamoTriggerModels(func);
    const storageTriggerTables = this.detectStorageDynamoTriggers(func);
    const hasKinesisTrigger = this.detectKinesisTrigger(func);
    this.contributeAuthAccess(func);
    this.contributeAuthTrigger();
    await this.contributeStorageAccess();
    this.contributeStorageTrigger();

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/${this.category}/${func.resourceName}/resource.ts`],
        execute: async () => {
          await this.generateResource(func, triggerModels, storageTriggerTables, hasKinesisTrigger);
        },
      },
    ];
  }

  private async resolve(): Promise<ResolvedFunction> {
    const deployedName = this.gen1App.resourceMetaOutput(this.resource, 'Name');

    const config = await this.gen1App.aws.fetchFunctionConfig(deployedName);
    if (!config) throw new Error(`Lambda function '${deployedName}' not found`);

    const runtime = config.Runtime;
    if (runtime && !runtime.startsWith('nodejs')) {
      throw new Error(`Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`);
    }

    const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
    const entry = TS.extractFilePathFromHandler(config.Handler ?? 'index.js');
    const { retained, escapeHatches } = classifyEnvVars(config.Environment?.Variables ?? {});

    // Extract DynamoDB/Kinesis actions and GraphQL API permissions from the function's CloudFormation template
    const {
      dynamoActions,
      kinesisActions,
      graphqlApiPermissions,
      authAccess: cfnAuthAccess,
      unMappedAuthActions: cfnUnMapped,
    } = this.extractCfnPermissions();

    // For auth trigger functions, also extract permissions from the auth-trigger CFN template.
    const { permissions: triggerAuthAccess, unMapped: triggerUnMapped } = this.extractAuthTriggerCfnPermissions();
    const authAccess = { ...cfnAuthAccess, ...triggerAuthAccess };
    const unMappedAuthActions = [...new Set([...cfnUnMapped, ...triggerUnMapped])];

    return {
      resourceName: this.resource.resourceName,
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
      unMappedAuthActions: unMappedAuthActions,
    };
  }

  private async generateResource(
    func: ResolvedFunction,
    triggerModels: string[],
    storageTriggerTables: string[],
    hasKinesisTrigger: boolean,
  ): Promise<void> {
    const dirPath = path.join(this.outputDir, 'amplify', 'function', func.resourceName);

    const hasAnalytics = func.kinesisActions.length > 0 || hasKinesisTrigger;
    let analyticsTypeImport: string | undefined;
    let analyticsConstructImportPath: string | undefined;
    if (hasAnalytics) {
      analyticsTypeImport = this.findAnalyticsConstructType();
      analyticsConstructImportPath = this.getAnalyticsConstructImportPath();
    }

    const renderOpts: RenderCompleteFunctionOptions = {
      resourceName: func.resourceName,
      entry: func.entry,
      name: func.deployedName,
      timeoutSeconds: func.timeoutSeconds,
      memoryMB: func.memoryMB,
      runtime: func.runtime,
      schedule: func.schedule,
      environment: func.environment,
      escapeHatches: func.escapeHatches,
      dynamoActions: func.dynamoActions,
      kinesisActions: func.kinesisActions,
      graphqlApiPermissions: func.graphqlApiPermissions,
      triggerModels,
      hasKinesisTrigger,
      hasAnalytics: hasAnalytics && !!analyticsTypeImport,
      analyticsConstructType: analyticsTypeImport,
      analyticsConstructImportPath,
      unMappedAuthActions: func.unMappedAuthActions,
      storageTriggerTables,
    };

    const nodes = this.renderer.render(renderOpts);
    const content = TS.printNodes(nodes);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, 'resource.ts'), content, 'utf-8');
    await this.copyFunctionSource(func.resourceName, dirPath);

    const alias = func.resourceName;
    this.backendGenerator.addNamespaceImport(alias, `./function/${func.resourceName}/resource`);
    this.backendGenerator.addDefineBackendEntry(func.resourceName, alias, func.resourceName);

    // Collect storage table names referenced in the function body (from env vars and triggers).
    const storageTableArgs = new Set<string>();
    for (const hatch of func.escapeHatches) {
      if (!hatch.name.startsWith('STORAGE_') || hatch.name.endsWith('BUCKETNAME')) continue;
      const match = hatch.name.match(/STORAGE_(.+?)_(ARN|NAME|STREAMARN)$/);
      if (match) storageTableArgs.add(match[1].toLowerCase());
    }
    for (const t of storageTriggerTables) storageTableArgs.add(t);

    const extraArgs: string[] = [...storageTableArgs];
    if (hasAnalytics && analyticsTypeImport) {
      extraArgs.push('analyticsResult');
    }
    this.backendGenerator.addApplyEscapeHatchesCall({ alias, extraArgs });
  }

  private findAnalyticsConstructType(): string | undefined {
    const cat = this.gen1App.categoryMeta('analytics');
    if (!cat) return undefined;
    for (const [name] of Object.entries(cat)) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return undefined;
  }

  private getAnalyticsConstructImportPath(): string | undefined {
    const cat = this.gen1App.categoryMeta('analytics');
    if (!cat) return undefined;
    for (const [name] of Object.entries(cat)) {
      return `../../analytics/${name}-construct`.toLowerCase();
    }
    return undefined;
  }

  private contributeAuthAccess(func: ResolvedFunction): void {
    if (!this.authGenerator) return;
    if (Object.keys(func.authAccess).length > 0) {
      this.authGenerator.addFunctionAuthAccess({ resourceName: this.resource.resourceName, permissions: func.authAccess });
    }
  }

  private contributeAuthTrigger(): void {
    if (!this.authGenerator || this.category !== 'auth') return;
    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    if (!this.resource.resourceName.startsWith(authResourceName)) return;
    const suffix = this.resource.resourceName.slice(authResourceName.length);
    const event = TRIGGER_SUFFIX_TO_EVENT[suffix];
    if (event) this.authGenerator.addTrigger({ event, resourceName: this.resource.resourceName });
  }

  private async contributeStorageAccess(): Promise<void> {
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
    if (!this.s3Generator || this.category !== 'storage') return;
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
    try {
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
    } catch (e) {
      throw new Error(`Failed to copy source files for function '${this.resource.resourceName}': ${e}`);
    }
  }

  private async mergeFunctionDependencies(func: ResolvedFunction): Promise<void> {
    const packageJsonPath = path.join('amplify', 'backend', 'function', func.resourceName, 'src', 'package.json');
    try {
      const pkg = JSONUtilities.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
        packageJsonPath,
      );
      if (pkg?.dependencies) {
        for (const [n, v] of Object.entries(pkg.dependencies)) this.packageJsonGenerator.addDependency(n, v);
      }
      if (pkg?.devDependencies) {
        for (const [n, v] of Object.entries(pkg.devDependencies)) this.packageJsonGenerator.addDevDependency(n, v);
      }
    } catch (e) {
      throw new Error(`Failed to read package.json for function '${this.resource.resourceName}': ${e}`);
    }
  }

  private async detectDynamoTriggerModels(func: ResolvedFunction): Promise<string[]> {
    const templatePath = `function/${func.resourceName}/${func.resourceName}-cloudformation-template.json`;
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
  private detectStorageDynamoTriggers(func: ResolvedFunction): string[] {
    const templatePath = `function/${func.resourceName}/${func.resourceName}-cloudformation-template.json`;
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

  private detectKinesisTrigger(func: ResolvedFunction): boolean {
    const templatePath = `function/${func.resourceName}/${func.resourceName}-cloudformation-template.json`;
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

  private extractCfnPermissions(): {
    dynamoActions: string[];
    kinesisActions: string[];
    graphqlApiPermissions: { hasMutation: boolean; hasQuery: boolean };
    authAccess: AuthPermissions;
    unMappedAuthActions: string[];
  } {
    const templatePath = `function/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`;
    const template = this.gen1App.json(templatePath);
    const policy = template.Resources?.AmplifyResourcesPolicy;
    if (!policy || policy.Type !== 'AWS::IAM::Policy') {
      return {
        dynamoActions: [],
        kinesisActions: [],
        graphqlApiPermissions: { hasMutation: false, hasQuery: false },
        authAccess: {},
        unMappedAuthActions: [],
      };
    }
    const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
    const dynamoActions: string[] = [];
    const kinesisActions: string[] = [];
    const cognitoActions: string[] = [];
    const otherAuthActions: string[] = [];
    let hasMutation = false;
    let hasQuery = false;
    for (const statement of statements) {
      const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      const statementResources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
      const targetsUserPool =
        JSON.stringify(statementResources).includes('userpool/') || JSON.stringify(statementResources).includes('UserPool');

      for (const action of statementActions) {
        if (typeof action !== 'string') continue;
        if (action.startsWith('dynamodb:')) dynamoActions.push(action);
        else if (action.startsWith('kinesis:') && !kinesisActions.includes(action)) kinesisActions.push(action);
        else if (action.startsWith('cognito-idp:')) {
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
      const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
      for (const resource of resources) {
        const resourceStr = JSON.stringify(resource);
        if (resourceStr.includes('/types/Mutation/')) hasMutation = true;
        if (resourceStr.includes('/types/Query/')) hasQuery = true;
      }
    }

    const { permissions: authAccess, unMapped: unMappedAuthActions } = resolveAuthAccess(cognitoActions);
    return {
      dynamoActions,
      kinesisActions,
      graphqlApiPermissions: { hasMutation, hasQuery },
      authAccess,
      unMappedAuthActions: [...unMappedAuthActions, ...otherAuthActions],
    };
  }

  /**
   * Extracts auth permissions from the auth-trigger CFN template for auth trigger functions.
   *
   * Gen1 auth trigger IAM permissions live in a separate nested stack
   * (`auth-trigger-cloudformation-template.json`), not in the function's own template.
   * This method reads that template and extracts cognito-idp actions from IAM policies
   * that reference this function.
   */
  private extractAuthTriggerCfnPermissions(): { permissions: AuthPermissions; unMapped: string[] } {
    if (this.category !== 'auth') return { permissions: {}, unMapped: [] };

    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    const templatePath = `auth/${authResourceName}/build/auth-trigger-cloudformation-template.json`;
    if (!this.gen1App.fileExists(templatePath)) return { permissions: {}, unMapped: [] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
    const template = this.gen1App.json(templatePath);
    const resources = template.Resources ?? {};
    const cognitoActions: string[] = [];

    for (const [logicalId, resource] of Object.entries(resources)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation resource
      const res = resource as any;
      if (res.Type !== 'AWS::IAM::Policy') continue;
      // Match policies whose logical ID contains this function's resource name.
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

    return resolveAuthAccess(cognitoActions);
  }
}

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
    if (AUTH_ACTION_MAPPING[action]) {
      result[AUTH_ACTION_MAPPING[action]] = true;
      covered.add(action);
    }
  }

  const unMapped = cognitoActions.filter((a) => !covered.has(a));
  return { permissions: result as AuthPermissions, unMapped: unMapped };
}

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
