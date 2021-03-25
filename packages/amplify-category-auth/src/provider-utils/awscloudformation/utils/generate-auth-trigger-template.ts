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
import { Permission } from '@aws-cdk/aws-lambda';

type CustomResourceAuthStackProps = Readonly<{
  description: string;
  authLambdaConfig: AuthTriggerConnection[];
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

    props.authLambdaConfig.forEach(config => {
      const fnName = new cdk.CfnParameter(this, `function${config.fnName}Name`, {
        type: 'String',
      });
      const fnArn = new cdk.CfnParameter(this, `function${config.fnName}Arn`, {
        type: 'String',
      });
      createPermissionToInvokeLambda(this, fnName, userpoolArn, config);
      config.fnArn = fnArn.valueAsString;
    });

    createCustomResource(this, props.authLambdaConfig, userpoolId);
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

export async function generateNestedAuthTriggerTemplate(context: $TSContext, category: string, request: $TSObject) {
  const cfnFileName = 'auth-trigger-cloudformation-template.json';
  const targetDir = path.join(pathManager.getBackendDirPath(), category, request.resourceName);
  const authTriggerCfnFilePath = path.join(targetDir, cfnFileName);
  const { authLambdaConfig } = request;
  if (authLambdaConfig !== undefined && authLambdaConfig.length !== 0) {
    const cfnObject = await createCustomResourceforAuthTrigger(context, JSON.parse(authLambdaConfig));
    JSONUtilities.writeJson(authTriggerCfnFilePath, cfnObject);
  } else {
    // delete the custom stack template if the triggers arent defined
    if (fs.existsSync(authTriggerCfnFilePath)) {
      fs.unlinkSync(authTriggerCfnFilePath);
    }
  }
}

async function createCustomResourceforAuthTrigger(context: any, authLambdaConfig: AuthTriggerConnection[]) {
  const stack = new CustomResourceAuthStack(undefined as any, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authLambdaConfig: authLambdaConfig,
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
        '    let userPoolId = event.ResourceProperties.userpoolId;',
        '    let lambdaConfig = event.ResourceProperties.lambdaConfig',
        '    let config = {}',
        '   lambdaConfig.forEach(lambda => config[`${lambda.triggerKey}`] = lambda.fnArn)',
        '    let promises = [];',
        "    if (event.RequestType == 'Delete') {",
        '        const authParams = { UserPoolId: userPoolId, LambdaConfig: {}}',
        '        const cognitoclient = new aws.CognitoIdentityServiceProvider();',
        '        promises.push(cognitoclient.updateUserPool(authParams).promise());',
        '        Promise.all(promises)',
        '         .then((res) => {',
        '            console.log("delete response data" + JSON.stringify(res));',
        '            response.send(event, context, response.SUCCESS, {});',
        '         });',
        '    }',
        "    if (event.RequestType == 'Update' || event.RequestType == 'Create') {",
        '        const authParams = { UserPoolId: userPoolId, LambdaConfig: config}',
        '        const cognitoclient = new aws.CognitoIdentityServiceProvider();',
        '        promises.push(cognitoclient.updateUserPool(authParams).promise());',
        '        Promise.all(promises)',
        '         .then((res) => {',
        '            console.log("createORupdate" + res);',
        '            console.log("response data" + JSON.stringify(res));',
        '            response.send(event, context, response.SUCCESS, {res});',
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
  const customResourceOutputs = new CustomResource(stack, 'CustomAuthTriggerResource', {
    serviceToken: authTriggerFn.functionArn,
    properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authLambdaConfig },
    resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
    removalPolicy: RemovalPolicy.DESTROY,
  });
}

function createPermissionToInvokeLambda(
  stack: cdk.Stack,
  fnName: cdk.CfnParameter,
  userpoolArn: cdk.CfnParameter,
  config: AuthTriggerConnection,
) {
  return new lambda.CfnPermission(stack, `UserPool${config.triggerKey}LambdaInvokePermission`, {
    action: 'lambda:InvokeFunction',
    functionName: fnName.valueAsString,
    principal: 'cognito-idp.amazonaws.com',
    sourceArn: userpoolArn.valueAsString,
  });
}
