import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  JSONUtilities,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProviderName } from '../constants';

// type information from input schema located at packages/amplify-category-api/resources/schemas/aPIGateway/APIGatewayCLIInputs.schema.json
type APIGatewayPermissionSetting = 'open' | 'private' | 'protected';
type APIGateway = {
  resourceName: string;
  params?: {
    paths?: Record<
      string,
      {
        name?: string;
        lambdaFunction?: string;
        permissions?: {
          settings?: APIGatewayPermissionSetting;
          auth?: CrudOperation[];
          guest?: CrudOperation[];
        };
      }
    >;
  };
};

type ApiGatewayAuthStackProps = Readonly<{
  description: string;
  stackName: string;
  apiGateways: APIGateway[];
  envName: string;
}>;

type ApiGatewayPolicyCreationState = {
  apiGateway: $TSAny;
  apiRef: cdk.CfnParameter;
  env: cdk.CfnParameter;
  envName: string;
  path: $TSAny;
  methods: $TSAny;
  roleCount: number;
  roleName: cdk.CfnParameter;
  policyDocSize: number;
  managedPolicy: iam.CfnManagedPolicy;
  namePrefix: string;
};

export const APIGW_AUTH_STACK_LOGICAL_ID = 'APIGatewayAuthStack';
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const MAX_MANAGED_POLICY_SIZE = 6_144;
const S3_UPLOAD_PATH = `${AmplifyCategories.API}/${APIGW_AUTH_STACK_LOGICAL_ID}.json`;
const AUTH_ROLE_NAME = 'authRoleName';
const UNAUTH_ROLE_NAME = 'unauthRoleName';

export class ApiGatewayAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiGatewayAuthStackProps) {
    super(scope, id, props);
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;

    const authRoleName = new cdk.CfnParameter(this, AUTH_ROLE_NAME, {
      type: 'String',
    });
    const unauthRoleName = new cdk.CfnParameter(this, UNAUTH_ROLE_NAME, {
      type: 'String',
    });
    const env = new cdk.CfnParameter(this, 'env', {
      type: 'String',
    });

    new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
      expression: cdk.Fn.conditionEquals(env, 'NONE'),
    });

    let authRoleCount = 0;
    let unauthRoleCount = 0;
    let authPolicyDocSize = 0;
    let unauthPolicyDocSize = 0;
    let authManagedPolicy: iam.CfnManagedPolicy;
    let unauthManagedPolicy: iam.CfnManagedPolicy;

    props.apiGateways.forEach(apiGateway => {
      const apiRef = new cdk.CfnParameter(this, apiGateway.resourceName, {
        type: 'String',
      });

      const state: ApiGatewayPolicyCreationState = {
        apiGateway,
        apiRef,
        envName: props.envName,
        env,
        path: null,
        methods: null,
        roleCount: 0,
        roleName: null,
        policyDocSize: 0,
        managedPolicy: null,
        namePrefix: '',
      };

      Object.keys(apiGateway.params.paths).forEach(pathName => {
        state.path = apiGateway.params.paths[pathName];
        state.path.name = pathName;

        if (Array.isArray(apiGateway?.params?.paths?.[pathName]?.permissions?.auth)) {
          state.methods = convertCrudOperationsToPermissions(apiGateway.params.paths[pathName].permissions.auth);
          state.roleCount = authRoleCount;
          state.roleName = authRoleName;
          state.policyDocSize = authPolicyDocSize;
          state.managedPolicy = authManagedPolicy;
          state.namePrefix = 'PolicyAPIGWAuth';
          this.createPoliciesFromResources(state);
          ({ roleCount: authRoleCount, policyDocSize: authPolicyDocSize, managedPolicy: authManagedPolicy } = state);
        }

        if (Array.isArray(apiGateway?.params?.paths?.[pathName]?.permissions?.guest)) {
          state.methods = convertCrudOperationsToPermissions(apiGateway.params.paths[pathName].permissions.guest);
          state.roleCount = unauthRoleCount;
          state.roleName = unauthRoleName;
          state.policyDocSize = unauthPolicyDocSize;
          state.managedPolicy = unauthManagedPolicy;
          state.namePrefix = 'PolicyAPIGWUnauth';
          this.createPoliciesFromResources(state);
          ({ roleCount: unauthRoleCount, policyDocSize: unauthPolicyDocSize, managedPolicy: unauthManagedPolicy } = state);
        }
      });
    });
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }

  private createPoliciesFromResources(options: ApiGatewayPolicyCreationState) {
    const { apiRef, env, roleName, path, methods, namePrefix, envName } = options;
    const apiPath = String(path.name).replace(/{[a-zA-Z0-9-]+}/g, '*');

    methods.forEach((method: string) => {
      const policySizeIncrease = computePolicySizeIncrease(envName.length, method.length, apiPath.length);

      options.policyDocSize += policySizeIncrease;
      // If a managed policy hasn't been created yet, or the maximum
      // managed policy size has been exceeded, then create a new policy.
      if (options.roleCount === 0 || options.policyDocSize > MAX_MANAGED_POLICY_SIZE) {
        // Initial size of 104 for version, statement, etc.
        options.policyDocSize = 104 + policySizeIncrease;
        ++options.roleCount;
        options.managedPolicy = createManagedPolicy(this, `${namePrefix}${options.roleCount}`, (roleName as unknown) as string);
      }

      options.managedPolicy.policyDocument.Statement[0].Resource.push(
        createApiResource(this.region, this.account, apiRef, env, method, appendToUrlPath(apiPath, '*')),
        createApiResource(this.region, this.account, apiRef, env, method, apiPath),
      );
    });
  }
}

