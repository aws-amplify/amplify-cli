"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomResourceForAuthTrigger = exports.generateNestedAuthTriggerTemplate = exports.CustomResourceAuthStack = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const cdk = __importStar(require("aws-cdk-lib"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const lodash_1 = __importDefault(require("lodash"));
const configure_sms_1 = require("./configure-sms");
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
class CustomResourceAuthStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, { ...props, synthesizer: new cdk.LegacyStackSynthesizer() });
        this.toCloudFormation = () => {
            const root = this.node.root;
            const assembly = root.synth();
            if (!this.nestedStackParent) {
                return assembly.getStackArtifact(this.artifactId).template;
            }
            const template = fs.readFileSync(path.join(assembly.directory, this.templateFile));
            return JSON.parse(template.toString('utf-8'));
        };
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
        props.authTriggerConnections.forEach((triggerConfig) => {
            const config = triggerConfig;
            const fnName = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}Name`, {
                type: 'String',
            });
            const fnArn = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}Arn`, {
                type: 'String',
            });
            createPermissionToInvokeLambda(this, fnName, userpoolArn, config);
            const roleArn = new cdk.CfnParameter(this, `function${config.lambdaFunctionName}LambdaExecutionRole`, {
                type: 'String',
            });
            config.lambdaFunctionArn = fnArn.valueAsString;
            if (!lodash_1.default.isEmpty(props.permissions)) {
                const lambdaPermission = props.permissions.find((permission) => config.triggerType === permission.trigger);
                if (!lodash_1.default.isEmpty(lambdaPermission)) {
                    createPermissionsForAuthTrigger(this, fnName, roleArn, lambdaPermission, userpoolArn);
                }
            }
        });
        createCustomResource(this, props.authTriggerConnections, userpoolId, userpoolArn, props.enableSnsRole);
    }
}
exports.CustomResourceAuthStack = CustomResourceAuthStack;
const generateNestedAuthTriggerTemplate = async (category, resourceName, request) => {
    const cfnFileName = 'auth-trigger-cloudformation-template.json';
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, resourceName, 'build');
    const authTriggerCfnFilePath = path.join(targetDir, cfnFileName);
    const { authTriggerConnections, permissions, useEnabledMfas } = request;
    const configureSMS = (0, configure_sms_1.configureSmsOption)(request);
    const enableSnsRole = !useEnabledMfas || configureSMS;
    if (!lodash_1.default.isEmpty(authTriggerConnections)) {
        const cfnObject = await (0, exports.createCustomResourceForAuthTrigger)(authTriggerConnections, !!enableSnsRole, permissions);
        amplify_cli_core_1.JSONUtilities.writeJson(authTriggerCfnFilePath, cfnObject);
    }
    else {
        try {
            fs.unlinkSync(authTriggerCfnFilePath);
        }
        catch (err) {
        }
    }
};
exports.generateNestedAuthTriggerTemplate = generateNestedAuthTriggerTemplate;
const createCustomResourceForAuthTrigger = async (authTriggerConnections, enableSnsRole, permissions) => {
    if (Array.isArray(authTriggerConnections) && authTriggerConnections.length) {
        const stack = new CustomResourceAuthStack(undefined, 'Amplify', {
            description: 'Custom Resource stack for Auth Trigger created using Amplify CLI',
            authTriggerConnections,
            enableSnsRole,
            permissions,
        });
        const cfn = stack.toCloudFormation();
        return cfn;
    }
    throw new amplify_cli_core_1.AmplifyFault('AuthCategoryFault', {
        message: `Auth Trigger Connections must have value when trigger are selected`,
    });
};
exports.createCustomResourceForAuthTrigger = createCustomResourceForAuthTrigger;
const createCustomResource = (stack, authTriggerConnections, userpoolId, userpoolArn, enableSnsRole) => {
    const triggerCode = fs.readFileSync(constants_1.authTriggerAssetFilePath, 'utf-8');
    const authTriggerFn = new lambda.Function(stack, 'authTriggerFn', {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromInline(triggerCode),
        handler: 'index.handler',
    });
    if (authTriggerFn.role) {
        authTriggerFn.role.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cognito-idp:DescribeUserPool', 'cognito-idp:UpdateUserPool'],
            resources: [userpoolArn.valueAsString],
        }));
        if (enableSnsRole) {
            const snsRoleArn = new cdk.CfnParameter(stack, 'snsRoleArn', {
                type: 'String',
            });
            authTriggerFn.role.addToPrincipalPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['iam:PassRole'],
                resources: [snsRoleArn.valueAsString],
            }));
        }
    }
    const customResource = new aws_cdk_lib_1.CustomResource(stack, 'CustomAuthTriggerResource', {
        serviceToken: authTriggerFn.functionArn,
        properties: { userpoolId: userpoolId.valueAsString, lambdaConfig: authTriggerConnections, nonce: (0, uuid_1.v4)() },
        resourceType: 'Custom::CustomAuthTriggerResourceOutputs',
    });
    customResource.node.addDependency(authTriggerFn);
};
const createPermissionToInvokeLambda = (stack, fnName, userpoolArn, config) => {
    new lambda.CfnPermission(stack, `UserPool${config.triggerType}LambdaInvokePermission`, {
        action: 'lambda:InvokeFunction',
        functionName: fnName.valueAsString,
        principal: 'cognito-idp.amazonaws.com',
        sourceArn: userpoolArn.valueAsString,
    });
};
const createPermissionsForAuthTrigger = (stack, fnName, roleArn, permissions, userpoolArn) => {
    const myRole = iam.Role.fromRoleArn(stack, 'LambdaExecutionRole', roleArn.valueAsString);
    return new iam.Policy(stack, `${fnName}${permissions.trigger}${permissions.policyName}`, {
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
};
//# sourceMappingURL=generate-auth-trigger-template.js.map