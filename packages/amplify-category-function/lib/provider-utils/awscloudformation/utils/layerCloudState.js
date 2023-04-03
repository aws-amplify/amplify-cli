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
exports.LayerCloudState = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const ora_1 = __importDefault(require("ora"));
const layerHelpers_1 = require("./layerHelpers");
const layerParams_1 = require("./layerParams");
class LayerCloudState {
    constructor() { }
    static getInstance(layerName) {
        if (!LayerCloudState.instances[layerName]) {
            LayerCloudState.instances[layerName] = new LayerCloudState();
        }
        return LayerCloudState.instances[layerName];
    }
    async loadLayerDataFromCloud(context, layerName) {
        var _a;
        var _b;
        const spinner = (0, ora_1.default)('Loading layer data from the cloud...').start();
        try {
            const { envName } = context.amplify.getEnvInfo();
            const providerPlugin = await (_a = context.amplify.getProviderPlugins(context).awscloudformation, Promise.resolve().then(() => __importStar(require(_a))));
            const lambdaClient = await providerPlugin.getLambdaSdk(context);
            const layerVersionList = await lambdaClient.listLayerVersions((0, layerHelpers_1.isMultiEnvLayer)(layerName) ? `${layerName}-${envName}` : layerName);
            const cfnClient = await providerPlugin.getCloudFormationSdk(context);
            const stackList = await cfnClient.listStackResources();
            const layerStacks = (_b = stackList === null || stackList === void 0 ? void 0 : stackList.StackResourceSummaries) === null || _b === void 0 ? void 0 : _b.filter((stack) => stack.LogicalResourceId.includes(layerName) && stack.ResourceType === 'AWS::CloudFormation::Stack');
            let detailedLayerStack;
            if ((layerStacks === null || layerStacks === void 0 ? void 0 : layerStacks.length) > 0) {
                detailedLayerStack = (await cfnClient.listStackResources(layerStacks[0].PhysicalResourceId)).StackResourceSummaries;
            }
            else {
                spinner.stop();
                return [];
            }
            layerVersionList.forEach((layerVersion) => {
                let layerLogicalIdSuffix;
                detailedLayerStack.forEach((stack) => {
                    if (stack.ResourceType === 'AWS::Lambda::LayerVersion' && stack.PhysicalResourceId === layerVersion.LayerVersionArn) {
                        layerVersion.LogicalName = stack.LogicalResourceId;
                        layerLogicalIdSuffix = stack.LogicalResourceId.replace("LambdaLayerVersion", '');
                    }
                });
                detailedLayerStack.forEach((stack) => {
                    if (stack.ResourceType === 'AWS::Lambda::LayerVersionPermission' &&
                        stack.PhysicalResourceId.split('#')[0] === layerVersion.LayerVersionArn) {
                        layerVersion.permissions = layerVersion.permissions || [];
                        const permissionTypeString = stack.LogicalResourceId.replace("LambdaLayerPermission", '').replace(layerLogicalIdSuffix, '');
                        const accountIds = [];
                        const orgIds = [];
                        if (permissionTypeString === layerParams_1.PermissionEnum.Private || permissionTypeString.startsWith("private")) {
                            layerVersion.permissions.push({ type: layerParams_1.PermissionEnum.Private });
                        }
                        else if (permissionTypeString === layerParams_1.PermissionEnum.Public || permissionTypeString.startsWith("public")) {
                            layerVersion.permissions.push({ type: layerParams_1.PermissionEnum.Public });
                        }
                        else if (permissionTypeString.startsWith(layerParams_1.PermissionEnum.AwsAccounts)) {
                            accountIds.push(permissionTypeString.replace(layerParams_1.PermissionEnum.AwsAccounts, '').replace(`Legacy${layerVersion.Version}`, ''));
                        }
                        else if (permissionTypeString.startsWith("awsAccounts")) {
                            accountIds.push(permissionTypeString.replace("awsAccounts", '').substring(0, 12));
                        }
                        else if (permissionTypeString.startsWith(layerParams_1.PermissionEnum.AwsOrg)) {
                            const orgId = permissionTypeString.replace(`${layerParams_1.PermissionEnum.AwsOrg}o`, 'o-').replace(`Legacy${layerVersion.Version}`, '');
                            orgIds.push(orgId);
                        }
                        else if (permissionTypeString.startsWith("awsOrg")) {
                            const suffix = `${layerVersion.Version}`;
                            const orgId = permissionTypeString.replace(`${"awsOrg"}o`, 'o-').slice(0, -1 * suffix.length);
                            orgIds.push(orgId);
                        }
                        if (accountIds.length > 0) {
                            layerVersion.permissions.push({
                                type: layerParams_1.PermissionEnum.AwsAccounts,
                                accounts: accountIds,
                            });
                        }
                        if (orgIds.length > 0) {
                            layerVersion.permissions.push({
                                type: layerParams_1.PermissionEnum.AwsOrg,
                                orgs: orgIds,
                            });
                        }
                    }
                });
                layerVersion.legacyLayer = layerVersion.LogicalName === undefined || layerVersion.LogicalName === 'LambdaLayer';
            });
            this.layerVersionsMetadata = layerVersionList.sort((a, b) => b.Version - a.Version);
            this.latestVersionLogicalId = this.layerVersionsMetadata[0].LogicalName;
        }
        catch (e) {
            spinner.fail();
            const errMessage = `An error occurred fetching the latest layer version metadata for "${layerName}": ${e.message || e}`;
            context.print.error(errMessage);
            await context.usageData.emitError(new Error(errMessage));
            (0, amplify_cli_core_1.exitOnNextTick)(1);
        }
        spinner.stop();
        return this.layerVersionsMetadata;
    }
    async getLayerVersionsFromCloud(context, layerName) {
        return this.layerVersionsMetadata || this.loadLayerDataFromCloud(context, layerName);
    }
}
exports.LayerCloudState = LayerCloudState;
LayerCloudState.instances = {};
//# sourceMappingURL=layerCloudState.js.map