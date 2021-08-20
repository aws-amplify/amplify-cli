'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateNestedAuthTriggerTemplate = exports.CustomResourceAuthStack = void 0;
const path = __importStar(require('path'));
const fs = __importStar(require('fs-extra'));
const amplify_cli_core_1 = require('amplify-cli-core');
const iam = __importStar(require('@aws-cdk/aws-iam'));
const lambda = __importStar(require('@aws-cdk/aws-lambda'));
const cdk = __importStar(require('@aws-cdk/core'));
const prepare_app_1 = require('@aws-cdk/core/lib/private/prepare-app');
const core_1 = require('@aws-cdk/core');
const constants_1 = require('../constants');
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
class CustomResourceAuthStack extends cdk.Stack {
  constructor(scope, id, props) {
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
    prepare_app_1.prepareApp(this);
    return this._toCloudFormation();
  }
}
exports.CustomResourceAuthStack = CustomResourceAuthStack;
async function generateNestedAuthTriggerTemplate(category, request) {
  const cfnFileName = 'auth-trigger-cloudformation-template.json';
  const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, request.resourceName);
  const authTriggerCfnFilePath = path.join(targetDir, cfnFileName);
  const { authTriggerConnections } = request;
  if (authTriggerConnections) {
    const cfnObject = await createCustomResourceforAuthTrigger(JSON.parse(authTriggerConnections));
    amplify_cli_core_1.JSONUtilities.writeJson(authTriggerCfnFilePath, cfnObject);
  } else {
    try {
      fs.unlinkSync(authTriggerCfnFilePath);
    } catch (err) {}
  }
}
exports.generateNestedAuthTriggerTemplate = generateNestedAuthTriggerTemplate;
async function createCustomResourceforAuthTrigger(authTriggerConnections) {
  const stack = new CustomResourceAuthStack(undefined, 'Amplify', {
    description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
    authTriggerConnections: authTriggerConnections,
  });
  const cfn = stack.toCloudFormation();
  return cfn;
}
function createCustomResource(stack, authTriggerConnections, userpoolId) {
  const triggerCode = fs.readFileSync(constants_1.authTriggerAssetFilePath, 'utf-8');
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
  new core_1.CustomResource(stack, 'CustomAuthTriggerResource', {
    serviceToken: authTriggerFn.functionArn,
    properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authTriggerConnections },
    resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
  });
}
function createPermissionToInvokeLambda(stack, fnName, userpoolArn, config) {
  new lambda.CfnPermission(stack, `UserPool${config.triggerType}LambdaInvokePermission`, {
    action: 'lambda:InvokeFunction',
    functionName: fnName.valueAsString,
    principal: 'cognito-idp.amazonaws.com',
    sourceArn: userpoolArn.valueAsString,
  });
}
//# sourceMappingURL=generate-auth-trigger-template.js.map
