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
exports.AmplifyAuthTransform = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const cdk = __importStar(require("aws-cdk-lib"));
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const vm = __importStar(require("vm2"));
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const configure_sms_1 = require("../utils/configure-sms");
const generate_auth_trigger_template_1 = require("../utils/generate-auth-trigger-template");
const synthesize_resources_1 = require("../utils/synthesize-resources");
const auth_cognito_stack_builder_1 = require("./auth-cognito-stack-builder");
const stack_synthesizer_1 = require("./stack-synthesizer");
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
class AmplifyAuthTransform extends amplify_cli_core_1.AmplifyCategoryTransform {
    constructor(resourceName) {
        super(resourceName);
        this.applyOverride = async () => {
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const overrideDir = path.join(backendDir, this._category, this.resourceName);
            const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, overrideDir);
            if (isBuild) {
                const overrideCode = await fs.readFile(path.join(overrideDir, 'build', 'override.js'), 'utf-8').catch(() => {
                    amplify_prompts_1.formatter.list(['No override File Found', `To override ${this.resourceName} run amplify override auth`]);
                    return '';
                });
                const sandboxNode = new vm.NodeVM({
                    console: 'inherit',
                    timeout: 5000,
                    sandbox: {},
                    require: {
                        context: 'sandbox',
                        builtin: ['path'],
                        external: true,
                    },
                });
                const projectInfo = (0, cli_extensibility_helper_1.getProjectInfo)();
                try {
                    await sandboxNode
                        .run(overrideCode, path.join(overrideDir, 'build', 'override.js'))
                        .override(this._authTemplateObj, projectInfo);
                }
                catch (err) {
                    throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                        message: `Executing overrides failed.`,
                        details: err.message,
                        resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
                    }, err);
                }
            }
        };
        this.generateStackProps = async (context) => {
            var _a;
            const roles = {
                authRoleArn: {
                    'Fn::GetAtt': ['AuthRole', 'Arn'],
                },
                unauthRoleArn: {
                    'Fn::GetAtt': ['UnauthRole', 'Arn'],
                },
            };
            let cognitoStackProps = {
                ...this._cliInputs.cognitoConfig,
                ...roles,
                breakCircularDependency: amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakcirculardependency'),
                useEnabledMfas: amplify_cli_core_1.FeatureFlags.getBoolean('auth.useenabledmfas'),
                dependsOn: [],
            };
            const teamProviderObj = context.amplify.loadEnvResourceParameters(context, this._category, this.resourceName);
            if (!lodash_1.default.isEmpty(teamProviderObj)) {
                cognitoStackProps = Object.assign(cognitoStackProps, teamProviderObj);
            }
            if (!lodash_1.default.isEmpty(this._cliInputs.cognitoConfig.triggers)) {
                const permissions = await context.amplify.getTriggerPermissions(context, this._cliInputs.cognitoConfig.triggers, amplify_cli_core_1.AmplifyCategories.AUTH, this._cliInputs.cognitoConfig.resourceName);
                const triggerPermissions = permissions === null || permissions === void 0 ? void 0 : permissions.map((i) => JSON.parse(i));
                const dependsOnKeys = Object.keys((_a = this._cliInputs.cognitoConfig.triggers) !== null && _a !== void 0 ? _a : {}).map((i) => `${this._cliInputs.cognitoConfig.resourceName}${i}`);
                const dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
                const keys = Object.keys(this._cliInputs.cognitoConfig.triggers);
                const authTriggerConnections = [];
                keys.forEach((key) => {
                    const config = {
                        triggerType: key === 'PreSignup' ? 'PreSignUp' : key,
                        lambdaFunctionName: `${this.resourceName}${key}`,
                    };
                    authTriggerConnections.push(config);
                });
                cognitoStackProps = Object.assign(cognitoStackProps, { permissions: triggerPermissions, dependsOn, authTriggerConnections });
            }
            return cognitoStackProps;
        };
        this.synthesizeTemplates = async () => {
            this._app.synth();
            const templates = this._synthesizer.collectStacks();
            return templates.get('AmplifyAuthCongitoStack');
        };
        this.saveBuildFiles = async (context, template) => {
            const cognitoStackFileName = `${this.resourceName}-cloudformation-template.json`;
            const cognitoStackFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this.resourceName, 'build', cognitoStackFileName);
            await (0, amplify_cli_core_1.writeCFNTemplate)(template, cognitoStackFilePath, {
                templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            });
            await this.writeBuildFiles(context);
        };
        this.writeBuildFiles = async (context) => {
            const parametersJSONFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this.resourceName, 'build', 'parameters.json');
            const oldParameters = fs.readJSONSync(parametersJSONFilePath, { throws: false });
            const roles = {
                authRoleArn: {
                    'Fn::GetAtt': ['AuthRole', 'Arn'],
                },
                unauthRoleArn: {
                    'Fn::GetAtt': ['UnauthRole', 'Arn'],
                },
            };
            let parameters = {
                ...this._cliInputs.cognitoConfig,
                ...roles,
                breakCircularDependency: this._cognitoStackProps.breakCircularDependency,
                useEnabledMfas: this._cognitoStackProps.useEnabledMfas,
                dependsOn: [],
            };
            if (this._cognitoStackProps.triggers && !lodash_1.default.isEmpty(this._cognitoStackProps.triggers)) {
                this._cognitoStackProps.triggers = JSON.stringify(this._cognitoStackProps.triggers);
                const triggerPermissions = this._cognitoStackProps.permissions.map((i) => JSON.stringify(i));
                const { dependsOn } = this._cognitoStackProps;
                const authTriggerConnections = this._cognitoStackProps.authTriggerConnections.map((obj) => {
                    const modifiedObj = lodash_1.default.omit(obj, ['lambdaFunctionArn']);
                    return JSON.stringify(modifiedObj);
                });
                parameters = Object.assign(parameters, {
                    permissions: triggerPermissions,
                    triggers: this._cognitoStackProps.triggers,
                    dependsOn,
                    authTriggerConnections,
                });
            }
            else if (lodash_1.default.isEmpty(this._cognitoStackProps.triggers)) {
                parameters = Object.assign(parameters, { triggers: JSON.stringify(this._cognitoStackProps.triggers) });
            }
            this.validateCfnParameters(context, oldParameters, parameters);
            amplify_cli_core_1.JSONUtilities.writeJson(parametersJSONFilePath, parameters);
        };
        this.generateCfnOutputs = (props) => {
            const configureSMS = (0, configure_sms_1.configureSmsOption)(props);
            if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections === 'identityPoolOnly') {
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('IdentityPool'),
                    description: 'Id for the identity pool',
                }, 'IdentityPoolId');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.getAtt('IdentityPool', 'Name').toString(),
                }, 'IdentityPoolName');
            }
            if (props.hostedUIDomainName) {
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.join('-', [cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.ref('env')])).toString(),
                }, 'HostedUIDomain');
            }
            if (props.oAuthMetadata) {
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('oAuthMetadata'),
                }, 'OAuthMetadata');
            }
            if (props.authSelections !== 'identityPoolOnly') {
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('UserPool'),
                    description: 'Id for the user pool',
                }, 'UserPoolId');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.getAtt('UserPool', 'Arn').toString(),
                    description: 'Arn for the user pool',
                }, 'UserPoolArn');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('userPoolName'),
                }, 'UserPoolName');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('UserPoolClientWeb'),
                    description: 'The user pool app client id for web',
                }, 'AppClientIDWeb');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.ref('UserPoolClient'),
                    description: 'The user pool app client id',
                }, 'AppClientID');
                this._authTemplateObj.addCfnOutput({
                    value: cdk.Fn.getAtt('UserPoolClientInputs', 'appSecret').toString(),
                    condition: this._authTemplateObj.getCfnCondition('ShouldOutputAppClientSecrets'),
                }, 'AppClientSecret');
                if (!props.useEnabledMfas || configureSMS) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.getAtt('SNSRole', 'Arn').toString(),
                        description: 'role arn',
                    }, 'CreatedSNSRole');
                }
                if (props.googleClientId) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('googleClientId'),
                    }, 'GoogleWebClient');
                }
                if (props.googleIos) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('googleIos'),
                    }, 'GoogleIOSClient');
                }
                if (props.googleAndroid) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('googleAndroid'),
                    }, 'GoogleAndroidClient');
                }
                if (props.facebookAppId) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('facebookAppId'),
                    }, 'FacebookWebClient');
                }
                if (props.amazonAppId) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('amazonAppId'),
                    }, 'AmazonWebClient');
                }
                if (props.appleAppId) {
                    this._authTemplateObj.addCfnOutput({
                        value: cdk.Fn.ref('appleAppId'),
                    }, 'AppleWebClient');
                }
            }
        };
        this.addCfnParameters = (props) => {
            this._authTemplateObj.addCfnParameter({
                type: 'String',
            }, 'env');
            if (!lodash_1.default.isEmpty(props.dependsOn)) {
                const { dependsOn } = props;
                dependsOn === null || dependsOn === void 0 ? void 0 : dependsOn.forEach((param) => {
                    param.attributes.forEach((attribute) => {
                        this._authTemplateObj.addCfnParameter({
                            type: 'String',
                            default: `${param.category}${param.resourceName}${attribute}`,
                        }, `${param.category}${param.resourceName}${attribute}`);
                    });
                });
            }
            for (const [key, value] of Object.entries(props)) {
                if (key === 'hostedUIProviderCreds') {
                    this._authTemplateObj.addCfnParameter({
                        type: 'String',
                        noEcho: true,
                    }, key);
                    continue;
                }
                if (typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value))) {
                    this._authTemplateObj.addCfnParameter({
                        type: 'String',
                    }, key);
                }
                if (typeof value === 'boolean') {
                    this._authTemplateObj.addCfnParameter({
                        type: 'String',
                    }, key);
                }
                if (typeof value === 'number') {
                    this._authTemplateObj.addCfnParameter({
                        type: 'String',
                    }, key);
                }
                if (value === 'parentStack') {
                    this._authTemplateObj.addCfnParameter({
                        type: 'String',
                    }, key);
                }
                if (Array.isArray(value)) {
                    if (key !== 'userAutoVerifiedAttributeUpdateSettings') {
                        this._authTemplateObj.addCfnParameter({
                            type: 'CommaDelimitedList',
                        }, key);
                    }
                }
            }
            if (Object.keys(props).includes('hostedUIProviderMeta') && !Object.keys(props).includes('hostedUIProviderCreds')) {
                this._authTemplateObj.addCfnParameter({
                    type: 'String',
                    default: '[]',
                }, 'hostedUIProviderCreds');
            }
        };
        this.addCfnConditions = (props) => {
            this._authTemplateObj.addCfnCondition({
                expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
            }, 'ShouldNotCreateEnvResources');
            if (props.authSelections !== 'identityPoolOnly') {
                this._authTemplateObj.addCfnCondition({
                    expression: cdk.Fn.conditionEquals(cdk.Fn.ref('userpoolClientGenerateSecret'), true),
                }, 'ShouldOutputAppClientSecrets');
            }
        };
        this._synthesizer = new stack_synthesizer_1.AuthStackSynthesizer();
        this._app = new cdk.App();
        this._category = amplify_cli_core_1.AmplifyCategories.AUTH;
        this._service = amplify_cli_core_1.AmplifySupportedService.COGNITO;
        this._authTemplateObj = new auth_cognito_stack_builder_1.AmplifyAuthCognitoStack(this._app, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
    }
    async transform(context) {
        var _a;
        const cliState = new auth_input_state_1.AuthInputState(context, this.resourceName);
        this._cliInputs = cliState.getCLIInputPayload();
        this._cognitoStackProps = await this.generateStackProps(context);
        const resources = amplify_cli_core_1.stateManager.getMeta();
        if ((_a = resources.auth) === null || _a === void 0 ? void 0 : _a.userPoolGroups) {
            await (0, synthesize_resources_1.updateUserPoolGroups)(context, this._cognitoStackProps.resourceName, this._cognitoStackProps.userPoolGroupList);
        }
        else {
            await (0, synthesize_resources_1.createUserPoolGroups)(context, this._cognitoStackProps.resourceName, this._cognitoStackProps.userPoolGroupList);
        }
        if (this._cognitoStackProps.breakCircularDependency) {
            await (0, generate_auth_trigger_template_1.generateNestedAuthTriggerTemplate)(this._category, this.resourceName, this._cognitoStackProps);
        }
        await this.generateStackResources(this._cognitoStackProps);
        await this.applyOverride();
        const template = await this.synthesizeTemplates();
        await this.saveBuildFiles(context, template);
        return template;
    }
    async generateStackResources(props) {
        this.addCfnParameters(props);
        this.addCfnConditions(props);
        await this._authTemplateObj.generateCognitoStackResources(props);
        this.generateCfnOutputs(props);
    }
    validateCfnParameters(context, oldParameters, parametersJson) {
        var _a, _b, _c;
        if (!((_a = oldParameters === null || oldParameters === void 0 ? void 0 : oldParameters.requiredAttributes) === null || _a === void 0 ? void 0 : _a.length)) {
            return true;
        }
        const cliInputsFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this.resourceName, 'cli-inputs.json');
        const containsAll = (arr1, arr2) => arr2.every((arr2Item) => arr1.includes(arr2Item));
        const sameMembers = (arr1, arr2) => arr1.length === arr2.length && containsAll(arr2, arr1);
        if (!sameMembers((_b = oldParameters.requiredAttributes) !== null && _b !== void 0 ? _b : [], (_c = parametersJson.requiredAttributes) !== null && _c !== void 0 ? _c : [])) {
            context.print.error(`Cognito configuration in the cloud has drifted from local configuration. Present changes cannot be pushed until drift is fixed. \`requiredAttributes\` requested is ${JSON.stringify(parametersJson.requiredAttributes)}, but ${JSON.stringify(oldParameters.requiredAttributes)} is required by Cognito configuration. Update ${cliInputsFilePath} to continue.`);
            process.exit(1);
        }
        return true;
    }
}
exports.AmplifyAuthTransform = AmplifyAuthTransform;
//# sourceMappingURL=auth-stack-transform.js.map