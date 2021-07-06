import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { CustomResource } from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { authTriggerAssetFilePath } from '../constants';
import { AuthTriggerConnection, CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';

type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authTriggerConnections: AuthTriggerConnection[];
  permissions: AuthTriggerPermissions[];
}>;

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';

/**
 * CDK stack for custom auth resources
 */
export class CustomResourceAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CustomResourceAuthStackProps) {
    super(scope, id, props);
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;

    const env = new cdk.CfnParameter(this, 'env', {
      type: 'String',
    });

    const userpoolId = new cdk.CfnParameter(this, 'userpoolId', {
      type: 'String',
    });

    const userpoolArn = new cdk.CfnParameter(this, 'userpoolArn', {
      type: 'String',
    });

    // eslint-disable-next-line no-new
    new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
      expression: cdk.Fn.conditionEquals(env, 'NONE'),
    });

    props.authTriggerConnections.forEach(config => {
      const fnName = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}Name`, {
        type: 'String',
      });
      const fnArn = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}Arn`, {
        type: 'String',
      });
      createPermissionToInvokeLambda(this, fnName, userpoolArn, config);
      const permission = props.permissions.find(permission => config.triggerType === permission.trigger);
      if (permission !== undefined) {
        const roleArn = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}LambdaExecutionRole`, {
          type: 'String',
        });
        createPermissionsForAuthTrigger(this, fnName, roleArn, permission, userpoolArn);
      }
      config.lambdaFunctionArn = fnArn.valueAsString;
    });

    createCustomResource(this, props.authTriggerConnections, userpoolId);
  }

  /**
   * Generates a CFN template from the CDK stack
   */
  toCloudFormation(): Record<string, unknown> {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

/**
 * Creates nested auth trigger CFN template and writes it to the project directory
 */
export const generateNestedAuthTriggerTemplate = async (
  category: string,
  resourceName: string,
  request: CognitoStackOptions,
): Promise<void> => {
  const cfnFileName = 'auth-trigger-cloudformation-template.json';
  const targetDir = path.join(pathManager.getBackendDirPath(), category, resourceName, 'build');
  const authTriggerCfnFilePath = path.join(targetDir, cfnFileName);
  const { authTriggerConnections, permissions } = request;
  if (authTriggerConnections) {
    const cfnObject = await createCustomResourceforAuthTrigger(
      JSON.parse(authTriggerConnections),
      permissions!.map(i => JSONUtilities.parse(i)),
    );
    // create policy for auth trigger as auth doesnt depend on function to break circular dependency

    JSONUtilities.writeJson(authTriggerCfnFilePath, cfnObject);
  } else {
    // delete the custom stack template if the triggers aren't defined
    try {
      fs.unlinkSync(authTriggerCfnFilePath);
    } catch (err) {
      // if its not present do nothing
    }
  }
};

async function createCustomResourceforAuthTrigger(
  context: any,
  authTriggerConnections: AuthTriggerConnection[],
  permissions: AuthTriggerPermissions[],
) {
  const stack = new CustomResourceAuthStack(undefined as any, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authTriggerConnections: authTriggerConnections,
    permissions: permissions,
  });
  const cfn = stack.toCloudFormation();
  return cfn;
};

const createCustomResource = (stack: cdk.Stack, authTriggerConnections: AuthTriggerConnection[], userpoolId: cdk.CfnParameter): void => {
  const triggerCode = fs.readFileSync(authTriggerAssetFilePath, 'utf-8');
  const authTriggerFn = new lambda.Function(stack, 'authTriggerFn', {
    runtime: lambda.Runtime.NODEJS_14_X,
    code: lambda.Code.fromInline(triggerCode),
    handler: 'index.handler',
  });
  // reason to add iam::PassRole
  // AccessDeniedException: User: <IAM User> is not authorized to perform: iam:PassRole on resource: <auth trigger role>
  if (authTriggerFn.role) {
    authTriggerFn.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cognito-idp:DescribeUserPool', 'cognito-idp:DescribeUserPoolClient', 'cognito-idp:UpdateUserPool', 'iam:PassRole'],
        resources: ['*'],
      }),
    );
  }

  // The custom resource that uses the provider to supply value
  // Passing in a nonce parameter to ensure that the custom resource is triggered on every deployment
  // eslint-disable-next-line no-new
  new CustomResource(stack, 'CustomAuthTriggerResource', {
    serviceToken: authTriggerFn.functionArn,
    properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authTriggerConnections, nonce: uuid() },
    resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
  });
};

const createPermissionToInvokeLambda = (
  stack: cdk.Stack,
  fnName: cdk.CfnParameter,
  userpoolArn: cdk.CfnParameter,
  config: AuthTriggerConnection,
): void => {
  // eslint-disable-next-line no-new
  new lambda.CfnPermission(stack, `UserPool${config.triggerType}LambdaInvokePermission`, {
    action: 'lambda:InvokeFunction',
    functionName: fnName.valueAsString,
    principal: 'cognito-idp.amazonaws.com',
    sourceArn: userpoolArn.valueAsString,
  });
}

function createPermissionsForAuthTrigger(
  stack: cdk.Stack,
  fnName: cdk.CfnParameter,
  roleArn: cdk.CfnParameter,
  permissions: AuthTriggerPermissions,
  userpoolArn: cdk.CfnParameter,
) {
  const myRole = iam.Role.fromRoleArn(stack, 'LambdaExecutionRole', roleArn.valueAsString);
  new iam.Policy(stack, `${fnName}${permissions.trigger}${permissions.policyName}`, {
    policyName: permissions.policyName,
    statements: [
      new iam.PolicyStatement({
        effect: permissions.effect === iam.Effect.ALLOW ? iam.Effect.ALLOW : iam.Effect.DENY,
        actions: permissions.actions,
        resources: [userpoolArn.valueAsString],
      }),
    ],
    roles: [myRole],
  });
}