function createManagedPolicy(stack: cdk.Stack, policyName: string, roleName: string): iam.CfnManagedPolicy {
  return new iam.CfnManagedPolicy(stack, policyName, {
    roles: [roleName],
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: ['execute-api:Invoke'], Resource: [] }],
    },
  });
}

function createApiResource(regionRef, accountRef, apiNameRef, envRef, method: string, apiPath: string) {
  return cdk.Fn.join('', [
    'arn:aws:execute-api:',
    regionRef,
    ':',
    accountRef,
    ':',
    apiNameRef,
    '/',
    (cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', envRef) as unknown) as string,
    method,
    apiPath,
  ]);
}

function computePolicySizeIncrease(stageLength: number, methodLength: number, pathLength: number): number {
  // example:
  //          1         2         3         4         5         6         7         8
  // 12345678901234567890123456789012345678901234567890123456789012345678901234567890
  // "arn:aws:execute-api:us-west-1:032500605820:hjrmfzed5l/dev/PATCH/bbb-p03/*",
  //
  // Each path + HTTP method increases the policy size by roughly:
  // - 2 * 64 chars for arn, wildcards, path separators, quotes and comma (region is calculated with 16 max length)
  // - 2 * the length of the stage length (amplify env name)
  // - 2 * the length of the method length
  // - 2 * the length of the path length

  return 2 * (64 + stageLength + methodLength + pathLength);
}

export async function consolidateApiGatewayPolicies(context: $TSContext, stackName: string): Promise<$TSObject> {
  const apiGateways = [];
  const meta = stateManager.getMeta();
  const envInfo = stateManager.getLocalEnvInfo();
  const apis: $TSObject = meta?.api ?? {};

  for (const [resourceName, resource] of Object.entries(apis)) {
    const cliInputs = await loadApiCliInputs(context, resourceName, resource);

    if (cliInputs) {
      const api = { ...resource, resourceName, params: cliInputs };
      apiGateways.push(api);
    }
  }

  try {
    const cfnPath = path.join(pathManager.getBackendDirPath(), AmplifyCategories.API, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);
    fs.unlinkSync(cfnPath);
  } catch {
    // ignore error
  }

  if (apiGateways.length === 0) {
    return { APIGatewayAuthURL: undefined };
  }

  return { APIGatewayAuthURL: createApiGatewayAuthResources(stackName, apiGateways, envInfo.envName) };
}

export enum CrudOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

function convertCrudOperationsToPermissions(crudOps: CrudOperation[]) {
  const opMap: Record<CrudOperation, string[]> = {
    [CrudOperation.CREATE]: ['/POST'],
    [CrudOperation.READ]: ['/GET'],
    [CrudOperation.UPDATE]: ['/PUT', '/PATCH'],
    [CrudOperation.DELETE]: ['/DELETE'],
  };
  const possibleMethods = Object.values(opMap).flat();
  const methods = crudOps.flatMap(op => opMap[op]);
  return possibleMethods.every(m => methods.includes(m)) ? ['/*'] : methods;
}

function createApiGatewayAuthResources(stackName: string, apiGateways: $TSAny, envName: string): string | undefined {
  const stack = new ApiGatewayAuthStack(undefined, 'Amplify', {
    description: 'API Gateway policy stack created using Amplify CLI',
    stackName,
    apiGateways,
    envName,
  });
  const cfn = stack.toCloudFormation();
  const { DeploymentBucketName } = stateManager.getMeta()?.providers?.[ProviderName] ?? {};
  const cfnPath = path.join(pathManager.getBackendDirPath(), AmplifyCategories.API, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);

  if (!cfn.Resources || Object.keys(cfn.Resources).length === 0) {
    return undefined;
  }

  JSONUtilities.writeJson(cfnPath, cfn);

  return `https://s3.amazonaws.com/${DeploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`;
}

export async function loadApiCliInputs(context: $TSContext, resourceName: string, resource: $TSObject): Promise<$TSObject | undefined> {
  if (resource.providerPlugin !== ProviderName || resource.service !== AmplifySupportedService.APIGW || resourceName === 'AdminQueries') {
    return undefined;
  }

  const projectRoot = pathManager.findProjectRoot();

  if (!stateManager.resourceInputsJsonExists(projectRoot, AmplifyCategories.API, resourceName)) {
    const deprecatedParamsFileName = 'api-params.json';
    const deprecatedParamsFilePath = path.join(
      pathManager.getResourceDirectoryPath(projectRoot, AmplifyCategories.API, resourceName),
      deprecatedParamsFileName,
    );

    if (fs.existsSync(deprecatedParamsFilePath)) {
      if (!stateManager.resourceInputsJsonExists(projectRoot, AmplifyCategories.API, resourceName)) {
        return {
          paths: await context.amplify.invokePluginMethod(
            context,
            AmplifyCategories.API,
            AmplifySupportedService.APIGW,
            'convertDeperecatedRestApiPaths',
            [deprecatedParamsFileName, deprecatedParamsFilePath, resourceName],
          ),
        };
      }
    }
  }

  return stateManager.getResourceInputsJson(projectRoot, AmplifyCategories.API, resourceName, { throwIfNotExist: false });
}

const appendToUrlPath = (path: string, postfix: string) => {
  return path.charAt(path.length - 1) === '/' ? `${path}${postfix}` : `${path}/${postfix}`;
};
