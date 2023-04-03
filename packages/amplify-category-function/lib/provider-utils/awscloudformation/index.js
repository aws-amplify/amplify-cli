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
exports.isMockable = exports.openConsole = exports.updateConfigOnEnvInit = exports.getPermissionPolicies = exports.migrateResource = exports.updateLayerResource = exports.updateFunctionResource = exports.updateResource = exports.addLayerResource = exports.addFunctionResource = exports.addResource = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("../../constants");
const supported_services_1 = require("../supported-services");
const constants_2 = require("./utils/constants");
const convertLayersTypes_1 = require("./utils/convertLayersTypes");
const funcParamsUtils_1 = require("./utils/funcParamsUtils");
const layerConfiguration_1 = require("./utils/layerConfiguration");
const layerHelpers_1 = require("./utils/layerHelpers");
const storeResources_1 = require("./utils/storeResources");
const amplify_cli_core_2 = require("amplify-cli-core");
async function addResource(context, category, service, options, parameters) {
    const serviceConfig = supported_services_1.supportedServices[service];
    const BAD_SERVICE_ERR = new Error(`amplify-category-function is not configured to provide service type ${service}`);
    if (!serviceConfig) {
        throw BAD_SERVICE_ERR;
    }
    switch (service) {
        case "Lambda":
            return addFunctionResource(context, category, service, serviceConfig, parameters);
        case "LambdaLayer":
            return addLayerResource(context, service, serviceConfig, parameters);
        default:
            throw BAD_SERVICE_ERR;
    }
}
exports.addResource = addResource;
async function addFunctionResource(context, category, service, serviceConfig, parameters) {
    let completeParams;
    if (!parameters || (!(0, funcParamsUtils_1.isComplete)(parameters) && !('trigger' in parameters))) {
        let funcParams = {
            providerContext: {
                provider: constants_2.provider,
                service: service,
                projectName: context.amplify.getProjectDetails().projectConfig.projectName,
            },
        };
        funcParams = (0, funcParamsUtils_1.merge)(funcParams, parameters);
        funcParams = (0, funcParamsUtils_1.merge)(funcParams, { cloudResourceTemplatePath: serviceConfig.cfnFilename });
        funcParams = (0, funcParamsUtils_1.merge)(funcParams, {
            environmentMap: {
                ENV: {
                    Ref: 'env',
                },
                REGION: {
                    Ref: 'AWS::Region',
                },
            },
        });
        funcParams = (0, funcParamsUtils_1.merge)(funcParams, { lambdaLayers: [] });
        await serviceConfig.walkthroughs.createWalkthrough(context, funcParams);
        completeParams = (0, funcParamsUtils_1.convertToComplete)(funcParams);
    }
    else {
        completeParams = parameters;
    }
    await (0, storeResources_1.createFunctionResources)(context, completeParams);
    (0, amplify_cli_core_2.createDefaultCustomPoliciesFile)(category, completeParams.resourceName);
    if (!completeParams.skipEdit) {
        await openEditor(context, category, completeParams.resourceName, completeParams.functionTemplate);
    }
    if (completeParams.skipNextSteps) {
        return completeParams.resourceName;
    }
    const { print } = context;
    const customPoliciesPath = amplify_cli_core_1.pathManager.getCustomPoliciesPath(category, completeParams.resourceName);
    print.success(`Successfully added resource ${completeParams.resourceName} locally.`);
    print.info('');
    print.success('Next steps:');
    print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${completeParams.resourceName}/src`);
    print.info('"amplify function build" builds all of your functions currently in the project');
    print.info('"amplify mock function <functionName>" runs your function locally');
    print.info(`To access AWS resources outside of this Amplify app, edit the ${customPoliciesPath}`);
    print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
    print.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
    return completeParams.resourceName;
}
exports.addFunctionResource = addFunctionResource;
async function addLayerResource(context, service, serviceConfig, parameters = {}) {
    parameters.providerContext = {
        provider: constants_2.provider,
        service: service,
        projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    };
    const completeParams = (await serviceConfig.walkthroughs.createWalkthrough(context, parameters));
    (0, storeResources_1.createLayerArtifacts)(context, completeParams);
    printLayerSuccessMessages(context, completeParams, 'created');
    return completeParams.layerName;
}
exports.addLayerResource = addLayerResource;
async function updateResource(context, category, service, parameters, resourceToUpdate) {
    const serviceConfig = supported_services_1.supportedServices[service];
    const BAD_SERVICE_ERR = new Error(`amplify-category-function is not configured to provide service type ${service}`);
    if (!serviceConfig) {
        throw BAD_SERVICE_ERR;
    }
    switch (service) {
        case "Lambda":
            return updateFunctionResource(context, category, service, parameters, resourceToUpdate);
        case "LambdaLayer":
            return updateLayerResource(context, service, serviceConfig, parameters);
        default:
            throw BAD_SERVICE_ERR;
    }
}
exports.updateResource = updateResource;
async function updateFunctionResource(context, category, service, parameters, resourceToUpdate) {
    const serviceConfig = supported_services_1.supportedServices[service];
    if (!serviceConfig) {
        throw `amplify-category-function is not configured to provide service type ${service}`;
    }
    if (parameters && 'trigger' in parameters) {
        const parametersFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceToUpdate, constants_2.functionParametersFileName);
        let previousParameters;
        if (fs.existsSync(parametersFilePath)) {
            previousParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath);
            if ('trigger' in previousParameters) {
                parameters = lodash_1.default.assign({}, previousParameters, parameters);
                if (parameters.triggerEnvs && parameters.triggerEnvs instanceof String) {
                    parameters.triggerEnvs = amplify_cli_core_1.JSONUtilities.parse(parameters.triggerEnvs) || [];
                }
            }
        }
        await (0, storeResources_1.saveMutableState)(context, parameters);
        (0, storeResources_1.saveCFNParameters)(parameters);
    }
    else {
        parameters = await serviceConfig.walkthroughs.updateWalkthrough(context, parameters, resourceToUpdate);
        if (parameters.dependsOn) {
            context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.resourceName, 'dependsOn', parameters.dependsOn);
        }
        await (0, storeResources_1.saveMutableState)(context, parameters);
        (0, storeResources_1.saveCFNParameters)(parameters);
    }
    if (!parameters || (parameters && !parameters.skipEdit)) {
        const breadcrumb = context.amplify.readBreadcrumbs(constants_1.categoryName, parameters.resourceName);
        const displayName = 'trigger' in parameters ? parameters.resourceName : undefined;
        await openEditor(context, category, parameters.resourceName, { defaultEditorFile: breadcrumb.defaultEditorFile }, displayName, false);
    }
    return parameters.resourceName;
}
exports.updateFunctionResource = updateFunctionResource;
async function updateLayerResource(context, service, serviceConfig, parameters) {
    if (!serviceConfig) {
        throw new Error(`amplify-category-function is not configured to provide service type ${service}`);
    }
    if (!parameters) {
        parameters = {};
        parameters.providerContext = {
            provider: constants_2.provider,
            service: service,
            projectName: context.amplify.getProjectDetails().projectConfig.projectName,
        };
    }
    const updateWalkthroughResult = (await serviceConfig.walkthroughs.updateWalkthrough(context, undefined, parameters));
    if (updateWalkthroughResult.resourceUpdated === false) {
        return;
    }
    await (0, storeResources_1.updateLayerArtifacts)(context, updateWalkthroughResult.parameters, {
        updateLayerParams: parameters.selectedVersion === undefined,
        generateCfnFile: parameters.selectedVersion !== undefined,
    });
    printLayerSuccessMessages(context, updateWalkthroughResult.parameters, 'updated');
}
exports.updateLayerResource = updateLayerResource;
function printLayerSuccessMessages(context, parameters, action) {
    const { print } = context;
    const { layerName } = parameters;
    const relativeDirPath = path.join(amplify_cli_core_1.PathConstants.AmplifyDirName, amplify_cli_core_1.PathConstants.BackendDirName, constants_1.categoryName, layerName);
    print.info(`✅ Lambda layer folders & files ${action}:`);
    print.info(relativeDirPath);
    print.info('');
    print.success('Next steps:');
    if (parameters.runtimes.length !== 0) {
        print.info('Move your libraries to the following folder:');
        for (const runtime of parameters.runtimes) {
            const runtimePath = path.join(relativeDirPath, 'lib', runtime.layerExecutablePath);
            print.info(`[${runtime.name}]: ${runtimePath}`);
        }
        print.info('');
    }
    print.info('Include any files you want to share across runtimes in this folder:');
    print.info(path.join(relativeDirPath, 'opt'));
    print.info('');
    print.info('"amplify function update <function-name>" - configure a function with this Lambda layer');
    print.info('"amplify push" - builds all of your local backend resources and provisions them in the cloud');
}
async function openEditor(context, category, resourceName, template, displayName = 'local', defaultConfirm = true) {
    const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    if (await context.amplify.confirmPrompt(`Do you want to edit the ${displayName} lambda function now?`, defaultConfirm)) {
        let targetFile = '';
        if (template) {
            if (template.defaultEditorFile) {
                targetFile = template.defaultEditorFile;
            }
            else if (template.sourceFiles && template.sourceFiles.length > 0) {
                const srcFile = template.sourceFiles[0];
                targetFile = lodash_1.default.get(template, ['destMap', srcFile], srcFile);
            }
        }
        const target = path.join(targetDir, category, resourceName, targetFile);
        await context.amplify.openEditor(context, target);
    }
}
function migrateResource(context, projectPath, service, resourceName) {
    if (service !== "Lambda") {
        throw new Error(`Could not get permission policies for unsupported service: ${service}`);
    }
    const serviceConfig = supported_services_1.supportedServices[service];
    if (!serviceConfig.walkthroughs.migrate) {
        context.print.info(`No migration required for ${resourceName}`);
        return undefined;
    }
    return serviceConfig.walkthroughs.migrate(context, projectPath, resourceName);
}
exports.migrateResource = migrateResource;
function getPermissionPolicies(context, service, resourceName, crudOptions) {
    if (service !== "Lambda") {
        throw new Error(`Could not get permission policies for unsupported service: ${service}`);
    }
    const serviceConfig = supported_services_1.supportedServices[service];
    if (!serviceConfig.walkthroughs.getIAMPolicies) {
        context.print.info(`No policies found for ${resourceName}`);
        return undefined;
    }
    return serviceConfig.walkthroughs.getIAMPolicies(resourceName, crudOptions);
}
exports.getPermissionPolicies = getPermissionPolicies;
function isInHeadlessMode(context) {
    return context.exeInfo.inputParams.yes;
}
function getHeadlessParams(context, resourceName) {
    const { inputParams = {} } = context.exeInfo;
    return inputParams.categories && inputParams.categories.function && Array.isArray(inputParams.categories.function)
        ? inputParams.categories.function.find((i) => i.resourceName === resourceName) || {}
        : {};
}
async function updateConfigOnEnvInit(context, resourceName, service) {
    var _a, _b, _c;
    if (service === "Lambda") {
        const serviceMetaData = supported_services_1.supportedServices[service];
        const providerPlugin = context.amplify.getPluginInstance(context, serviceMetaData.provider);
        const functionParametersPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName, 'function-parameters.json');
        let resourceParams = {};
        const functionParametersExists = fs.existsSync(functionParametersPath);
        if (functionParametersExists) {
            resourceParams = amplify_cli_core_1.JSONUtilities.readJson(functionParametersPath);
        }
        let envParams = {};
        if (isInHeadlessMode(context)) {
            const functionParams = getHeadlessParams(context, resourceName);
            return functionParams;
        }
        if (resourceParams.trigger === true) {
            envParams = await initTriggerEnvs(context, resourceParams, providerPlugin, envParams, serviceMetaData);
        }
        if (Array.isArray(resourceParams.lambdaLayers) && resourceParams.lambdaLayers.length) {
            const envName = context.amplify.getEnvInfo().envName;
            const modifiedLambdaLayers = [];
            modifiedLambdaLayers.push(...(0, convertLayersTypes_1.convertProjectLayersToExternalLayers)(resourceParams.lambdaLayers, envName));
            modifiedLambdaLayers.push(...(0, convertLayersTypes_1.convertExternalLayersToProjectLayers)(resourceParams.lambdaLayers, envName));
            resourceParams.lambdaLayers = modifiedLambdaLayers;
            amplify_cli_core_1.JSONUtilities.writeJson(functionParametersPath, resourceParams);
        }
        return envParams;
    }
    else if ((0, layerHelpers_1.isMultiEnvLayer)(resourceName) && service === "LambdaLayer") {
        const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
        const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta(projectPath);
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta(projectPath);
        const currentCloudVersionHash = lodash_1.default.get(currentAmplifyMeta, [constants_1.categoryName, resourceName, constants_2.versionHash], undefined);
        if (currentCloudVersionHash) {
            lodash_1.default.setWith(amplifyMeta, [constants_1.categoryName, resourceName, constants_2.versionHash], currentCloudVersionHash);
        }
        if (context.input.command === 'env' && ((_a = context.input) === null || _a === void 0 ? void 0 : _a.subCommands.includes('checkout')) && !((_c = (_b = context.exeInfo) === null || _b === void 0 ? void 0 : _b.inputParams) === null || _c === void 0 ? void 0 : _c.restore)) {
            const currentParametersJson = amplify_cli_core_1.stateManager.getCurrentResourceParametersJson(projectPath, constants_1.categoryName, resourceName, { throwIfNotExist: false }) || undefined;
            if (currentParametersJson) {
                const backendParametersJson = (0, layerConfiguration_1.loadLayerParametersJson)(resourceName);
                backendParametersJson.description = currentParametersJson.description;
                amplify_cli_core_1.stateManager.setResourceParametersJson(projectPath, constants_1.categoryName, resourceName, backendParametersJson);
            }
            const currentCfnTemplatePath = amplify_cli_core_1.pathManager.getCurrentCfnTemplatePath(projectPath, constants_1.categoryName, resourceName);
            const { cfnTemplate: currentCfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(currentCfnTemplatePath, { throwIfNotExist: false }) || {};
            if (currentCfnTemplate !== undefined) {
                await (0, amplify_cli_core_1.writeCFNTemplate)(currentCfnTemplate, amplify_cli_core_1.pathManager.getResourceCfnTemplatePath(projectPath, constants_1.categoryName, resourceName));
            }
        }
    }
    return undefined;
}
exports.updateConfigOnEnvInit = updateConfigOnEnvInit;
async function initTriggerEnvs(context, resourceParams, providerPlugin, envParams, serviceMetaData) {
    if (resourceParams && resourceParams.parentStack && resourceParams.parentResource) {
        const parentResourceParams = providerPlugin.loadResourceParameters(context, resourceParams.parentStack, resourceParams.parentResource);
        const triggers = typeof parentResourceParams.triggers === 'string' ? JSON.parse(parentResourceParams.triggers) : parentResourceParams.triggers;
        const currentTrigger = resourceParams.resourceName.replace(parentResourceParams.resourceName, '');
        if (currentTrigger && currentTrigger !== resourceParams.resourceName) {
            const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, constants_1.categoryName, resourceParams.resourceName);
            const categoryPlugin = context.amplify.getCategoryPluginInfo(context, resourceParams.parentStack);
            const triggerPath = path.join(categoryPlugin.packageLocation, 'provider-utils', `${serviceMetaData.provider}`, 'triggers', `${currentTrigger}`);
            const isEnvCommand = context.input.command === 'env';
            if (!isEnvCommand) {
                envParams = await context.amplify.getTriggerEnvInputs(context, triggerPath, currentTrigger, triggers[currentTrigger], currentEnvVariables);
            }
            else {
                envParams = currentEnvVariables;
            }
        }
    }
    return envParams;
}
async function openConsole(context, service) {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const region = amplifyMeta.providers[constants_2.provider].Region;
    const selection = service === "Lambda" ? 'functions' : 'layers';
    const url = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/${selection}`;
    await (0, amplify_cli_core_1.open)(url, { wait: false });
}
exports.openConsole = openConsole;
function isMockable(service) {
    return {
        isMockable: service === "Lambda",
        reason: 'Lambda layers cannot be mocked locally',
    };
}
exports.isMockable = isMockable;
//# sourceMappingURL=index.js.map