import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { $TSAny, $TSContext, $TSObject, AmplifyCategories, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import * as fs from 'fs';
import * as path from 'path';
import { ProviderName } from '../constants';

type ApiGatewayAuthStackProps = Readonly<{
  description: string;
  stackName: string;
  apiGateways: $TSAny[];
}>;

type ApiGatewayPolicyCreationState = {
  apiGateway: $TSAny;
  apiRef: cdk.CfnParameter;
  env: cdk.CfnParameter;
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
const S3_UPLOAD_PATH = path.join(AmplifyCategories.API, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);
const AUTH_ROLE_NAME = 'authRoleName';
const UNAUTH_ROLE_NAME = 'unauthRoleName';

class ApiGatewayAuthStack extends cdk.Stack {
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
    let authManagedPolicy;
    let unauthManagedPolicy;

    props.apiGateways.forEach(apiGateway => {
      const apiRef = new cdk.CfnParameter(this, apiGateway.resourceName, {
        type: 'String',
      });

      const state: ApiGatewayPolicyCreationState = {
        apiGateway,
        apiRef,
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

        if (Array.isArray(apiGateway?.params?.paths?.[pathName]?.permissions?.unauth)) {
          state.methods = convertCrudOperationsToPermissions(apiGateway.params.paths[pathName].permissions.unauth);
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
    const { apiGateway, apiRef, env, roleName, path, methods, namePrefix } = options;
    const policyResourceName = String(path.name).replace(/{[a-zA-Z0-9\-]+}/g, '*');

    methods.forEach(method => {
      const policySizeIncrease = computePolicySizeIncrease(method.length, policyResourceName.length, apiGateway.resourceName.length);

      options.policyDocSize += policySizeIncrease;
      // If a managed policy hasn't been created yet, or the maximum
      // managed policy size has been exceeded, then create a new policy.
      if (options.roleCount === 0 || options.policyDocSize > MAX_MANAGED_POLICY_SIZE) {
        // Initial size of 100 for version, statement, etc.
        options.policyDocSize = 100 + policySizeIncrease;
        ++options.roleCount;
        options.managedPolicy = createManagedPolicy(this, `${namePrefix}${options.roleCount}`, roleName as unknown as string);
      }

      options.managedPolicy.policyDocument.Statement[0].Resource.push(
        createApiResource(this.region, this.account, apiRef, env, method, `${policyResourceName}/*`),
        createApiResource(this.region, this.account, apiRef, env, method, policyResourceName),
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

function createApiResource(region, account, api, env, method, resourceName) {
  return cdk.Fn.join('', [
    'arn:aws:execute-api:',
    region,
    ':',
    account,
    ':',
    api,
    '/',
    cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', env) as unknown as string,
    method,
    resourceName,
  ]);
}

function computePolicySizeIncrease(methodLength: number, pathLength: number, nameLength: number): number {
  // Each path + HTTP method increases the policy size by roughly:
  // - 2 * ~190 for the resource boilerplate, etc. (Whitespace is not counted)
  // - 2 * the length of the HTTP method (ie /POST)
  // - 2 * the length of the policy resource name (ie /items)
  // - 2 * the length of the API resourceName
  return 380 + 2 * (methodLength + pathLength + nameLength);
}

export function consolidateApiGatewayPolicies(context: $TSContext, stackName: string): $TSObject {
  const apiGateways = [];
  const meta = stateManager.getMeta();
  const apis = meta?.api ?? {};

  try {
    const cfnPath = path.join(pathManager.getBackendDirPath(), AmplifyCategories.API, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);
    fs.unlinkSync(cfnPath);
  } catch {}

  Object.keys(apis).forEach(resourceName => {
    const resource = apis[resourceName];
    const cliInputs = loadApiCliInputs(resourceName, resource);

    if (!cliInputs) {
      return;
    }

    const api = { ...resource, resourceName, params: cliInputs };
    apiGateways.push(api);
  });

  if (apiGateways.length === 0) {
    return { APIGatewayAuthURL: undefined };
  }

  return { APIGatewayAuthURL: createApiGatewayAuthResources(context, stackName, apiGateways) };
}

enum CrudOperation {
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
  return crudOps.flatMap(op => opMap[op]);
}

function createApiGatewayAuthResources(context: $TSContext, stackName: string, apiGateways: $TSAny): string | undefined {
  const stack = new ApiGatewayAuthStack(undefined, 'Amplify', {
    description: 'API Gateway policy stack created using Amplify CLI',
    stackName,
    apiGateways,
  });
  const cfn = stack.toCloudFormation();
  const { amplify } = context;
  const { DeploymentBucketName } = amplify.getProjectMeta()?.providers?.[ProviderName] ?? {};
  const cfnPath = path.join(pathManager.getBackendDirPath(), AmplifyCategories.API, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);

  if (!cfn.Resources || Object.keys(cfn.Resources).length === 0) {
    return;
  }

  JSONUtilities.writeJson(cfnPath, cfn);

  return `https://s3.amazonaws.com/${DeploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`;
}

export function loadApiCliInputs(name: string, resource: $TSObject): $TSObject | undefined {
  if (resource.providerPlugin !== ProviderName || resource.service !== 'API Gateway' || name === 'AdminQueries') {
    return;
  }

  return stateManager.getResourceInputsJson(undefined, AmplifyCategories.API, name, { throwIfNotExist: false });
}
