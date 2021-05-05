import * as path from 'path';
import * as fs from 'fs-extra';
import { $TSContext, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { AuthTriggerConnection, ServiceQuestionsResult } from '../service-walkthrough-types';
import { CustomResource } from '@aws-cdk/core';
import { authTriggerAssetFilePath } from '../constants';

type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authTriggerConnections: AuthTriggerConnection[];
}>;

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';

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
      config.lambdaFunctionArn = fnArn.valueAsString;
    });

    createCustomResource(this, props.authTriggerConnections, userpoolId);
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

export async function generateNestedAuthTriggerTemplate(context: $TSContext, category: string, request: ServiceQuestionsResult) {
  const cfnFileName = 'auth-trigger-cloudformation-template.json';
  const targetDir = path.join(pathManager.getBackendDirPath(), category, request.resourceName!);
  const authTriggerCfnFilePath = path.join(targetDir, cfnFileName);
  const { authTriggerConnections } = request;
  if (authTriggerConnections) {
    const cfnObject = await createCustomResourceforAuthTrigger(context, JSON.parse(authTriggerConnections));
    JSONUtilities.writeJson(authTriggerCfnFilePath, cfnObject);
  } else {
    // delete the custom stack template if the triggers arent defined
    try {
      fs.unlinkSync(authTriggerCfnFilePath);
    } catch (err) {
      // if its not present do nothing
    }
  }
}

async function createCustomResourceforAuthTrigger(context: any, authTriggerConnections: AuthTriggerConnection[]) {
  const stack = new CustomResourceAuthStack(undefined as any, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authTriggerConnections: authTriggerConnections,
  });
  const cfn = stack.toCloudFormation();
  return cfn;
}

function createCustomResource(stack: cdk.Stack, authTriggerConnections: AuthTriggerConnection[], userpoolId: cdk.CfnParameter) {
  const triggerCode = fs.readFileSync(authTriggerAssetFilePath, 'utf-8');
  const authTriggerFn = new lambda.Function(stack, 'authTriggerFn', {
    runtime: lambda.Runtime.NODEJS_12_X,
    code: lambda.Code.fromInline(triggerCode),
    handler: 'index.handler',
  });
  if (authTriggerFn.role) {
    authTriggerFn.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cognito-idp:DescribeUserPoolClient', 'cognito-idp:UpdateUserPool'],
        resources: ['*'],
      }),
    );
  }
  // The custom resource that uses the provider to supply value
  new CustomResource(stack, 'CustomAuthTriggerResource', {
    serviceToken: authTriggerFn.functionArn,
    properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authTriggerConnections },
    resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
  });
}

function createPermissionToInvokeLambda(
  stack: cdk.Stack,
  fnName: cdk.CfnParameter,
  userpoolArn: cdk.CfnParameter,
  config: AuthTriggerConnection,
) {
  new lambda.CfnPermission(stack, `UserPool${config.triggerType}LambdaInvokePermission`, {
    action: 'lambda:InvokeFunction',
    functionName: fnName.valueAsString,
    principal: 'cognito-idp.amazonaws.com',
    sourceArn: userpoolArn.valueAsString,
  });
}
