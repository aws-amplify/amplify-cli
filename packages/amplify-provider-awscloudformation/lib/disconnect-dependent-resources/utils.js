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
exports.localPrefix = exports.s3Prefix = exports.prependDeploymentSteps = exports.generateIterativeFuncDeploymentSteps = exports.uploadTempFuncDeploymentFiles = exports.generateTempFuncCFNTemplates = exports.getDependentFunctions = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const aws_logger_1 = require("../utils/aws-logger");
const amplify_resource_state_utils_1 = require("../utils/amplify-resource-state-utils");
const logger = (0, aws_logger_1.fileLogger)('disconnect-dependent-resources');
const getDependentFunctions = async (modelNames, functionNames, functionParamsSupplier) => {
    const dependentFunctions = [];
    for (const funcName of functionNames) {
        const funcParams = await functionParamsSupplier(funcName);
        const dependentModels = funcParamsToDependentAppSyncModels(funcParams);
        const hasDep = dependentModels.map((model) => modelNames.includes(model)).reduce((acc, it) => acc || it, false);
        if (hasDep) {
            dependentFunctions.push(funcName);
        }
    }
    return dependentFunctions;
};
exports.getDependentFunctions = getDependentFunctions;
const generateTempFuncCFNTemplates = async (dependentFunctions) => {
    const tempPaths = [];
    for (const funcName of dependentFunctions) {
        const { cfnTemplate, templateFormat } = (0, amplify_cli_core_1.readCFNTemplate)(path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, 'function', funcName), `${funcName}-cloudformation-template.json`));
        replaceFnImport(cfnTemplate);
        const tempPath = getTempFuncTemplateLocalPath(funcName);
        await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, tempPath, { templateFormat });
        tempPaths.push(tempPath);
    }
};
exports.generateTempFuncCFNTemplates = generateTempFuncCFNTemplates;
const uploadTempFuncDeploymentFiles = async (s3Client, funcNames) => {
    for (const funcName of funcNames) {
        const uploads = [
            {
                Body: fs.createReadStream(getTempFuncTemplateLocalPath(funcName)),
                Key: getTempFuncTemplateS3Key(funcName),
            },
            {
                Body: fs.createReadStream(getTempFuncMetaLocalPath(funcName)),
                Key: getTempFuncMetaS3Key(funcName),
            },
        ];
        logger('uploadTemplateToS3.s3.uploadFile', [{ Key: uploads[0].Key }])();
        for (const upload of uploads) {
            await s3Client.uploadFile(upload, false);
        }
    }
};
exports.uploadTempFuncDeploymentFiles = uploadTempFuncDeploymentFiles;
const generateIterativeFuncDeploymentSteps = async (cfnClient, rootStackId, functionNames) => {
    let rollback;
    let previousMetaKey;
    const steps = [];
    for (const funcName of functionNames) {
        const deploymentOp = await generateIterativeFuncDeploymentOp(cfnClient, rootStackId, funcName);
        deploymentOp.previousMetaKey = previousMetaKey;
        steps.push({
            deployment: deploymentOp,
            rollback,
        });
        rollback = deploymentOp;
        previousMetaKey = getTempFuncMetaS3Key(funcName);
    }
    return { deploymentSteps: steps, lastMetaKey: previousMetaKey };
};
exports.generateIterativeFuncDeploymentSteps = generateIterativeFuncDeploymentSteps;
const prependDeploymentSteps = (beforeSteps, afterSteps, beforeStepsLastMetaKey) => {
    if (beforeSteps.length === 0) {
        return afterSteps;
    }
    beforeSteps[0].rollback = lodash_1.default.cloneDeep(afterSteps[0].rollback);
    beforeSteps[0].deployment.previousMetaKey = afterSteps[0].deployment.previousMetaKey;
    afterSteps[0].rollback = lodash_1.default.cloneDeep(beforeSteps[beforeSteps.length - 1].deployment);
    afterSteps[0].deployment.previousMetaKey = beforeStepsLastMetaKey;
    if (afterSteps.length > 1) {
        afterSteps[1].rollback.previousMetaKey = beforeStepsLastMetaKey;
    }
    return beforeSteps.concat(afterSteps);
};
exports.prependDeploymentSteps = prependDeploymentSteps;
const generateIterativeFuncDeploymentOp = async (cfnClient, rootStackId, functionName) => {
    const funcStack = await cfnClient
        .describeStackResources({ StackName: rootStackId, LogicalResourceId: `function${functionName}` })
        .promise();
    if (!funcStack.StackResources || funcStack.StackResources.length === 0) {
        throw new amplify_cli_core_1.AmplifyFault('ResourceNotFoundFault', {
            message: `Could not find function ${functionName} in root stack ${rootStackId}`,
        });
    }
    const funcStackId = funcStack.StackResources[0].PhysicalResourceId;
    const { parameters, capabilities } = await (0, amplify_resource_state_utils_1.getPreviousDeploymentRecord)(cfnClient, funcStackId);
    const funcCfnParams = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'function', functionName, {
        throwIfNotExist: false,
        default: {},
    });
    const funcEnvParams = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance.getResourceParamManager('function', functionName).getAllParams();
    const params = { ...parameters, ...funcCfnParams, ...funcEnvParams };
    const deploymentStep = {
        stackTemplatePathOrUrl: getTempFuncTemplateS3Key(functionName),
        parameters: params,
        stackName: funcStackId,
        capabilities,
        tableNames: [],
    };
    amplify_cli_core_1.JSONUtilities.writeJson(getTempFuncMetaLocalPath(functionName), deploymentStep);
    return deploymentStep;
};
const getTempFuncTemplateS3Key = (funcName) => path.posix.join(exports.s3Prefix, tempTemplateFilename(funcName));
const getTempFuncTemplateLocalPath = (funcName) => path.join((0, exports.localPrefix)(funcName), tempTemplateFilename(funcName));
const getTempFuncMetaLocalPath = (funcName) => path.join((0, exports.localPrefix)(funcName), tempMetaFilename(funcName));
const getTempFuncMetaS3Key = (funcName) => path.posix.join(exports.s3Prefix, tempMetaFilename(funcName));
const tempTemplateFilename = (funcName) => `temp-${funcName}-cloudformation-template.json`;
const tempMetaFilename = (funcName) => `temp-${funcName}-deployment-meta.json`;
exports.s3Prefix = 'amplify-cfn-templates/function/temp';
const localPrefix = (funcName) => path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, 'function', funcName), 'temp');
exports.localPrefix = localPrefix;
const replaceFnImport = (node) => {
    if (typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach((el) => replaceFnImport(el));
    }
    const nodeKeys = Object.keys(node);
    if (nodeKeys.length === 1 && nodeKeys[0] === 'Fn::ImportValue') {
        node['Fn::ImportValue'] = undefined;
        node['Fn::Sub'] = 'TemporaryPlaceholderValue';
        return;
    }
    Object.values(node).forEach((value) => replaceFnImport(value));
};
const funcParamsToDependentAppSyncModels = (funcParams) => {
    var _a;
    return Object.keys(((_a = funcParams === null || funcParams === void 0 ? void 0 : funcParams.permissions) === null || _a === void 0 ? void 0 : _a.storage) || {})
        .filter((key) => key.endsWith(':@model(appsync)'))
        .map((key) => key.slice(0, key.lastIndexOf(':')));
};
//# sourceMappingURL=utils.js.map