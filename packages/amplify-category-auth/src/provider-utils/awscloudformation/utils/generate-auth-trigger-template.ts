import * as path from 'path';
import * as fs from 'fs-extra';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { CustomResource } from 'aws-cdk-lib';
import { v4 as uuid } from 'uuid';
import { Construct } from 'constructs';
import { AuthTriggerConnection, CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import { authTriggerAssetFilePath } from '../constants';

type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authTriggerConnections: AuthTriggerConnection[];
}>;

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';

/**
 * CDK stack for custom auth resources
 */
export class CustomResourceAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomResourceAuthStackProps) {
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
      // eslint-disable-next-line no-param-reassign
      config.lambdaFunctionArn = fnArn.valueAsString;
    });

    createCustomResource(this, props.authTriggerConnections, userpoolId);
  }

  /**
   * Generates a CFN template from the CDK stack
   */
  toCloudFormation(): Record<string, unknown> {
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
  const { authTriggerConnections } = request;
  if (authTriggerConnections) {
    const cfnObject = await createCustomResourceForAuthTrigger(authTriggerConnections);
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

const createCustomResourceForAuthTrigger = (authTriggerConnections: AuthTriggerConnection[]): Record<string, unknown> => {
  const stack = new CustomResourceAuthStack(undefined as unknown as Construct, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authTriggerConnections,
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
};
