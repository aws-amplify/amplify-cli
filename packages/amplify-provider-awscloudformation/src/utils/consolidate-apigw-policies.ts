import * as path from 'path';
import * as fs from 'fs-extra';
import { FeatureFlags } from 'amplify-cli-core';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { S3 } from '../aws-utils/aws-s3';
import { ProviderName } from '../constants';
import { getResourceDirPath } from '../resourceParams';

type ApiGatewayAuthStackProps = Readonly<{
  description: string;
  stackName: string;
  apiGateways: any[];
}>;

export const APIGW_AUTH_STACK_LOGICAL_ID = 'APIGatewayAuthStack';
const API_PARAMS_FILE = 'api-params.json';
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const MAX_MANAGED_POLICY_SIZE = 6_144;
const S3_UPLOAD_PATH = 'api/apiGwAuthStackTemplate.json';

export class ApiGatewayAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiGatewayAuthStackProps) {
    super(scope, id, props);
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;

    const authRoleName = new cdk.CfnParameter(this, 'authRoleName', {
      type: 'String',
    });
    const unauthRoleName = new cdk.CfnParameter(this, 'unauthRoleName', {
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

      if (apiGateway.params.privacy.auth) {
        apiGateway.params.paths.forEach(path => {
          const authMethods = path?.privacy?.auth ?? [];

          authMethods.forEach(method => {
            const policySizeIncrease = computePolicySizeIncrease(
              method.length,
              path.policyResourceName.length,
              apiGateway.resourceName.length,
            );

            authPolicyDocSize += policySizeIncrease;
            // If a managed policy hasn't been created yet, or the maximum
            // managed policy size has been exceeded, then create a new policy.
            if (authRoleCount === 0 || authPolicyDocSize > MAX_MANAGED_POLICY_SIZE) {
              // Initial size of 100 for version, statement, etc.
              authPolicyDocSize = 100 + policySizeIncrease;
              authRoleCount++;
              authManagedPolicy = createManagedPolicy(this, `PolicyAPIGWAuth${authRoleCount}`, (authRoleName as unknown) as string);
            }

            authManagedPolicy.policyDocument.Statement[0].Resource.push(
              createApiResource(this.region, this.account, apiRef, env, method, `${path.policyResourceName}/*`),
              createApiResource(this.region, this.account, apiRef, env, method, path.policyResourceName),
            );
          });
        });
      }

      if (apiGateway.params.privacy.unauth) {
        apiGateway.params.paths.forEach(path => {
          const authMethods = path?.privacy?.unauth ?? [];

          authMethods.forEach(method => {
            const policySizeIncrease = computePolicySizeIncrease(
              method.length,
              path.policyResourceName.length,
              apiGateway.resourceName.length,
            );

            unauthPolicyDocSize += policySizeIncrease;
            // If a managed policy hasn't been created yet, or the maximum
            // managed policy size has been exceeded, then create a new policy.
            if (unauthRoleCount === 0 || unauthPolicyDocSize > MAX_MANAGED_POLICY_SIZE) {
              // Initial size of 100 for version, statement, etc.
              unauthPolicyDocSize = 100 + policySizeIncrease;
              unauthRoleCount++;
              unauthManagedPolicy = createManagedPolicy(this, `PolicyAPIGWUnauth${unauthRoleCount}`, (unauthRoleName as unknown) as string);
            }

            unauthManagedPolicy.policyDocument.Statement[0].Resource.push(
              createApiResource(this.region, this.account, apiRef, env, method, `${path.policyResourceName}/*`),
              createApiResource(this.region, this.account, apiRef, env, method, path.policyResourceName),
            );
          });
        });
      }
    });
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

function createManagedPolicy(stack: cdk.Stack, policyName: string, roleName: string) {
  return new iam.CfnManagedPolicy(stack, policyName, {
    roles: [roleName],
    managedPolicyName: policyName,
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

export async function consolidateApiGatewayPolicies(context: any, stackName: string): Promise<object> {
  if (!FeatureFlags.getBoolean('restAPI.generateConsolidatedManagedPolicies')) {
    return {};
  }

  const apiGateways = [];
  const { amplifyMeta } = context.amplify.getProjectDetails();
  const apis = amplifyMeta?.api ?? {};

  Object.keys(apis).forEach(resourceName => {
    const resource = apis[resourceName];
    const apiParams = loadApiWithPrivacyParams(context, resourceName, resource);

    if (!apiParams) {
      return;
    }

    apiGateways.push({ ...resource, resourceName, params: apiParams });
  });

  if (apiGateways.length === 0) {
    return {};
  }

  return createApiGatewayAuthResources(context, stackName, apiGateways);
}

async function createApiGatewayAuthResources(context: any, stackName: string, apiGateways: any): Promise<object> {
  const stack = new ApiGatewayAuthStack(undefined, 'Amplify', {
    description: 'API Gateway policy stack created using Amplify CLI',
    stackName,
    apiGateways,
  });
  const cfn = stack.toCloudFormation();

  return {
    APIGatewayAuthURL: await uploadCfnToS3(context, S3_UPLOAD_PATH, cfn),
  };
}

async function uploadCfnToS3(context: any, cfnFile: string, cfnData: object): Promise<string> {
  const s3 = await S3.getInstance(context);
  const s3Params = {
    Body: JSON.stringify(cfnData, null, 2),
    Key: `amplify-cfn-templates/${cfnFile}`,
  };
  const projectBucket = await s3.uploadFile(s3Params);

  return `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${cfnFile}`;
}

export function loadApiWithPrivacyParams(context: object, name: string, resource: any): object | undefined {
  if (resource.providerPlugin !== ProviderName || resource.service !== 'API Gateway') {
    return;
  }

  const apiParamsPath = path.join(getResourceDirPath(context, 'api', name), API_PARAMS_FILE);
  const apiParams = JSON.parse(fs.readFileSync(apiParamsPath, 'utf8'));

  if (apiParams?.privacy?.auth === 0 && apiParams?.privacy?.unauth === 0) {
    return;
  }

  return apiParams;
}
