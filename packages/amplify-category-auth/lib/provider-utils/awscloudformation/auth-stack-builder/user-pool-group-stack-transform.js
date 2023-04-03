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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyUserPoolGroupTransform = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const cdk = __importStar(require("aws-cdk-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const vm = __importStar(require("vm2"));
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const index_1 = require("./index");
const stack_synthesizer_1 = require("./stack-synthesizer");
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
class AmplifyUserPoolGroupTransform extends amplify_cli_core_1.AmplifyCategoryTransform {
    constructor(resourceName) {
        super(resourceName);
        this.generateStackResources = async (props) => {
            this._userPoolGroupTemplateObj = new index_1.AmplifyUserPoolGroupStack(this._app, 'AmplifyUserPoolGroupStack', {
                synthesizer: this._synthesizer,
            });
            this.__userPoolGroupTemplateObjOutputs = new index_1.AmplifyUserPoolGroupStackOutputs(this._app, 'AmplifyUserPoolGroupStackOutputs', {
                synthesizer: this._synthesizerOutputs,
            });
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
            }, 'env');
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
            }, 'AuthRoleArn');
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
            }, 'UnauthRoleArn');
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
                default: `auth${props.cognitoResourceName}UserPoolId`,
            }, `auth${props.cognitoResourceName}UserPoolId`);
            if (props.identityPoolName) {
                this._userPoolGroupTemplateObj.addCfnParameter({
                    type: 'String',
                    default: `auth${props.cognitoResourceName}IdentityPoolId`,
                }, `auth${props.cognitoResourceName}IdentityPoolId`);
            }
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
                default: `auth${props.cognitoResourceName}AppClientID`,
            }, `auth${props.cognitoResourceName}AppClientID`);
            this._userPoolGroupTemplateObj.addCfnParameter({
                type: 'String',
                default: `auth${props.cognitoResourceName}AppClientIDWeb`,
            }, `auth${props.cognitoResourceName}AppClientIDWeb`);
            this._userPoolGroupTemplateObj.addCfnCondition({
                expression: cdk.Fn.conditionEquals(this._userPoolGroupTemplateObj.getCfnParameter('env'), 'NONE'),
            }, 'ShouldNotCreateEnvResources');
            await this._userPoolGroupTemplateObj.generateUserPoolGroupResources(props);
            if (props.identityPoolName) {
                props.groups.forEach((group) => {
                    this.__userPoolGroupTemplateObjOutputs.addCfnOutput({
                        value: cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString(),
                    }, `${group.groupName}GroupRole`);
                });
            }
        };
        this.applyOverride = async () => {
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const overrideDir = path.join(backendDir, this._category, this._resourceName);
            const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, overrideDir);
            if (isBuild) {
                const overrideCode = await fs.readFile(path.join(overrideDir, 'build', 'override.js'), 'utf-8').catch(() => {
                    amplify_prompts_1.formatter.list(['No override File Found', `To override ${this._resourceName} run amplify override auth`]);
                    return '';
                });
                const sandboxNode = new vm.NodeVM({
                    console: 'inherit',
                    timeout: 5000,
                    sandbox: {},
                });
                const projectInfo = (0, cli_extensibility_helper_1.getProjectInfo)();
                try {
                    await sandboxNode
                        .run(overrideCode)
                        .override(this._userPoolGroupTemplateObj, projectInfo);
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
            const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
            const groups = amplify_cli_core_1.JSONUtilities.readJson(resourceDirPath, { throwIfNotExist: true });
            const cliState = new auth_input_state_1.AuthInputState(context, this._authResourceName);
            this._cliInputs = cliState.getCLIInputPayload();
            const { identityPoolName } = this._cliInputs.cognitoConfig;
            return {
                groups: groups,
                identityPoolName,
                cognitoResourceName: this._authResourceName,
            };
        };
        this.synthesizeTemplates = async () => {
            this._app.synth();
            const templates = this._synthesizer.collectStacks();
            const cfnUserPoolGroupStack = templates.get('AmplifyUserPoolGroupStack');
            const templatesOutput = this._synthesizerOutputs.collectStacks();
            const cfnUserPoolGroupOutputs = templatesOutput.get('AmplifyUserPoolGroupStackOutputs');
            cfnUserPoolGroupStack.Outputs = cfnUserPoolGroupOutputs.Outputs;
            return cfnUserPoolGroupStack;
        };
        this.saveBuildFiles = async (__context, template) => {
            const cognitoStackFileName = `${this._resourceName}-cloudformation-template.json`;
            const cognitoStackFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this._resourceName, 'build', cognitoStackFileName);
            await (0, amplify_cli_core_1.writeCFNTemplate)(template, cognitoStackFilePath, {
                templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
            });
            this.writeBuildFiles();
        };
        this.writeBuildFiles = () => {
            const parametersJSONFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this._resourceName, 'build', 'parameters.json');
            const roles = {
                AuthRoleArn: {
                    'Fn::GetAtt': ['AuthRole', 'Arn'],
                },
                UnauthRoleArn: {
                    'Fn::GetAtt': ['UnauthRole', 'Arn'],
                },
            };
            const parameters = {
                ...roles,
            };
            amplify_cli_core_1.JSONUtilities.writeJson(parametersJSONFilePath, parameters);
        };
        this._authResourceName = resourceName;
        this._resourceName = 'userPoolGroups';
        this._synthesizer = new stack_synthesizer_1.AuthStackSynthesizer();
        this._synthesizerOutputs = new stack_synthesizer_1.AuthStackSynthesizer();
        this._app = new cdk.App();
        this._category = amplify_cli_core_1.AmplifyCategories.AUTH;
        this._service = amplify_cli_core_1.AmplifySupportedService.COGNITOUSERPOOLGROUPS;
    }
    async transform(context) {
        const userPoolGroupStackOptions = await this.generateStackProps(context);
        await this.generateStackResources(userPoolGroupStackOptions);
        await this.applyOverride();
        const template = await this.synthesizeTemplates();
        await this.saveBuildFiles(context, template);
        return template;
    }
}
exports.AmplifyUserPoolGroupTransform = AmplifyUserPoolGroupTransform;
//# sourceMappingURL=user-pool-group-stack-transform.js.map