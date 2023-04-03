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
exports.createLayerZipFilename = exports.checkContentChanges = exports.packageLayer = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const os_1 = require("os");
const path = __importStar(require("path"));
const lambdaLayerWalkthrough_1 = require("../service-walkthroughs/lambdaLayerWalkthrough");
const constants_1 = require("./constants");
const layerCloudState_1 = require("./layerCloudState");
const layerConfiguration_1 = require("./layerConfiguration");
const layerHelpers_1 = require("./layerHelpers");
const layerParams_1 = require("./layerParams");
const storeResources_1 = require("./storeResources");
const zipResource_1 = require("./zipResource");
const packageLayer = async (context, resource, isExport) => {
    var _a;
    const previousHash = (0, layerHelpers_1.loadPreviousLayerHash)(resource.resourceName);
    const currentHash = await (0, layerHelpers_1.ensureLayerVersion)(context, resource.resourceName, previousHash);
    if (!isExport && previousHash === currentHash) {
        return { newPackageCreated: false, zipFilename: undefined, zipFilePath: undefined };
    }
    const resourcePath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, resource.category, resource.resourceName);
    const { runtimes } = (0, layerConfiguration_1.loadLayerConfigurationFile)(resource.resourceName);
    const distDir = path.join(resourcePath, 'dist');
    fs.ensureDirSync(distDir);
    const destination = path.join(distDir, 'latest-build.zip');
    let layerSizeInBytes = 0;
    layerSizeInBytes += await (0, amplify_cli_core_1.getFolderSize)([path.join(resourcePath, 'lib'), path.join(resourcePath, 'opt')]);
    if (layerSizeInBytes > constants_1.lambdaPackageLimitInMB * 1024 ** 2) {
        throw new Error(`Lambda layer ${resource.resourceName} is too large: ${(0, amplify_cli_core_1.convertNumBytes)(layerSizeInBytes).toMB()}/${constants_1.lambdaPackageLimitInMB} MB`);
    }
    let zipEntries = [{ sourceFolder: path.join(resourcePath, 'opt') }];
    for (const runtime of runtimes) {
        const layerCodePath = path.join(resourcePath, 'lib', runtime.layerExecutablePath);
        const runtimePlugin = (await context.amplify.loadRuntimePlugin(context, runtime.runtimePluginId));
        const packageRequest = {
            env: context.amplify.getEnvInfo().envName,
            srcRoot: layerCodePath,
            dstFilename: destination,
            runtime: runtime.value,
            lastPackageTimeStamp: resource.lastPackageTimeStamp ? new Date(resource.lastPackageTimeStamp) : undefined,
            lastBuildTimeStamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
            skipHashing: resource.skipHashing,
            service: "LambdaLayer",
            currentHash: previousHash !== currentHash,
        };
        const packageResult = await runtimePlugin.package(packageRequest);
        if (packageResult.packageHash && ((_a = packageResult === null || packageResult === void 0 ? void 0 : packageResult.zipEntries) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            zipEntries = [...zipEntries, ...packageResult.zipEntries];
        }
    }
    await (0, zipResource_1.zipPackage)(zipEntries, destination);
    const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(resource.resourceName);
    if (!layerCloudState.latestVersionLogicalId) {
        throw new Error(`LogicalId missing for new layer version: ${resource.resourceName}.`);
    }
    const zipFilename = createLayerZipFilename(resource.resourceName, layerCloudState.latestVersionLogicalId);
    if (!isExport) {
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename, { resourceKey: constants_1.versionHash, hashValue: currentHash });
    }
    return { newPackageCreated: true, zipFilename, zipFilePath: destination };
};
exports.packageLayer = packageLayer;
async function checkContentChanges(context, layerResources) {
    var _a;
    const changedLayerResources = await (0, layerHelpers_1.getChangedResources)(layerResources);
    const prePushNotificationTemplate = (resourceName, description, timestampString, accessPermissions) => {
        const descriptionLine = `  - ${description}: ${chalk_1.default.green('Updated layer version ')} ${chalk_1.default.gray(timestampString)}`;
        const permissionLine = `  - ${accessPermissions}: ${chalk_1.default.green('Maintain existing permissions')}`;
        return `${resourceName}\n${accessPermissions ? `${permissionLine}\n${descriptionLine}` : descriptionLine}`;
    };
    if (changedLayerResources.length > 0) {
        context.print.info('');
        if (layerResources.filter((layer) => (0, layerHelpers_1.loadPreviousLayerHash)(layer.resourceName) !== undefined).length > 0) {
            context.print.info('Content changes in Lambda layers detected.');
        }
        context.print.info('Suggested configuration for new layer versions:');
        context.print.info('');
        const timestampString = new Date().toISOString();
        const prepushNotificationMessage = changedLayerResources.map((layer) => {
            const { resourceName } = layer;
            const parameters = (0, layerHelpers_1.loadStoredLayerParameters)(context, resourceName);
            layer.parameters = parameters;
            if (!lodash_1.default.isEqual(parameters.permissions, [layerParams_1.defaultLayerPermission])) {
                return prePushNotificationTemplate(resourceName, constants_1.description, timestampString, constants_1.accessPermissions);
            }
            return prePushNotificationTemplate(resourceName, constants_1.description, timestampString);
        });
        context.print.info(prepushNotificationMessage.join(os_1.EOL));
        context.print.info('');
        const accepted = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || (await context.prompt.confirm('Accept the suggested layer version configurations?', true));
        for (const layer of changedLayerResources) {
            let { parameters } = layer;
            if (!accepted) {
                context.print.info('');
                context.print.info(`Change options layer: ${layer.resourceName}`);
                context.print.info('');
                parameters = await (0, lambdaLayerWalkthrough_1.lambdaLayerNewVersionWalkthrough)(parameters, timestampString);
            }
            else {
                parameters.description = `Updated layer version ${timestampString}`;
            }
            await (0, storeResources_1.updateLayerArtifacts)(context, parameters, {
                updateMeta: false,
                generateCfnFile: false,
                updateDescription: true,
                updateLayerParams: true,
            });
        }
    }
}
exports.checkContentChanges = checkContentChanges;
function createLayerZipFilename(resourceName, latestLayerVersionLogicalId) {
    return `${resourceName}-${latestLayerVersionLogicalId}-build.zip`;
}
exports.createLayerZipFilename = createLayerZipFilename;
//# sourceMappingURL=packageLayer.js.map