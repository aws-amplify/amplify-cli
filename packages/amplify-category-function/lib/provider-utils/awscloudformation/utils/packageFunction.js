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
exports.packageFunction = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const constants_2 = require("../../../constants");
const functionPluginLoader_1 = require("./functionPluginLoader");
const loadFunctionParameters_1 = require("./loadFunctionParameters");
const zipResource_1 = require("./zipResource");
const packageFunction = async (context, resource) => {
    var _a;
    const resourcePath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, resource.category, resource.resourceName);
    const runtimeManager = await (0, functionPluginLoader_1.getRuntimeManager)(context, resource.resourceName);
    const distDirPath = path.join(resourcePath, 'dist');
    fs.ensureDirSync(distDirPath);
    const destination = path.join(distDirPath, 'latest-build.zip');
    const packageRequest = {
        env: context.amplify.getEnvInfo().envName,
        srcRoot: resourcePath,
        dstFilename: destination,
        runtime: runtimeManager.runtime,
        lastPackageTimeStamp: resource.lastPackageTimeStamp ? new Date(resource.lastPackageTimeStamp) : undefined,
        lastBuildTimeStamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
        skipHashing: resource.skipHashing,
    };
    const packageResult = await runtimeManager.package(packageRequest);
    const { packageHash } = packageResult;
    if (packageHash) {
        await (0, zipResource_1.zipPackage)(packageResult.zipEntries, destination);
    }
    const functionSizeInBytes = await (0, amplify_cli_core_1.getFolderSize)(path.join(resourcePath, 'src'));
    let layersSizeInBytes = 0;
    const functionParameters = (0, loadFunctionParameters_1.loadFunctionParameters)(resourcePath);
    for (const layer of (functionParameters === null || functionParameters === void 0 ? void 0 : functionParameters.lambdaLayers) || []) {
        if (layer.type === 'ProjectLayer') {
            const layerDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_2.categoryName, layer.resourceName);
            layersSizeInBytes += await (0, amplify_cli_core_1.getFolderSize)([path.join(layerDirPath, 'lib'), path.join(layerDirPath, 'opt')]);
        }
    }
    if (functionSizeInBytes + layersSizeInBytes > constants_1.lambdaPackageLimitInMB * 1024 ** 2) {
        throw new amplify_cli_core_1.AmplifyError('FunctionTooLargeError', {
            message: `The function is too large to package.`,
            details: `
Total size of Lambda function ${resource.resourceName} plus it's dependent layers exceeds ${constants_1.lambdaPackageLimitInMB}MB limit. Lambda function is ${(0, amplify_cli_core_1.convertNumBytes)(functionSizeInBytes).toMB()}MB. Dependent Lambda layers are ${(0, amplify_cli_core_1.convertNumBytes)(layersSizeInBytes).toMB()}MB.`,
        });
    }
    const zipFilename = packageHash
        ? `${resource.resourceName}-${packageHash}-build.zip`
        : (_a = resource.distZipFilename) !== null && _a !== void 0 ? _a : `${resource.category}-${resource.resourceName}-build.zip`;
    context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename);
    return { newPackageCreated: true, zipFilename, zipFilePath: destination };
};
exports.packageFunction = packageFunction;
//# sourceMappingURL=packageFunction.js.map