import * as fs from 'fs';
import * as path from 'path';
import { $TSAny, $TSContext, $TSObject, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { ProviderName } from '../constants';
import { getResourceDirPath } from '../resourceParams';

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
const API_PARAMS_FILE = 'api-params.json';
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const MAX_MANAGED_POLICY_SIZE = 6_144;
const S3_UPLOAD_PATH = `api/${APIGW_AUTH_STACK_LOGICAL_ID}.json`;
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
      if (!Array.isArray(apiGateway.params.paths)) {
        return;
      }

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

      apiGateway.params.paths.forEach(path => {
        state.path = path;

        if (apiGateway.params.privacy.auth) {
          state.methods = Array.isArray(path?.privacy?.auth) ? path.privacy.auth : [];
          state.roleCount = authRoleCount;
          state.roleName = authRoleName;
          state.policyDocSize = authPolicyDocSize;
          state.managedPolicy = authManagedPolicy;
          state.namePrefix = 'PolicyAPIGWAuth';
          this.createPoliciesFromResources(state);
          ({ roleCount: authRoleCount, policyDocSize: authPolicyDocSize, managedPolicy: authManagedPolicy } = state);
        }

        if (apiGateway.params.privacy.unauth) {
          state.methods = Array.isArray(path?.privacy?.unauth) ? path.privacy.unauth : [];
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

    methods.forEach(method => {
      const policySizeIncrease = computePolicySizeIncrease(method.length, path.policyResourceName.length, apiGateway.resourceName.length);

      options.policyDocSize += policySizeIncrease;
      // If a managed policy hasn't been created yet, or the maximum
      // managed policy size has been exceeded, then create a new policy.
      if (options.roleCount === 0 || options.policyDocSize > MAX_MANAGED_POLICY_SIZE) {
        // Initial size of 100 for version, statement, etc.
        options.policyDocSize = 100 + policySizeIncrease;
        options.roleCount++;
        options.managedPolicy = createManagedPolicy(this, `${namePrefix}${options.roleCount}`, (roleName as unknown) as string);
      }

      options.managedPolicy.policyDocument.Statement[0].Resource.push(
        createApiResource(this.region, this.account, apiRef, env, method, `${path.policyResourceName}/*`),
        createApiResource(this.region, this.account, apiRef, env, method, path.policyResourceName),
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
    (cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', env) as unknown) as string,
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
  const { amplifyMeta } = context.amplify.getProjectDetails();
  const apis = amplifyMeta?.api ?? {};

  try {
    const cfnPath = path.join(pathManager.getBackendDirPath(), 'api', `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);
    fs.unlinkSync(cfnPath);
  } catch {}

  Object.keys(apis).forEach(resourceName => {
    const resource = apis[resourceName];
    const apiParams = loadApiWithPrivacyParams(context, resourceName, resource);

    if (!apiParams) {
      return;
    }

    const api = { ...resource, resourceName, params: apiParams };
    updateExistingApiCfn(context, api);
    apiGateways.push(api);
  });

  if (apiGateways.length === 0) {
    return { APIGatewayAuthURL: undefined };
  }

  return { APIGatewayAuthURL: createApiGatewayAuthResources(context, stackName, apiGateways) };
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
  const cfnPath = path.join(pathManager.getBackendDirPath(), 'api', `${APIGW_AUTH_STACK_LOGICAL_ID}.json`);

  if (!cfn.Resources || Object.keys(cfn.Resources).length === 0) {
    return;
  }

  JSONUtilities.writeJson(cfnPath, cfn);

  return `https://s3.amazonaws.com/${DeploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`;
}

export function loadApiWithPrivacyParams(context: $TSContext, name: string, resource: any): object | undefined {
  if (resource.providerPlugin !== ProviderName || resource.service !== 'API Gateway' || name === 'AdminQueries') {
    return;
  }

  const apiParamsPath = path.join(getResourceDirPath(context, 'api', name), API_PARAMS_FILE);
  const apiParams: any = JSONUtilities.readJson(apiParamsPath, { throwIfNotExist: false }) ?? {};

  if (apiParams?.privacy?.auth === 0 && apiParams?.privacy?.unauth === 0) {
    return;
  }

  return apiParams;
}

function updateExistingApiCfn(context: $TSContext, api: $TSObject): void {
  const resourceName = api.resourceName || api.params.resourceName;
  const resourceDir = getResourceDirPath(context, 'api', resourceName);
  const cfnTemplate = path.join(resourceDir, `${resourceName}-cloudformation-template.json`);
  const paramsFile = path.join(resourceDir, 'parameters.json');
  const apiParamsFile = path.join(resourceDir, API_PARAMS_FILE);
  const cfn: any = JSONUtilities.readJson(cfnTemplate, { throwIfNotExist: false }) ?? {};
  const parameterJson = JSONUtilities.readJson(paramsFile, { throwIfNotExist: false }) ?? {};

  if (!cfn) {
    throw new Error(`CloudFormation template missing for REST API ${resourceName}`);
  }

  const parameters = cfn.Parameters ?? {};
  const resources = cfn.Resources ?? {};
  let modified = false;

  for (const parameterName in parameters) {
    if (parameterName === AUTH_ROLE_NAME || parameterName === UNAUTH_ROLE_NAME) {
      delete parameters[parameterName];
      modified = true;
    }
  }

  for (const parameterName in parameterJson as any) {
    if (parameterName === AUTH_ROLE_NAME || parameterName === UNAUTH_ROLE_NAME) {
      delete parameterJson[parameterName];
      modified = true;
    }
  }

  // eslint-disable-next-line guard-for-in
  for (const resourceName in resources) {
    const resource = resources[resourceName];

    if (resource.Type === 'AWS::IAM::Policy') {
      const roles = resource?.Properties?.Roles;

      if (Array.isArray(roles) && roles.length === 1) {
        const roleName = roles[0].Ref;

        if (roleName === AUTH_ROLE_NAME || roleName === UNAUTH_ROLE_NAME) {
          delete resources[resourceName];
          modified = true;
        }
      }
    } else if (resource.Type === 'AWS::ApiGateway::RestApi') {
      cfn.Outputs ??= {};

      // Ensure that th REST API's ID is an output of the stack.
      if (!cfn.Outputs.ApiId) {
        cfn.Outputs.ApiId = {
          Description: 'API ID (prefix of API URL)',
          Value: { Ref: resourceName },
        };
        modified = true;
      }
    }
  }

  if (Array.isArray(api.params.paths)) {
    api.params.paths.forEach(path => {
      if (!path.policyResourceName) {
        path.policyResourceName = String(path.name).replace(/{[a-zA-Z0-9\-]+}/g, '*');
        modified = true;
      }

      if (typeof path?.privacy?.auth === 'string') {
        path.privacy.auth = convertPermissionStringToCrud(path.privacy.auth);
        modified = true;
      }

      if (typeof path?.privacy?.unauth === 'string') {
        path.privacy.unauth = convertPermissionStringToCrud(path.privacy.unauth);
        modified = true;
      }
    });
  }

  if (modified) {
    JSONUtilities.writeJson(cfnTemplate, cfn);
    JSONUtilities.writeJson(paramsFile, parameterJson);
    JSONUtilities.writeJson(apiParamsFile, api.params);
  }
}

function convertPermissionStringToCrud(permissions: string): string[] {
  if (permissions === 'r') {
    return ['/GET'];
  } else if (permissions === 'rw') {
    return ['/POST', '/GET', '/PUT', '/PATCH', '/DELETE'];
  }

  return [];
}
