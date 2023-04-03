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
exports.DDBStackTransform = void 0;
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const cdk = __importStar(require("aws-cdk-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const vm = __importStar(require("vm2"));
const cfn_template_utils_1 = require("../cfn-template-utils");
const dynamoDB_input_state_1 = require("../service-walkthroughs/dynamoDB-input-state");
const ddb_stack_builder_1 = require("./ddb-stack-builder");
class DDBStackTransform {
    constructor(context, resourceName) {
        this.app = new cdk.App();
        this._context = context;
        this._resourceName = resourceName;
        this._cliInputsState = new dynamoDB_input_state_1.DynamoDBInputState(context, resourceName);
        this._cliInputs = this._cliInputsState.getCliInputPayload();
        void this._cliInputsState.isCLIInputsValid();
    }
    async transform() {
        await this.generateStack();
        this.generateCfnInputParameters();
        await this.applyOverrides();
        this.saveBuildFiles();
    }
    generateCfnInputParameters() {
        this._cfnInputParams = {
            tableName: this._cliInputs.tableName,
            partitionKeyName: this._cliInputs.partitionKey.fieldName,
            partitionKeyType: (0, cfn_template_utils_1.getDdbAttrType)(this._cliInputs.partitionKey.fieldType),
        };
        if (this._cliInputs.sortKey) {
            this._cfnInputParams.sortKeyName = this._cliInputs.sortKey.fieldName;
            this._cfnInputParams.sortKeyType = (0, cfn_template_utils_1.getDdbAttrType)(this._cliInputs.sortKey.fieldType);
        }
    }
    async generateStack() {
        this._resourceTemplateObj = new ddb_stack_builder_1.AmplifyDDBResourceStack(this.app, 'AmplifyDDBResourceStack', this._cliInputs);
        this._resourceTemplateObj.addCfnParameter({
            type: 'String',
        }, 'partitionKeyName');
        this._resourceTemplateObj.addCfnParameter({
            type: 'String',
        }, 'partitionKeyType');
        this._resourceTemplateObj.addCfnParameter({
            type: 'String',
        }, 'env');
        if (this._cliInputs.sortKey) {
            this._resourceTemplateObj.addCfnParameter({
                type: 'String',
            }, 'sortKeyName');
            this._resourceTemplateObj.addCfnParameter({
                type: 'String',
            }, 'sortKeyType');
        }
        this._resourceTemplateObj.addCfnParameter({
            type: 'String',
        }, 'tableName');
        this._resourceTemplateObj.addCfnCondition({
            expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
        }, 'ShouldNotCreateEnvResources');
        await this._resourceTemplateObj.generateStackResources();
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.ref('DynamoDBTable'),
        }, 'Name');
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.getAtt('DynamoDBTable', 'Arn').toString(),
        }, 'Arn');
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.getAtt('DynamoDBTable', 'StreamArn').toString(),
        }, 'StreamArn');
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.ref('partitionKeyName'),
        }, 'PartitionKeyName');
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.ref('partitionKeyType'),
        }, 'PartitionKeyType');
        if (this._cliInputs.sortKey) {
            this._resourceTemplateObj.addCfnOutput({
                value: cdk.Fn.ref('sortKeyName'),
            }, 'SortKeyName');
            this._resourceTemplateObj.addCfnOutput({
                value: cdk.Fn.ref('sortKeyType'),
            }, 'SortKeyType');
        }
        this._resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.ref('AWS::Region'),
        }, 'Region');
    }
    async applyOverrides() {
        var _a;
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, 'storage', this._resourceName);
        const overrideJSFilePath = path.resolve(path.join(resourceDirPath, 'build', 'override.js'));
        const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, resourceDirPath);
        if (isBuild) {
            const { override } = await (_a = overrideJSFilePath, Promise.resolve().then(() => __importStar(require(_a)))).catch(() => {
                amplify_prompts_1.formatter.list(['No override File Found', `To override ${this._resourceName} run amplify override auth ${this._resourceName} `]);
                return undefined;
            });
            if (typeof override === 'function' && override) {
                const overrideCode = await fs.readFile(overrideJSFilePath, 'utf-8').catch(() => {
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
                    await sandboxNode
                        .run(overrideCode, overrideJSFilePath)
                        .override(this._resourceTemplateObj, projectInfo);
                }
                catch (err) {
                    throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                        message: `Executing overrides failed.`,
                        details: err.message,
                        resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
                    }, err);
                }
            }
        }
    }
    saveBuildFiles() {
        if (this._resourceTemplateObj) {
            this._cfn = JSON.parse(this._resourceTemplateObj.renderCloudFormationTemplate());
        }
        fs.ensureDirSync(this._cliInputsState.buildFilePath);
        const cfnFilePath = path.resolve(path.join(this._cliInputsState.buildFilePath, `${this._resourceName}-cloudformation-template.json`));
        try {
            amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, this._cfn);
        }
        catch (e) {
            throw new Error(e);
        }
        fs.ensureDirSync(this._cliInputsState.buildFilePath);
        const cfnInputParamsFilePath = path.resolve(path.join(this._cliInputsState.buildFilePath, 'parameters.json'));
        try {
            amplify_cli_core_1.JSONUtilities.writeJson(cfnInputParamsFilePath, this._cfnInputParams);
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
exports.DDBStackTransform = DDBStackTransform;
//# sourceMappingURL=ddb-stack-transform.js.map