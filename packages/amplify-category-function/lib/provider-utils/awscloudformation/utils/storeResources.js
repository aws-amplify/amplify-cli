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
exports.createParametersFile = exports.ensureLayerFolders = exports.saveCFNParameters = exports.saveMutableState = exports.updateLayerArtifacts = exports.createLayerArtifacts = exports.createFunctionResources = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("../../../constants");
const constants_2 = require("./constants");
const lambda_layer_cloudformation_template_1 = require("./lambda-layer-cloudformation-template");
const layerArnConverter_1 = require("./layerArnConverter");
const functionSecretsStateManager_1 = require("../secrets/functionSecretsStateManager");
const funcionStateUtils_1 = require("./funcionStateUtils");
const secretDeltaUtilities_1 = require("../secrets/secretDeltaUtilities");
const layerCloudState_1 = require("./layerCloudState");
const layerHelpers_1 = require("./layerHelpers");
const layerConfiguration_1 = require("./layerConfiguration");
const environmentVariablesHelper_1 = require("./environmentVariablesHelper");
const truncateResourceNames_1 = require("./truncateResourceNames");
const createFunctionResources = async (context, parameters) => {
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_1.categoryName, parameters.resourceName || parameters.functionName, translateFuncParamsToResourceOpts(parameters));
    copyTemplateFiles(context, parameters);
    await (0, exports.saveMutableState)(context, parameters);
    (0, exports.saveCFNParameters)(parameters);
    context.amplify.leaveBreadcrumbs(constants_1.categoryName, parameters.resourceName, createBreadcrumbs(parameters));
};
exports.createFunctionResources = createFunctionResources;
const createLayerArtifacts = (context, parameters) => {
    const layerDirPath = (0, exports.ensureLayerFolders)(parameters);
    createLayerState(parameters, layerDirPath);
    createLayerCfnFile(parameters, layerDirPath);
    addLayerToAmplifyMeta(context, parameters);
    return layerDirPath;
};
exports.createLayerArtifacts = createLayerArtifacts;
const defaultOpts = {
    updateLayerParams: true,
    generateCfnFile: true,
    updateMeta: true,
    updateDescription: true,
};
const updateLayerArtifacts = async (context, parameters, options = {}) => {
    options = lodash_1.default.assign(defaultOpts, options);
    const layerDirPath = (0, exports.ensureLayerFolders)(parameters);
    let updated = false;
    if (options.updateLayerParams) {
        updated || (updated = (0, layerConfiguration_1.saveLayerPermissions)(layerDirPath, parameters.permissions));
    }
    if (options.updateDescription) {
        updated || (updated = saveLayerDescription(parameters.layerName, parameters.description));
    }
    if (options.generateCfnFile) {
        const cfnTemplateFilePath = path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName));
        const currentCFNTemplate = amplify_cli_core_1.JSONUtilities.readJson(cfnTemplateFilePath, {
            throwIfNotExist: false,
        });
        const updatedCFNTemplate = await updateLayerCfnFile(context, parameters, layerDirPath);
        updated || (updated = lodash_1.default.isEqual(currentCFNTemplate, updatedCFNTemplate));
    }
    if (options.updateMeta) {
        updateLayerInAmplifyMeta(parameters);
    }
    return updated;
};
exports.updateLayerArtifacts = updateLayerArtifacts;
const saveMutableState = async (context, parameters) => {
    (0, exports.createParametersFile)(buildParametersFileObj(parameters), parameters.resourceName || parameters.functionName, constants_2.functionParametersFileName);
    (0, environmentVariablesHelper_1.saveEnvironmentVariables)(parameters.resourceName, parameters.environmentVariables);
    await syncSecrets(context, parameters);
};
exports.saveMutableState = saveMutableState;
const saveCFNParameters = (parameters) => {
    if ('trigger' in parameters) {
        const params = {
            modules: parameters.modules.join(),
            resourceName: parameters.resourceName,
        };
        (0, exports.createParametersFile)(params, parameters.resourceName, constants_2.parametersFileName);
    }
    if ('cloudwatchRule' in parameters) {
        const params = {
            CloudWatchRule: parameters.cloudwatchRule,
        };
        (0, exports.createParametersFile)(params, parameters.resourceName, constants_2.parametersFileName);
    }
};
exports.saveCFNParameters = saveCFNParameters;
const syncSecrets = async (context, parameters) => {
    if ('secretDeltas' in parameters) {
        const doConfirm = (0, secretDeltaUtilities_1.hasSetSecrets)(parameters.secretDeltas) && (0, funcionStateUtils_1.isFunctionPushed)(parameters.resourceName);
        const confirmed = doConfirm
            ? await context.amplify.confirmPrompt('This will immediately update secret values in the cloud. Do you want to continue?', true)
            : true;
        if (confirmed) {
            const functionSecretsStateManager = await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context);
            await functionSecretsStateManager.syncSecretDeltas(parameters === null || parameters === void 0 ? void 0 : parameters.secretDeltas, parameters.resourceName);
        }
        if ((0, secretDeltaUtilities_1.hasExistingSecrets)(parameters.secretDeltas)) {
            context.print.info('Use the AWS SSM GetParameter API to retrieve secrets in your Lambda function.');
            context.print.info('More information can be found here: https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html');
        }
    }
};
const createLayerState = (parameters, layerDirPath) => {
    writeLayerRuntimesToParametersFile(parameters);
    saveLayerDescription(parameters.layerName, parameters.description);
    (0, layerConfiguration_1.createLayerConfiguration)(layerDirPath, { permissions: parameters.permissions, runtimes: parameters.runtimes });
};
const writeLayerRuntimesToParametersFile = (parameters) => {
    const runtimes = parameters.runtimes.reduce((runtimesAccumulator, r) => {
        runtimesAccumulator = runtimesAccumulator.concat(r.cloudTemplateValues);
        return runtimesAccumulator;
    }, []);
    if (runtimes.length > 0) {
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, constants_1.categoryName, parameters.layerName, { runtimes });
    }
};
const saveLayerDescription = (layerName, description) => {
    const layerConfig = (0, layerConfiguration_1.loadLayerParametersJson)(layerName);
    let updated = false;
    if (layerConfig.description !== description) {
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, constants_1.categoryName, layerName, {
            ...layerConfig,
            description,
        });
        updated = true;
    }
    return updated;
};
const copyTemplateFiles = (context, parameters) => {
    const destDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const copyJobs = parameters.functionTemplate.sourceFiles.map((file) => ({
        dir: parameters.functionTemplate.sourceRoot,
        template: file,
        target: path.join(destDir, constants_1.categoryName, parameters.resourceName, lodash_1.default.get(parameters.functionTemplate.destMap, file, file.replace(/\.ejs$/, ''))),
    }));
    parameters = {
        ...parameters,
        ...(0, truncateResourceNames_1.truncateResourceNames)(parameters),
    };
    let templateParams = parameters;
    if ('trigger' in parameters) {
        const triggerEnvs = context.amplify.loadEnvResourceParameters(context, constants_1.categoryName, parameters.resourceName);
        parameters.triggerEnvs = amplify_cli_core_1.JSONUtilities.parse(parameters.triggerEnvs) || [];
        parameters.triggerEnvs.forEach((c) => {
            triggerEnvs[c.key] = c.value;
        });
        templateParams = lodash_1.default.assign(templateParams, triggerEnvs);
    }
    templateParams = lodash_1.default.assign(templateParams, {
        enableCors: process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER === 'true',
    });
    context.amplify.copyBatch(context, copyJobs, templateParams, false);
    const cloudTemplateJob = {
        dir: '',
        template: parameters.cloudResourceTemplatePath,
        target: path.join(destDir, constants_1.categoryName, parameters.resourceName, `${parameters.resourceName}-cloudformation-template.json`),
    };
    const copyJobParams = parameters;
    if ('lambdaLayers' in parameters) {
        const layerCFNValues = (0, layerArnConverter_1.convertLambdaLayerMetaToLayerCFNArray)(parameters.lambdaLayers, context.amplify.getEnvInfo().envName);
        copyJobParams.lambdaLayersCFNArray = layerCFNValues;
    }
    context.amplify.copyBatch(context, [cloudTemplateJob], copyJobParams, false);
};
const ensureLayerFolders = (parameters) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const layerDirPath = path.join(projectBackendDirPath, constants_1.categoryName, parameters.layerName);
    fs.ensureDirSync(path.join(layerDirPath, 'opt'));
    parameters.runtimes.forEach((runtime) => ensureLayerRuntimeFolder(layerDirPath, runtime));
    return layerDirPath;
};
exports.ensureLayerFolders = ensureLayerFolders;
const ensureLayerRuntimeFolder = (layerDirPath, runtime) => {
    const runtimeDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
    if (!fs.pathExistsSync(runtimeDirPath)) {
        fs.ensureDirSync(runtimeDirPath);
        fs.writeFileSync(path.join(runtimeDirPath, 'README.txt'), 'Replace this file with your layer files');
        (runtime.layerDefaultFiles || []).forEach((defaultFile) => fs.writeFileSync(path.join(layerDirPath, 'lib', defaultFile.path, defaultFile.filename), defaultFile.content));
    }
};
const createLayerCfnFile = (parameters, layerDirPath) => {
    const layerCfnObj = (0, lambda_layer_cloudformation_template_1.generateLayerCfnObj)(true, parameters);
    const layerCfnFilePath = path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName));
    amplify_cli_core_1.JSONUtilities.writeJson(layerCfnFilePath, layerCfnObj);
};
const updateLayerCfnFile = async (context, parameters, layerDirPath) => {
    let layerVersionList = [];
    if ((0, layerHelpers_1.loadPreviousLayerHash)(parameters.layerName)) {
        const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(parameters.layerName);
        layerVersionList = await layerCloudState.getLayerVersionsFromCloud(context, parameters.layerName);
    }
    const _isNewVersion = await (0, layerHelpers_1.isNewVersion)(parameters.layerName);
    const cfnTemplate = saveCFNFileWithLayerVersion(layerDirPath, parameters, _isNewVersion, layerVersionList);
    return cfnTemplate;
};
const setParametersInAmplifyMeta = (layerName, parameters) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    lodash_1.default.setWith(amplifyMeta, [constants_1.categoryName, layerName], parameters);
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
const assignParametersInAmplifyMeta = (layerName, parameters) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const layer = lodash_1.default.get(amplifyMeta, [constants_1.categoryName, layerName], {});
    lodash_1.default.assign(layer, parameters);
    lodash_1.default.setWith(amplifyMeta, [constants_1.categoryName, layerName], layer);
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
const addLayerToAmplifyMeta = (context, parameters) => {
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_1.categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
    setParametersInAmplifyMeta(parameters.layerName, amplifyMetaAndBackendParams(parameters));
};
const updateLayerInAmplifyMeta = (parameters) => {
    assignParametersInAmplifyMeta(parameters.layerName, amplifyMetaAndBackendParams(parameters));
};
const amplifyMetaAndBackendParams = (parameters) => {
    const metadata = {
        providerPlugin: parameters.providerContext.provider,
        service: parameters.providerContext.service,
        build: parameters.build,
    };
    if (parameters.versionHash) {
        metadata.versionHash = parameters.versionHash;
    }
    return metadata;
};
const createParametersFile = (parameters, resourceName, paramFileName) => {
    const parametersFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName, paramFileName);
    const currentParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
    delete currentParameters.mutableParametersState;
    amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
};
exports.createParametersFile = createParametersFile;
const buildParametersFileObj = (parameters) => {
    if ('trigger' in parameters) {
        return lodash_1.default.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
    }
    return { ...parameters.mutableParametersState, ...lodash_1.default.pick(parameters, ['lambdaLayers']) };
};
const translateFuncParamsToResourceOpts = (params) => {
    const result = {
        build: true,
        providerPlugin: constants_2.provider,
        service: "Lambda",
    };
    if (!('trigger' in params)) {
        result.dependsOn = params.dependsOn;
    }
    return result;
};
const createBreadcrumbs = (params) => {
    if ('trigger' in params) {
        return {
            pluginId: 'amplify-nodejs-function-runtime-provider',
            functionRuntime: 'nodejs',
            useLegacyBuild: true,
            defaultEditorFile: 'src/index.js',
        };
    }
    return {
        pluginId: params.runtimePluginId,
        functionRuntime: params.runtime.value,
        useLegacyBuild: params.runtime.value === 'nodejs',
        defaultEditorFile: params.functionTemplate.defaultEditorFile,
    };
};
const saveCFNFileWithLayerVersion = (layerDirPath, parameters, _isNewVersion, layerVersionList) => {
    const cfnTemplate = (0, lambda_layer_cloudformation_template_1.generateLayerCfnObj)(_isNewVersion, parameters, layerVersionList);
    amplify_cli_core_1.JSONUtilities.writeJson(path.join(layerDirPath, getCfnTemplateFileName(parameters.layerName)), cfnTemplate);
    return cfnTemplate;
};
const getCfnTemplateFileName = (layerName) => `${layerName}${constants_2.cfnTemplateSuffix}`;
//# sourceMappingURL=storeResources.js.map