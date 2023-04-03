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
exports.AmplifyRootStackTransform = void 0;
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const vm = __importStar(require("vm2"));
const root_stack_builder_1 = require("./root-stack-builder");
const stack_synthesizer_1 = require("./stack-synthesizer");
class AmplifyRootStackTransform {
    constructor(resourceName) {
        this.applyOverride = async () => {
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const overrideFilePath = path.join(backendDir, this._resourceName);
            const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, overrideFilePath);
            if (isBuild) {
                const overrideCode = await fs.readFile(path.join(overrideFilePath, 'build', 'override.js'), 'utf-8').catch(() => {
                    amplify_prompts_1.formatter.list(['No override File Found', `To override ${this._resourceName} run amplify override auth`]);
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
                    await sandboxNode.run(overrideCode).override(this._rootTemplateObj, projectInfo);
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
        this.generateRootStackTemplate = async () => {
            this._rootTemplateObj = new root_stack_builder_1.AmplifyRootStack(this.app, 'AmplifyRootStack', { synthesizer: this._synthesizer });
            this._rootTemplateObj.addCfnParameter({
                type: 'String',
                description: 'Name of the common deployment bucket provided by the parent stack',
                default: 'DeploymentBucket',
            }, 'DeploymentBucketName');
            this._rootTemplateObj.addCfnParameter({
                type: 'String',
                description: 'Name of the common deployment bucket provided by the parent stack',
                default: 'AuthRoleName',
            }, 'AuthRoleName');
            this._rootTemplateObj.addCfnParameter({
                type: 'String',
                description: 'Name of the common deployment bucket provided by the parent stack',
                default: 'UnAuthRoleName',
            }, 'UnauthRoleName');
            this._rootTemplateObj.addCfnOutput({
                description: 'CloudFormation provider root stack Region',
                value: cdk.Fn.ref('AWS::Region'),
                exportName: cdk.Fn.sub('${AWS::StackName}-Region'),
            }, 'Region');
            this._rootTemplateObj.addCfnOutput({
                description: 'CloudFormation provider root stack ID',
                value: cdk.Fn.ref('AWS::StackName'),
                exportName: cdk.Fn.sub('${AWS::StackName}-StackName'),
            }, 'StackName');
            this._rootTemplateObj.addCfnOutput({
                description: 'CloudFormation provider root stack name',
                value: cdk.Fn.ref('AWS::StackId'),
                exportName: cdk.Fn.sub('${AWS::StackName}-StackId'),
            }, 'StackId');
            this._rootTemplateObj.addCfnOutput({
                value: cdk.Fn.getAtt('AuthRole', 'Arn').toString(),
            }, 'AuthRoleArn');
            this._rootTemplateObj.addCfnOutput({
                value: cdk.Fn.getAtt('UnauthRole', 'Arn').toString(),
            }, 'UnauthRoleArn');
            await this._rootTemplateObj.generateRootStackResources();
            this._rootTemplateObjOutputs = new root_stack_builder_1.AmplifyRootStackOutputs(this.app, 'AmplifyRootStackOutputs', {
                synthesizer: this._synthesizerOutputs,
            });
            this._rootTemplateObjOutputs.addCfnOutput({
                description: 'CloudFormation provider root stack deployment bucket name',
                value: cdk.Fn.ref('DeploymentBucketName'),
                exportName: cdk.Fn.sub('${AWS::StackName}-DeploymentBucketName'),
            }, 'DeploymentBucketName');
            this._rootTemplateObjOutputs.addCfnOutput({
                value: cdk.Fn.ref('AuthRole'),
            }, 'AuthRoleName');
            this._rootTemplateObjOutputs.addCfnOutput({
                value: cdk.Fn.ref('UnauthRole'),
            }, 'UnauthRoleName');
        };
        this.synthesizeTemplates = async () => {
            var _a;
            (_a = this.app) === null || _a === void 0 ? void 0 : _a.synth();
            const templates = this._synthesizer.collectStacks();
            const templatesOutput = this._synthesizerOutputs.collectStacks();
            const cfnRootStack = templates.get('AmplifyRootStack');
            const cfnRootStackOutputs = templatesOutput.get('AmplifyRootStackOutputs');
            Object.assign(cfnRootStack.Outputs, cfnRootStackOutputs.Outputs);
            return cfnRootStack;
        };
        this.saveBuildFiles = async (context, template) => {
            var _a;
            const rootStackFileName = 'root-cloudformation-stack.json';
            const rootStackFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._resourceName, 'build', rootStackFileName);
            await (0, amplify_cli_core_1.writeCFNTemplate)(template, rootStackFilePath, {
                templateFormat: amplify_cli_core_1.CFNTemplateFormat.JSON,
                minify: (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify,
            });
        };
        this._resourceName = resourceName;
        this._synthesizer = new stack_synthesizer_1.RootStackSynthesizer();
        this.app = new cdk.App();
        this._synthesizerOutputs = new stack_synthesizer_1.RootStackSynthesizer();
    }
    async transform(context) {
        await this.generateRootStackTemplate();
        if (context.input.command !== 'init') {
            await this.applyOverride();
        }
        const template = await this.synthesizeTemplates();
        if (context.input.command !== 'init') {
            await this.saveBuildFiles(context, template);
        }
        return template;
    }
    getRootStack() {
        if (this._rootTemplateObj) {
            return this._rootTemplateObj;
        }
        throw new amplify_cli_core_1.AmplifyFault('RootStackNotFoundFault', {
            message: `Root Stack Template doesn't exist.`,
        });
    }
}
exports.AmplifyRootStackTransform = AmplifyRootStackTransform;
//# sourceMappingURL=root-stack-transform.js.map