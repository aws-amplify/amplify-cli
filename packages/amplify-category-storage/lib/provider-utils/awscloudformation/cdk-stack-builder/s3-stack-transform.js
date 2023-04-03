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
exports.AmplifyS3ResourceStackTransform = exports.transformS3ResourceStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const vm = __importStar(require("vm2"));
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const s3_user_input_state_1 = require("../service-walkthroughs/s3-user-input-state");
const s3_stack_builder_1 = require("./s3-stack-builder");
const types_1 = require("./types");
const transformS3ResourceStack = async (context, resource) => {
    if ((0, s3_user_input_state_1.canResourceBeTransformed)(context, resource.resourceName)) {
        const stackGenerator = new AmplifyS3ResourceStackTransform(resource.resourceName, context);
        await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.OVERRIDE);
    }
};
exports.transformS3ResourceStack = transformS3ResourceStack;
class AmplifyS3ResourceStackTransform {
    constructor(resourceName, context) {
        this.generateCfnInputParameters = () => {
            var _a;
            const userInput = this.cliInputsState.getUserInput();
            this.cfnInputParams = {
                bucketName: userInput.bucketName,
                selectedGuestPermissions: s3_user_input_state_1.S3InputState.getCfnPermissionsFromInputPermissions(userInput.guestAccess),
                selectedAuthenticatedPermissions: s3_user_input_state_1.S3InputState.getCfnPermissionsFromInputPermissions(userInput.authAccess),
                unauthRoleName: {
                    Ref: 'UnauthRoleName',
                },
                authRoleName: {
                    Ref: 'AuthRoleName',
                },
            };
            if (userInput.triggerFunction && userInput.triggerFunction !== 'NONE') {
                this.cfnInputParams.triggerFunction = userInput.triggerFunction;
            }
            if (((_a = userInput.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) && userInput.adminTriggerFunction.triggerFunction !== 'NONE') {
                this.cfnInputParams.adminTriggerFunction = userInput.adminTriggerFunction.triggerFunction;
            }
            this.cfnInputParams.s3PrivatePolicy = `Private_policy_${userInput.policyUUID}`;
            this.cfnInputParams.s3ProtectedPolicy = `Protected_policy_${userInput.policyUUID}`;
            this.cfnInputParams.s3PublicPolicy = `Public_policy_${userInput.policyUUID}`;
            this.cfnInputParams.s3ReadPolicy = `read_policy_${userInput.policyUUID}`;
            this.cfnInputParams.s3UploadsPolicy = `Uploads_policy_${userInput.policyUUID}`;
            this.cfnInputParams.authPolicyName = `s3_amplify_${userInput.policyUUID}`;
            this.cfnInputParams.unauthPolicyName = `s3_amplify_${userInput.policyUUID}`;
            this.cfnInputParams.AuthenticatedAllowList = this._getAuthGuestListPermission(s3_user_input_types_1.S3PermissionType.READ, userInput.authAccess);
            this.cfnInputParams.GuestAllowList = this._getAuthGuestListPermission(s3_user_input_types_1.S3PermissionType.READ, userInput.guestAccess);
            this.cfnInputParams.s3PermissionsAuthenticatedPrivate = this._getPublicPrivatePermissions(userInput.authAccess, true);
            this.cfnInputParams.s3PermissionsAuthenticatedProtected = this._getPublicPrivatePermissions(userInput.authAccess, true);
            this.cfnInputParams.s3PermissionsAuthenticatedPublic = this._getPublicPrivatePermissions(userInput.authAccess, true);
            this.cfnInputParams.s3PermissionsAuthenticatedUploads = this._getUploadPermissions(userInput.authAccess);
            this.cfnInputParams.s3PermissionsGuestPublic = this._getPublicPrivatePermissions(userInput.guestAccess, true);
            this.cfnInputParams.s3PermissionsGuestUploads = this._getUploadPermissions(userInput.guestAccess);
        };
        this._getAuthGuestListPermission = (checkOperation, authPermissions) => {
            if (authPermissions) {
                if (authPermissions.includes(checkOperation)) {
                    return types_1.AmplifyBuildParamsPermissions.ALLOW;
                }
                return types_1.AmplifyBuildParamsPermissions.DISALLOW;
            }
            return types_1.AmplifyBuildParamsPermissions.DISALLOW;
        };
        this._getPublicPrivatePermissions = (authPermissions, excludeListBuckets) => {
            if (authPermissions) {
                let cfnPermissions = s3_user_input_state_1.S3InputState.getCfnPermissionsFromInputPermissions(authPermissions);
                if (excludeListBuckets) {
                    cfnPermissions = cfnPermissions.filter((permissions) => permissions !== s3_user_input_state_1.S3CFNPermissionType.LIST);
                }
                return cfnPermissions && cfnPermissions.length > 0 ? cfnPermissions.join() : types_1.AmplifyBuildParamsPermissions.DISALLOW;
            }
            return types_1.AmplifyBuildParamsPermissions.DISALLOW;
        };
        this._getUploadPermissions = (authPermissions) => {
            if (authPermissions) {
                if (!authPermissions.includes(s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE)) {
                    return types_1.AmplifyBuildParamsPermissions.DISALLOW;
                }
                const cfnPermissions = s3_user_input_state_1.S3InputState.getCfnTypesFromPermissionType(s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE);
                return cfnPermissions.join();
            }
            return types_1.AmplifyBuildParamsPermissions.DISALLOW;
        };
        this.applyOverrides = async () => {
            var _a;
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, this.resourceName);
            const overrideJSFilePath = path.resolve(path.join(resourceDirPath, 'build', 'override.js'));
            const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, resourceDirPath);
            if (isBuild) {
                const { override } = await (_a = overrideJSFilePath, Promise.resolve().then(() => __importStar(require(_a)))).catch(() => {
                    amplify_prompts_1.formatter.list(['No override File Found', `To override ${this.resourceName} run amplify override auth ${this.resourceName} `]);
                    return undefined;
                });
                if (override && typeof override === 'function') {
                    const overrideCode = await fs.readFile(overrideJSFilePath, 'utf-8').catch(() => {
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
                    try {
                        const projectInfo = (0, cli_extensibility_helper_1.getProjectInfo)();
                        await sandboxNode
                            .run(overrideCode, overrideJSFilePath)
                            .override(this.resourceTemplateObj, projectInfo);
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
        };
        this.saveBuildFiles = (commandType) => {
            if (this.resourceTemplateObj) {
                this.cfn = this.resourceTemplateObj.renderCloudFormationTemplate();
            }
            this._saveFilesToLocalFileSystem('cloudformation-template.json', this.cfn);
            this._saveFilesToLocalFileSystem('parameters.json', this.cfnInputParams);
            if (commandType !== amplify_cli_core_1.CLISubCommandType.ADD) {
                this._saveDependsOnToBackendConfig();
            }
        };
        this._addOutputs = () => {
            var _a, _b;
            (_a = this.resourceTemplateObj) === null || _a === void 0 ? void 0 : _a.addCfnOutput({
                value: cdk.Fn.ref('S3Bucket'),
                description: 'Bucket name for the S3 bucket',
            }, 'BucketName');
            (_b = this.resourceTemplateObj) === null || _b === void 0 ? void 0 : _b.addCfnOutput({
                value: cdk.Fn.ref('AWS::Region'),
            }, 'Region');
        };
        this._addParameters = () => {
            const s3CfnParams = [
                {
                    params: ['env', 'bucketName', 'authPolicyName', 'unauthPolicyName', 'authRoleName', 'unauthRoleName', 'triggerFunction'],
                    paramType: 'String',
                },
                {
                    params: ['s3PublicPolicy', 's3PrivatePolicy', 's3ProtectedPolicy', 's3UploadsPolicy', 's3ReadPolicy'],
                    paramType: 'String',
                    default: 'NONE',
                },
                {
                    params: [
                        's3PermissionsAuthenticatedPublic',
                        's3PermissionsAuthenticatedProtected',
                        's3PermissionsAuthenticatedPrivate',
                        's3PermissionsAuthenticatedUploads',
                        's3PermissionsGuestPublic',
                        's3PermissionsGuestUploads',
                        'AuthenticatedAllowList',
                        'GuestAllowList',
                    ],
                    paramType: 'String',
                    default: types_1.AmplifyBuildParamsPermissions.DISALLOW,
                },
                {
                    params: ['selectedGuestPermissions', 'selectedAuthenticatedPermissions'],
                    paramType: 'CommaDelimitedList',
                    default: 'NONE',
                },
            ];
            s3CfnParams.map((params) => this._setCFNParams(params));
        };
        this._setCFNParams = (paramDefinitions) => {
            const { resourceTemplateObj } = this;
            if (resourceTemplateObj) {
                paramDefinitions.params.forEach((paramName) => {
                    const cfnParam = {
                        type: paramDefinitions.paramType,
                    };
                    if (paramDefinitions.default) {
                        cfnParam.default = paramDefinitions.default;
                    }
                    resourceTemplateObj.addCfnParameter(cfnParam, paramName);
                });
            }
        };
        this._saveFilesToLocalFileSystem = (fileName, data) => {
            fs.ensureDirSync(this.cliInputsState.buildFilePath);
            const cfnFilePath = path.resolve(path.join(this.cliInputsState.buildFilePath, fileName));
            amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, data);
        };
        this._saveDependsOnToBackendConfig = () => {
            if (this.resourceTemplateObj) {
                const s3DependsOnResources = this.resourceTemplateObj.getS3DependsOn();
                const dependsOn = [...(s3DependsOnResources || [])];
                this.context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.STORAGE, this.resourceName, 'dependsOn', dependsOn);
            }
        };
        this.app = new cdk.App();
        this.cliInputsState = new s3_user_input_state_1.S3InputState(context, resourceName, undefined);
        this.cliInputs = this.cliInputsState.getCliInputPayload();
        this.context = context;
        this.resourceName = resourceName;
    }
    getCFN() {
        return this.cfn;
    }
    getCFNInputParams() {
        return this.cfnInputParams;
    }
    async transform(commandType) {
        this.generateCfnInputParameters();
        await this.generateStack(this.context);
        await this.applyOverrides();
        this.saveBuildFiles(commandType);
    }
    getS3DependsOn() {
        return this.resourceTemplateObj ? this.resourceTemplateObj.getS3DependsOn() : undefined;
    }
    async generateStack(context) {
        this.resourceTemplateObj = new s3_stack_builder_1.AmplifyS3ResourceCfnStack(this.app, 'AmplifyS3ResourceStack', this.cliInputs, this.cfnInputParams);
        this.resourceTemplateObj.addParameters();
        this.resourceTemplateObj.addConditions();
        this.resourceTemplateObj.addOutputs();
        await this.resourceTemplateObj.generateCfnStackResources(context);
    }
}
exports.AmplifyS3ResourceStackTransform = AmplifyS3ResourceStackTransform;
//# sourceMappingURL=s3-stack-transform.js.map