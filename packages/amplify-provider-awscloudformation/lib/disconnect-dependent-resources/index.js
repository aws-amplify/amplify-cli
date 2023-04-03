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
exports.postDeploymentCleanup = exports.prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const fs = __importStar(require("fs-extra"));
const aws_s3_1 = require("../aws-utils/aws-s3");
const configuration_manager_1 = require("../configuration-manager");
const utils_1 = require("./utils");
let functionsDependentOnReplacedModelTables = [];
const prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables = async (context, modelsBeingReplaced, deploymentSteps) => {
    var _a, _b;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const rootStackId = (_b = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.StackId;
    const allFunctionNames = Object.keys((amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.function) || {});
    functionsDependentOnReplacedModelTables = await (0, utils_1.getDependentFunctions)(modelsBeingReplaced, allFunctionNames, getFunctionParamsSupplier(context));
    const { deploymentSteps: disconnectFuncsSteps, lastMetaKey } = await (0, utils_1.generateIterativeFuncDeploymentSteps)(new aws_sdk_1.CloudFormation(await (0, configuration_manager_1.loadConfiguration)(context)), rootStackId, functionsDependentOnReplacedModelTables);
    await (0, utils_1.generateTempFuncCFNTemplates)(functionsDependentOnReplacedModelTables);
    await (0, utils_1.uploadTempFuncDeploymentFiles)(await aws_s3_1.S3.getInstance(context), functionsDependentOnReplacedModelTables);
    return (0, utils_1.prependDeploymentSteps)(disconnectFuncsSteps, deploymentSteps, lastMetaKey);
};
exports.prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables = prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables;
const postDeploymentCleanup = async (s3Client, deploymentBucketName) => {
    if (functionsDependentOnReplacedModelTables.length < 1) {
        return;
    }
    await s3Client.deleteDirectory(deploymentBucketName, utils_1.s3Prefix);
    await Promise.all(functionsDependentOnReplacedModelTables.map((funcName) => fs.remove((0, utils_1.localPrefix)(funcName))));
};
exports.postDeploymentCleanup = postDeploymentCleanup;
const getFunctionParamsSupplier = (context) => async (functionName) => context.amplify.invokePluginMethod(context, 'function', undefined, 'loadFunctionParameters', [
    amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, 'function', functionName),
]);
//# sourceMappingURL=index.js.map