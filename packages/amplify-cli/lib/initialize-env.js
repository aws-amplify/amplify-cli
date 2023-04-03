"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.initializeEnv = void 0;
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const get_provider_plugins_1 = require("./extensions/amplify-helpers/get-provider-plugins");
const initializeEnv = async (context, currentAmplifyMeta = amplify_cli_core_1.stateManager.currentMetaFileExists() ? amplify_cli_core_1.stateManager.getCurrentMeta() : undefined) => {
    var _a, _b, _c, _d, _e;
    const currentEnv = context.exeInfo.localEnvInfo.envName;
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && ((_a = context.input.subCommands) === null || _a === void 0 ? void 0 : _a[0]) === 'pull');
    try {
        const { projectPath } = context.exeInfo.localEnvInfo;
        const amplifyMeta = { providers: {} };
        const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo(projectPath);
        amplifyMeta.providers.awscloudformation = (_b = teamProviderInfo === null || teamProviderInfo === void 0 ? void 0 : teamProviderInfo[currentEnv]) === null || _b === void 0 ? void 0 : _b.awscloudformation;
        const envParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)(currentEnv)).instance;
        const { providers } = amplify_cli_core_1.stateManager.getProjectConfig(undefined, { throwIfNotExist: false, default: {} });
        const CloudFormationProviderName = amplify_cli_core_1.constants.DEFAULT_PROVIDER;
        if (Array.isArray(providers) && providers.find((value) => value === CloudFormationProviderName)) {
            const downloadHandler = await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'getEnvParametersDownloadHandler', [context]);
            await envParamManager.downloadParameters(downloadHandler);
        }
        if (!context.exeInfo.restoreBackend) {
            mergeBackendConfigIntoAmplifyMeta(projectPath, amplifyMeta);
            mergeCategoryEnvParamsIntoAmplifyMeta(envParamManager, amplifyMeta, 'hosting', 'ElasticContainer');
            amplify_cli_core_1.stateManager.setMeta(projectPath, amplifyMeta);
        }
        const categoryInitializationTasks = [];
        const initializedCategories = Object.keys(amplify_cli_core_1.stateManager.getMeta());
        const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
        const availableCategories = Object.keys(categoryPluginInfoList).filter((key) => initializedCategories.includes(key));
        const importCategoryPluginAndQueueInitEnvTask = async (pluginInfo, category) => {
            try {
                const { initEnv } = await Promise.resolve().then(() => __importStar(require(pluginInfo.packageLocation)));
                if (initEnv) {
                    categoryInitializationTasks.push(() => initEnv(context));
                }
            }
            catch (e) {
                throw new amplify_cli_core_1.AmplifyFault('PluginNotLoadedFault', {
                    message: `Could not load plugin for category ${category}.`,
                    resolution: `Review the error message and stack trace for additional information.`,
                }, e);
            }
        };
        for (const category of availableCategories) {
            for (const pluginInfo of categoryPluginInfoList[category]) {
                await importCategoryPluginAndQueueInitEnvTask(pluginInfo, category);
            }
        }
        const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
        const initializationTasks = [];
        const providerPushTasks = [];
        for (const provider of (_d = (_c = context.exeInfo) === null || _c === void 0 ? void 0 : _c.projectConfig) === null || _d === void 0 ? void 0 : _d.providers) {
            try {
                const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
                initializationTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
            }
            catch (e) {
                throw new amplify_cli_core_1.AmplifyFault('PluginNotLoadedFault', {
                    message: `Could not load plugin for provider ${provider}.`,
                    resolution: 'Review the error message and stack trace for additional information.',
                }, e);
            }
        }
        amplify_cli_core_1.spinner.start(isPulling ? `Fetching updates to backend environment: ${currentEnv} from the cloud.` : `Initializing your environment: ${currentEnv}`);
        try {
            context.usageData.startCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.INIT_ENV_PLATFORM);
            await (0, promise_sequential_1.default)(initializationTasks);
        }
        catch (e) {
            amplify_cli_core_1.spinner.fail();
            throw new amplify_cli_core_1.AmplifyFault('ProjectInitFault', {
                message: `Could not initialize platform for '${currentEnv}': ${e.message}`,
                resolution: 'Review the error message and stack trace for additional information.',
            }, e);
        }
        finally {
            context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.INIT_ENV_PLATFORM);
        }
        amplify_cli_core_1.spinner.succeed(isPulling ? `Successfully pulled backend environment ${currentEnv} from the cloud.` : 'Initialized provider successfully.');
        const projectDetails = context.amplify.getProjectDetails();
        (_e = context.exeInfo) !== null && _e !== void 0 ? _e : (context.exeInfo = { inputParams: {}, localEnvInfo: {} });
        Object.assign(context.exeInfo, projectDetails);
        try {
            context.usageData.startCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
            await (0, promise_sequential_1.default)(categoryInitializationTasks);
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyFault('ProjectInitFault', {
                message: `Could not initialize categories for '${currentEnv}': ${e.message}`,
                resolution: 'Review the error message and stack trace for additional information.',
            }, e);
        }
        finally {
            context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
        }
        if (context.exeInfo.forcePush === undefined) {
            context.exeInfo.forcePush = await context.amplify.confirmPrompt('Do you want to push your resources to the cloud for your environment?');
        }
        if (context.exeInfo.forcePush) {
            for (const provider of context.exeInfo.projectConfig.providers) {
                const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
                const resourceDefinition = await context.amplify.getResourceStatus(undefined, undefined, provider);
                providerPushTasks.push(() => providerModule.pushResources(context, resourceDefinition));
            }
            await (0, promise_sequential_1.default)(providerPushTasks);
        }
        await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);
        amplify_prompts_1.printer.success(isPulling ? '' : 'Initialized your environment successfully.');
    }
    catch (e) {
        amplify_cli_core_1.spinner.fail('There was an error initializing your environment.');
        throw e;
    }
};
exports.initializeEnv = initializeEnv;
const mergeBackendConfigIntoAmplifyMeta = (projectPath, amplifyMeta) => {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(projectPath);
    Object.assign(amplifyMeta, backendConfig);
};
const mergeCategoryEnvParamsIntoAmplifyMeta = (envParamManager, amplifyMeta, category, serviceName) => {
    if (envParamManager.hasResourceParamManager(category, serviceName) &&
        envParamManager.getResourceParamManager(category, serviceName).hasAnyParams()) {
        Object.assign(amplifyMeta[category][serviceName], envParamManager.getResourceParamManager(category, serviceName).getAllParams());
    }
};
//# sourceMappingURL=initialize-env.js.map