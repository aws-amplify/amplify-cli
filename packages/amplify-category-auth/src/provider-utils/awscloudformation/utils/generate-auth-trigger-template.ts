import * as path from 'path';
import * as fs from 'fs-extra';
import { $TSContext, $TSObject, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { AuthTriggerConnection } from '../service-walkthrough-types';
import { CustomResource, CustomResourceProps, RemovalPolicy } from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';

type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authLambdaConfig: any[];
  userpoolId: string;
}>;

export const APIGW_AUTH_STACK_LOGICAL_ID = 'APIGatewayAuthStack';
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

    new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
      expression: cdk.Fn.conditionEquals(env, 'NONE'),
    });

    props.authLambdaConfig.forEach(config => {
      const fnName = new cdk.CfnParameter(this, `${Object.values(config)[0]}Name`, {
        type: 'String',
      });
      const fnArn = new cdk.CfnParameter(this, `${Object.values(config)[0]}Arn`, {
        type: 'String',
      });
      config[Object.keys(config)[0]] = fnArn.valueAsString;
    });

    createCustomResource(this, props.authLambdaConfig, userpoolId);
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

export async function generateNestedAuthTriggerTemplate(context: $TSContext, category: string, request: $TSObject, cfnFilename: string) {
  const { authLambdaConfig, userpoolId } = request;
  const cfnObject = await createCustomResourceforAuthTrigger(context, JSON.parse(authLambdaConfig), userpoolId);
  const targetDir = path.join(pathManager.getBackendDirPath(), category, request.resourceName);
  JSONUtilities.writeJson(path.join(targetDir, `auth-trigger-cloudformation-template.json`), cfnObject);
}

async function createCustomResourceforAuthTrigger(context: any, authLambdaConfig: AuthTriggerConnection[], userpoolId: string) {
  const stack = new CustomResourceAuthStack(undefined as any, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authLambdaConfig: authLambdaConfig,
    userpoolId: userpoolId,
  });
  const cfn = stack.toCloudFormation();
  return cfn;
}

function createCustomResource(stack: cdk.Stack, authLambdaConfig: AuthTriggerConnection[], userpoolId: cdk.CfnParameter) {
  const authTriggerFn = new lambda.Function(stack, `authTriggerFn`, {
    runtime: lambda.Runtime.NODEJS_10_X,
    code: lambda.Code.fromInline(
      cdk.Fn.join('\n', [
        "const response = require('cfn-response');",
        "const aws = require('aws-sdk');",
        'let responseData = {};',
        'exports.handler = function(event, context) {',
        '  try {',
        '    let userPoolId = event.ResourceProperties.userPoolId;',
        '    let lambdaConfig = event.ResourceProperties.AuthLambdaConfig',
        '    let config = {}',
        '   lambdaConfig.foreach(lambda => {config[`${lambda.triggerKey}`] = lambdaConfig.fnName;})',
        '    let promises = [];',
        "    if (event.RequestType == 'Delete') {",
        '        const authParams = { UserPoolId: userPoolId, LambdaConfig: {}}',
        '        const cognitoclient = new AWS.CognitoIdentityServiceProvider(authParams);',
        '        promises.push(cognitoclient.updateUserPool(authParams).promise());',
        '        Promise.all(promises)',
        '         .then((res) => {',
        '            console.log("delete response data" + JSON.stringify(res));',
        '            response.send(event, context, response.SUCCESS, {});',
        '         });',
        '    }',
        "    if (event.RequestType == 'Update' || event.RequestType == 'Create') {",
        '        const authParams = { UserPoolId: userPoolId, LambdaConfig: lambdaConfig}',
        '        const cognitoclient = new AWS.CognitoIdentityServiceProvider(authParams);',
        '        promises.push(cognitoclient.updateUserPool(authParams).promise());',
        '        Promise.all(promises)',
        '         .then((res) => {',
        '            console.log("createORupdate" + res);',
        '            console.log("response data" + JSON.stringify(res));',
        '            response.send(event, context, response.SUCCESS, {});',
        '         });',
        '    }',
        '  } catch(err) {',
        '       console.log(err.stack);',
        '       responseData = {Error: err};',
        '       response.send(event, context, response.FAILED, responseData);',
        '       throw err;',
        '  }',
        '};',
      ]),
    ),
    handler: 'handler',
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
  const customResourceOutputs = new CustomResource(stack, 'CustomAuthTriggerResource', {
    serviceToken: authTriggerFn.functionArn,
    properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authLambdaConfig },
    resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // The result obtained from the output of custom resource
  const streamArn = customResourceOutputs.getAtt('LatestStreamArn').toString();
  console.log(streamArn);
}
