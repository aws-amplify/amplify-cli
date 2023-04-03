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
exports.getAwsConfig = exports.resolveRegion = exports.resetCache = exports.loadConfigurationForEnv = exports.loadConfiguration = exports.onInitSuccessful = exports.configure = exports.init = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = require("inquirer");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const aws_sdk_1 = require("aws-sdk");
const aws_regions_1 = __importDefault(require("./aws-regions"));
const constants_1 = __importDefault(require("./constants"));
const setupNewUser = __importStar(require("./setup-new-user"));
const utility_obfuscate_1 = __importDefault(require("./utility-obfuscate"));
const systemConfigManager = __importStar(require("./system-config-manager"));
const admin_helpers_1 = require("./utils/admin-helpers");
const resolve_appId_1 = require("./utils/resolve-appId");
const configuration_questions_1 = require("./question-flows/configuration-questions");
const defaultAWSConfig = {
    useProfile: true,
    profileName: 'default',
};
async function init(context) {
    var _a;
    if (((_a = context.exeInfo.existingLocalEnvInfo) === null || _a === void 0 ? void 0 : _a.noUpdateBackend) || (!context.exeInfo.isNewProject && doesAwsConfigExists(context))) {
        return context;
    }
    normalizeInputParams(context);
    const authTypeConfig = await determineAuthFlow(context);
    if (authTypeConfig.type === 'admin') {
        context.exeInfo.awsConfigInfo = {
            configLevel: 'amplifyAdmin',
            config: {},
        };
    }
    else if (authTypeConfig.type === 'accessKeys') {
        context.exeInfo.awsConfigInfo = {
            configLevel: 'project',
            config: { useProfile: false },
        };
    }
    else if (authTypeConfig.type === 'general') {
        context.exeInfo.awsConfigInfo = {
            configLevel: 'general',
            config: {},
        };
    }
    else {
        context.exeInfo.awsConfigInfo = {
            configLevel: 'project',
            config: defaultAWSConfig,
        };
        await newUserCheck(context);
    }
    return await initialize(context, authTypeConfig);
}
exports.init = init;
async function configure(context) {
    context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
    normalizeInputParams(context);
    context.exeInfo.awsConfigInfo = getCurrentConfig(context);
    if (context.exeInfo.inputParams.containerSetting) {
        await enableServerlessContainers(context);
    }
    if (context.exeInfo.inputParams.profileSetting) {
        await newUserCheck(context);
        printProfileInfo(context);
        await setProjectConfigAction(context);
        return await carryOutConfigAction(context);
    }
    return undefined;
}
exports.configure = configure;
async function enableServerlessContainers(context) {
    const { frontend } = context.exeInfo.projectConfig;
    const { config = {} } = context.exeInfo.projectConfig[frontend] || {};
    const { ServerlessContainers } = await (0, inquirer_1.prompt)({
        type: 'confirm',
        name: 'ServerlessContainers',
        message: 'Do you want to enable container-based deployments?',
        default: config.ServerlessContainers === true,
    });
    if (!context.exeInfo.projectConfig[frontend]) {
        context.exeInfo.projectConfig[frontend] = { config };
    }
    context.exeInfo.projectConfig[frontend].config = { ...config, ServerlessContainers };
}
function doesAwsConfigExists(context) {
    var _a, _b;
    let configExists = false;
    const { envName } = ((_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.localEnvInfo) || context.amplify.getEnvInfo();
    if (amplify_cli_core_1.stateManager.localAWSInfoExists()) {
        const envAwsInfo = amplify_cli_core_1.stateManager.getLocalAWSInfo();
        if (envAwsInfo[envName]) {
            (_b = context.exeInfo) !== null && _b !== void 0 ? _b : (context.exeInfo = { inputParams: {}, localEnvInfo: {} });
            context.exeInfo.awsConfigInfo = envAwsInfo[envName];
            context.exeInfo.awsConfigInfo.config = envAwsInfo[envName];
            configExists = true;
        }
    }
    return configExists;
}
function normalizeInputParams(context) {
    let inputParams;
    if (context.exeInfo.inputParams) {
        if (context.exeInfo.inputParams[constants_1.default.ProviderName]) {
            inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
        }
        else {
            for (const alias of constants_1.default.Aliases) {
                if (context.exeInfo.inputParams[alias]) {
                    inputParams = context.exeInfo.inputParams[alias];
                    break;
                }
            }
        }
    }
    if (inputParams) {
        const normalizedInputParams = { configLevel: undefined };
        if ((inputParams === null || inputParams === void 0 ? void 0 : inputParams.configLevel) === 'general') {
            normalizedInputParams.configLevel = 'general';
        }
        else {
            delete inputParams.configLevel;
            normalizedInputParams.configLevel = 'project';
            normalizedInputParams.config = inputParams;
        }
        if (normalizedInputParams.configLevel === 'project') {
            let errorMessage;
            if (!normalizedInputParams.config || Object.keys(normalizedInputParams.config).length < 1) {
                errorMessage = 'configLevel set to "project" but project level config is missing.';
            }
            else {
                if (!normalizedInputParams.config.useProfile) {
                    normalizedInputParams.config.useProfile = false;
                }
                if (normalizedInputParams.config.useProfile) {
                    if (!normalizedInputParams.config.profileName) {
                        errorMessage = 'project level config set useProfile to true, but profile name is missing.';
                    }
                }
                else if (!normalizedInputParams.config.accessKeyId ||
                    !normalizedInputParams.config.secretAccessKey ||
                    !normalizedInputParams.config.region) {
                    errorMessage = 'project level config set useProfile to false, but access key or region is missing.';
                }
            }
            if (errorMessage) {
                throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                    message: 'Error in the command line parameter for awscloudformation configuration.',
                    details: errorMessage,
                });
            }
        }
        context.exeInfo.inputParams[constants_1.default.ProviderName] = normalizedInputParams;
    }
}
async function carryOutConfigAction(context) {
    let result;
    switch (context.exeInfo.awsConfigInfo.action) {
        case 'init':
            result = await initialize(context);
            break;
        case 'create':
            result = await create(context);
            break;
        case 'update':
            result = await update(context);
            break;
        case 'remove':
            result = await remove(context);
            break;
        default:
            result = context;
    }
    return result;
}
async function initialize(context, authConfig) {
    var _a, _b;
    const { awsConfigInfo } = context.exeInfo;
    if ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.type) === 'accessKeys') {
        if ((((_a = awsConfigInfo.config) === null || _a === void 0 ? void 0 : _a.accessKeyId) && ((_b = awsConfigInfo.config) === null || _b === void 0 ? void 0 : _b.secretAccessKey)) ||
            ((authConfig === null || authConfig === void 0 ? void 0 : authConfig.accessKeyId) && (authConfig === null || authConfig === void 0 ? void 0 : authConfig.secretAccessKey))) {
            awsConfigInfo.config.accessKeyId = awsConfigInfo.config.accessKeyId || authConfig.accessKeyId;
            awsConfigInfo.config.secretAccessKey = awsConfigInfo.config.secretAccessKey || authConfig.secretAccessKey;
            awsConfigInfo.config.sessionToken = awsConfigInfo.config.sessionToken || authConfig.sessionToken;
            awsConfigInfo.config.region = awsConfigInfo.config.region || authConfig.region;
        }
        else {
            await promptForAuthConfig(context, authConfig);
        }
    }
    else if (awsConfigInfo.configLevel !== 'amplifyAdmin') {
        if (context.exeInfo.inputParams && context.exeInfo.inputParams[constants_1.default.ProviderName]) {
            const inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
            Object.assign(awsConfigInfo, inputParams);
        }
        else if (awsConfigInfo.configLevel === 'project' && (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes)) {
            await promptForAuthConfig(context, authConfig);
        }
    }
    await validateConfig(context);
    if (!awsConfigInfo.configValidated) {
        context.print.error('Invalid configuration settings!');
        const { retryConfirmation } = await (0, inquirer_1.prompt)(configuration_questions_1.retryAuthConfig);
        if (retryConfirmation) {
            if (authConfig.type === 'admin') {
                context.exeInfo.awsConfigInfo = {
                    configLevel: 'amplifyAdmin',
                    config: {},
                };
            }
            else if (authConfig.type === 'accessKeys') {
                context.exeInfo.awsConfigInfo = {
                    configLevel: 'project',
                    config: { useProfile: false },
                };
            }
            else {
                context.exeInfo.awsConfigInfo = {
                    configLevel: 'project',
                    config: defaultAWSConfig,
                };
            }
            return initialize(context, authConfig);
        }
        context.print.error('Exiting...');
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    return context;
}
function onInitSuccessful(context) {
    if (context.exeInfo.isNewEnv || !doesAwsConfigExists(context)) {
        persistLocalEnvConfig(context);
    }
    return context;
}
exports.onInitSuccessful = onInitSuccessful;
async function create(context) {
    const { awsConfigInfo } = context.exeInfo;
    if (context.exeInfo.inputParams[constants_1.default.ProviderName]) {
        const inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
        Object.assign(awsConfigInfo, inputParams);
    }
    else {
        await promptForAuthConfig(context);
    }
    await validateConfig(context);
    if (awsConfigInfo.configValidated) {
        persistLocalEnvConfig(context);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Invalid configuration settings.',
        });
    }
    return context;
}
async function update(context) {
    const { awsConfigInfo } = context.exeInfo;
    if (context.exeInfo.inputParams[constants_1.default.ProviderName]) {
        const inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
        Object.assign(awsConfigInfo, inputParams);
    }
    else {
        await promptForAuthConfig(context);
    }
    await validateConfig(context);
    if (awsConfigInfo.configValidated) {
        updateProjectConfig(context);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Invalid configuration settings.',
        });
    }
    return context;
}
async function remove(context) {
    const { awsConfigInfo } = context.exeInfo;
    await confirmProjectConfigRemoval(context);
    if (awsConfigInfo.action !== 'cancel') {
        removeProjectConfig(context.amplify.getEnvInfo().envName);
    }
    return context;
}
function printProfileInfo(context) {
    const url = 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html';
    context.print.info('');
    context.print.info('For more information on AWS Profiles, see:');
    context.print.info(chalk_1.default.green(url));
    context.print.info('');
}
async function setProjectConfigAction(context) {
    if (context.exeInfo.inputParams[constants_1.default.ProviderName]) {
        const inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
        if (context.exeInfo.awsConfigInfo.configLevel === 'project') {
            if (inputParams.configLevel === 'project') {
                context.exeInfo.awsConfigInfo.action = 'update';
            }
            else {
                context.exeInfo.awsConfigInfo.action = 'remove';
            }
        }
        else if (inputParams.configLevel === 'project') {
            context.exeInfo.awsConfigInfo.action = 'create';
            context.exeInfo.awsConfigInfo.configLevel = 'project';
        }
        else {
            context.exeInfo.awsConfigInfo.action = 'none';
            context.exeInfo.awsConfigInfo.configLevel = 'general';
        }
    }
    else {
        context.exeInfo.awsConfigInfo.action = 'none';
        context.print.info('For the awscloudformation provider.');
        if (context.exeInfo.awsConfigInfo.configLevel === 'project') {
            const answer = await (0, inquirer_1.prompt)(configuration_questions_1.updateOrRemoveQuestion);
            context.exeInfo.awsConfigInfo.action = answer.action;
        }
        else {
            const answer = await (0, inquirer_1.prompt)(configuration_questions_1.createConfirmQuestion);
            if (answer.setProjectLevelConfig) {
                context.exeInfo.awsConfigInfo.action = 'create';
                context.exeInfo.awsConfigInfo.configLevel = 'project';
            }
            else {
                context.exeInfo.awsConfigInfo.action = 'none';
                context.exeInfo.awsConfigInfo.configLevel = 'general';
            }
        }
    }
    return context;
}
async function confirmProjectConfigRemoval(context) {
    if (!context.exeInfo.inputParams.yes) {
        const answer = await (0, inquirer_1.prompt)(configuration_questions_1.removeProjectConfirmQuestion);
        context.exeInfo.awsConfigInfo.action = answer.removeProjectConfig ? 'remove' : 'cancel';
    }
    return context;
}
async function promptForAuthConfig(context, authConfig) {
    var _a;
    const { awsConfigInfo } = context.exeInfo;
    let availableProfiles = [];
    const namedProfiles = systemConfigManager.getNamedProfiles();
    if (namedProfiles) {
        availableProfiles = Object.keys(namedProfiles);
    }
    let answers;
    if (availableProfiles && availableProfiles.length > 0) {
        let authType;
        let isAdminApp = false;
        if (authConfig === null || authConfig === void 0 ? void 0 : authConfig.type) {
            authType = authConfig.type;
        }
        else {
            try {
                const appId = (0, resolve_appId_1.resolveAppId)(context);
                isAdminApp = ((_a = (await (0, admin_helpers_1.isAmplifyAdminApp)(appId))) === null || _a === void 0 ? void 0 : _a.isAdminApp) || false;
            }
            catch (_b) {
                isAdminApp = false;
            }
            authType = await askAuthType(isAdminApp);
        }
        if (authType === 'profile') {
            printProfileInfo(context);
            awsConfigInfo.config.useProfile = true;
            answers = await (0, inquirer_1.prompt)((0, configuration_questions_1.profileNameQuestion)(availableProfiles, awsConfigInfo.config.profileName));
            awsConfigInfo.config.profileName = answers.profileName;
            return;
        }
        if (authType === 'admin') {
            awsConfigInfo.configLevel = 'amplifyAdmin';
            awsConfigInfo.config.useProfile = false;
            return;
        }
        awsConfigInfo.config.useProfile = false;
        delete awsConfigInfo.config.profileName;
    }
    else {
        awsConfigInfo.config.useProfile = false;
    }
    answers = await (0, inquirer_1.prompt)((0, configuration_questions_1.accessKeysQuestion)(awsConfigInfo.config.accessKeyId ? utility_obfuscate_1.default.obfuscate(awsConfigInfo.config.accessKeyId) : constants_1.default.DefaultAWSAccessKeyId, awsConfigInfo.config.secretAccessKey
        ? utility_obfuscate_1.default.obfuscate(awsConfigInfo.config.secretAccessKey)
        : constants_1.default.DefaultAWSSecretAccessKey, awsConfigInfo.config.region || constants_1.default.DefaultAWSRegion, validateAccessKeyId, validateSecretAccessKey, utility_obfuscate_1.default.transform));
    if (!utility_obfuscate_1.default.isObfuscated(answers.accessKeyId)) {
        awsConfigInfo.config.accessKeyId = answers.accessKeyId;
    }
    if (!utility_obfuscate_1.default.isObfuscated(answers.secretAccessKey)) {
        awsConfigInfo.config.secretAccessKey = answers.secretAccessKey;
    }
    awsConfigInfo.config.sessionToken = awsConfigInfo.config.sessionToken || process.env.AWS_SESSION_TOKEN;
    awsConfigInfo.config.region = answers.region;
}
async function validateConfig(context) {
    const { awsConfigInfo } = context.exeInfo;
    awsConfigInfo.configValidated = false;
    if (awsConfigInfo.configLevel === 'general' || awsConfigInfo.configLevel === 'amplifyAdmin') {
        awsConfigInfo.configValidated = true;
    }
    else if (awsConfigInfo.config) {
        if (awsConfigInfo.config.useProfile) {
            if (awsConfigInfo.config.profileName && awsConfigInfo.config.profileName.length > 0) {
                awsConfigInfo.configValidated = true;
            }
        }
        else {
            awsConfigInfo.configValidated =
                awsConfigInfo.config.accessKeyId &&
                    awsConfigInfo.config.accessKeyId !== constants_1.default.DefaultAWSAccessKeyId &&
                    awsConfigInfo.config.secretAccessKey &&
                    awsConfigInfo.config.secretAccessKey !== constants_1.default.DefaultAWSSecretAccessKey &&
                    awsConfigInfo.config.region &&
                    aws_regions_1.default.regions.includes(awsConfigInfo.config.region);
            const sts = new aws_sdk_1.STS({
                credentials: {
                    accessKeyId: awsConfigInfo.config.accessKeyId,
                    secretAccessKey: awsConfigInfo.config.secretAccessKey,
                    sessionToken: awsConfigInfo.config.sessionToken,
                },
            });
            try {
                await sts.getCallerIdentity({}).promise();
            }
            catch (err) {
                awsConfigInfo.configValidated = false;
            }
        }
    }
    return context;
}
function persistLocalEnvConfig(context) {
    let { awsConfigInfo } = context.exeInfo;
    const { appId } = lodash_1.default.get(context, ['exeInfo', 'inputParams', 'amplify'], {});
    if (appId && (0, admin_helpers_1.doAdminTokensExist)(appId)) {
        awsConfigInfo = {
            configLevel: 'amplifyAdmin',
            config: {},
        };
    }
    const awsInfo = {
        configLevel: awsConfigInfo.configLevel,
    };
    if (awsConfigInfo.configLevel === 'general') {
        awsInfo.configLevel = 'general';
    }
    else if (awsConfigInfo.configLevel === 'amplifyAdmin') {
        awsInfo.configLevel = 'amplifyAdmin';
    }
    else {
        awsInfo.configLevel = 'project';
        if (awsConfigInfo.config.useProfile) {
            awsInfo.useProfile = true;
            awsInfo.profileName = awsConfigInfo.config.profileName;
        }
        else {
            awsInfo.useProfile = false;
            const awsSecrets = {
                accessKeyId: awsConfigInfo.config.accessKeyId,
                secretAccessKey: awsConfigInfo.config.secretAccessKey,
                sessionToken: awsConfigInfo.config.sessionToken,
                region: awsConfigInfo.config.region,
            };
            const sharedConfigDirPath = path_1.default.join(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath(), constants_1.default.ProviderName);
            fs_extra_1.default.ensureDirSync(sharedConfigDirPath);
            const awsSecretsFileName = context.amplify.makeId(10);
            const awsSecretsFilePath = path_1.default.join(sharedConfigDirPath, awsSecretsFileName);
            amplify_cli_core_1.JSONUtilities.writeJson(awsSecretsFilePath, awsSecrets);
            awsInfo.awsConfigFilePath = awsSecretsFilePath;
        }
    }
    const dotConfigDirPath = amplify_cli_core_1.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path_1.default.join(dotConfigDirPath, constants_1.default.LocalAWSInfoFileName);
    const { envName } = context.exeInfo.localEnvInfo;
    let envAwsInfo = {};
    if (fs_extra_1.default.existsSync(configInfoFilePath)) {
        envAwsInfo = amplify_cli_core_1.JSONUtilities.readJson(configInfoFilePath);
    }
    envAwsInfo[envName] = awsInfo;
    amplify_cli_core_1.JSONUtilities.writeJson(configInfoFilePath, envAwsInfo);
    return context;
}
function getCurrentConfig(context) {
    const { envName } = context.amplify.getEnvInfo();
    return getConfigForEnv(context, envName);
}
function getConfigForEnv(context, envName) {
    var _a;
    const projectConfigInfo = lodash_1.default.cloneDeep((_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.awsConfigInfo) || {
        configLevel: 'general',
        config: {},
    };
    const dotConfigDirPath = amplify_cli_core_1.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path_1.default.join(dotConfigDirPath, constants_1.default.LocalAWSInfoFileName);
    if (fs_extra_1.default.existsSync(configInfoFilePath)) {
        const configInfo = amplify_cli_core_1.JSONUtilities.readJson(configInfoFilePath)[envName];
        if (configInfo && configInfo.configLevel !== 'general' && configInfo.configLevel !== 'amplifyAdmin') {
            if (configInfo.useProfile && configInfo.profileName) {
                projectConfigInfo.config.useProfile = configInfo.useProfile;
                projectConfigInfo.config.profileName = configInfo.profileName;
            }
            else if (configInfo.awsConfigFilePath && fs_extra_1.default.existsSync(configInfo.awsConfigFilePath)) {
                const awsSecrets = amplify_cli_core_1.JSONUtilities.readJson(configInfo.awsConfigFilePath);
                projectConfigInfo.config.useProfile = false;
                projectConfigInfo.config.awsConfigFilePath = configInfo.awsConfigFilePath;
                projectConfigInfo.config.accessKeyId = awsSecrets.accessKeyId;
                projectConfigInfo.config.secretAccessKey = awsSecrets.secretAccessKey;
                projectConfigInfo.config.region = awsSecrets.region;
            }
            else {
                throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                    message: `Corrupt file contents in ${configInfoFilePath}`,
                });
            }
            projectConfigInfo.configLevel = 'project';
        }
        else if (configInfo) {
            projectConfigInfo.configLevel = configInfo.configLevel;
        }
    }
    return projectConfigInfo;
}
function updateProjectConfig(context) {
    removeProjectConfig(context.amplify.getEnvInfo().envName);
    persistLocalEnvConfig(context);
    return context;
}
function removeProjectConfig(envName) {
    const dotConfigDirPath = amplify_cli_core_1.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path_1.default.join(dotConfigDirPath, constants_1.default.LocalAWSInfoFileName);
    if (fs_extra_1.default.existsSync(configInfoFilePath)) {
        const configInfo = amplify_cli_core_1.JSONUtilities.readJson(configInfoFilePath);
        if (configInfo[envName]) {
            if (configInfo[envName].awsConfigFilePath && fs_extra_1.default.existsSync(configInfo[envName].awsConfigFilePath)) {
                fs_extra_1.default.removeSync(configInfo[envName].awsConfigFilePath);
            }
            configInfo[envName] = {
                configLevel: 'general',
            };
        }
        amplify_cli_core_1.JSONUtilities.writeJson(configInfoFilePath, configInfo);
    }
}
async function loadConfiguration(context) {
    const { envName } = context.amplify.getEnvInfo();
    const config = await loadConfigurationForEnv(context, envName);
    return config;
}
exports.loadConfiguration = loadConfiguration;
function loadConfigFromPath(profilePath) {
    if (fs_extra_1.default.existsSync(profilePath)) {
        const config = amplify_cli_core_1.JSONUtilities.readJson(profilePath);
        if (config.accessKeyId && config.secretAccessKey && config.region) {
            return config;
        }
    }
    throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
        message: `Invalid config ${profilePath}`,
    });
}
async function loadConfigurationForEnv(context, env, appId) {
    var _a, _b, _c;
    const { awsConfigInfo } = context.exeInfo || {};
    if (((_a = awsConfigInfo === null || awsConfigInfo === void 0 ? void 0 : awsConfigInfo.config) === null || _a === void 0 ? void 0 : _a.accessKeyId) && ((_b = awsConfigInfo === null || awsConfigInfo === void 0 ? void 0 : awsConfigInfo.config) === null || _b === void 0 ? void 0 : _b.secretAccessKey)) {
        if (!awsConfigInfo.region && !((_c = awsConfigInfo === null || awsConfigInfo === void 0 ? void 0 : awsConfigInfo.config) === null || _c === void 0 ? void 0 : _c.region)) {
            awsConfigInfo.region = resolveRegion();
            if (typeof awsConfigInfo.config === 'object') {
                awsConfigInfo.config.region = awsConfigInfo.region;
            }
        }
        return awsConfigInfo.config;
    }
    const projectConfigInfo = getConfigForEnv(context, env);
    const authType = await determineAuthFlow(context, projectConfigInfo);
    let awsConfig;
    if (authType.type === 'admin') {
        projectConfigInfo.configLevel = 'amplifyAdmin';
        appId = appId || authType.appId;
        try {
            awsConfig = await (0, admin_helpers_1.getTempCredsWithAdminTokens)(context, appId);
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('ProfileConfigurationError', {
                message: 'Failed to get AWS credentials',
                details: err.message,
            }, err);
        }
    }
    else if (authType.type === 'profile') {
        try {
            awsConfig = await systemConfigManager.getProfiledAwsConfig(context, authType.profileName);
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('ProfileConfigurationError', {
                message: 'Failed to get profile credentials',
                details: err.message,
            }, err);
        }
    }
    else if (authType.type === 'accessKeys') {
        awsConfig = loadConfigFromPath(projectConfigInfo.config.awsConfigFilePath);
    }
    return awsConfig;
}
exports.loadConfigurationForEnv = loadConfigurationForEnv;
async function resetCache(context) {
    const projectConfigInfo = getCurrentConfig(context);
    if (projectConfigInfo.configLevel === 'project') {
        const { config } = projectConfigInfo;
        if (config.useProfile) {
            await systemConfigManager.resetCache(context, config.profileName);
        }
    }
}
exports.resetCache = resetCache;
function resolveRegion() {
    let region;
    if (process.env.AWS_REGION) {
        region = process.env.AWS_REGION;
    }
    if (process.env.AMAZON_REGION) {
        region = process.env.AMAZON_REGION;
    }
    if (process.env.AWS_SDK_LOAD_CONFIG) {
        const profileName = process.env.AWS_PROFILE || 'default';
        region = systemConfigManager.getProfileRegion(profileName);
    }
    return region;
}
exports.resolveRegion = resolveRegion;
async function newUserCheck(context) {
    const configSource = scanConfig(context);
    if (!configSource) {
        if (context.exeInfo.inputParams[constants_1.default.ProviderName]) {
            const inputParams = context.exeInfo.inputParams[constants_1.default.ProviderName];
            const inputConfigSufficient = inputParams.configLevel === 'general' || (inputParams.configLevel === 'project' && !inputParams.config.useProfile);
            if (inputConfigSufficient) {
                return;
            }
        }
        if (context.exeInfo.inputParams.yes) {
            throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                message: 'AWS access credentials can not be found.',
            });
        }
        else {
            context.print.info('AWS access credentials can not be found.');
            const answer = await (0, inquirer_1.prompt)([
                {
                    type: 'confirm',
                    name: 'setupNewUser',
                    message: 'Setup new user',
                    default: true,
                },
            ]);
            if (answer.setupNewUser) {
                context.newUserInfo = await setupNewUser.run(context);
            }
        }
    }
}
function scanConfig(context) {
    let configSource = getConfigLevel(context);
    if (!configSource) {
        const namedProfiles = systemConfigManager.getNamedProfiles();
        if (namedProfiles && Object.keys(namedProfiles).length > 0) {
            configSource = 'profile-available';
        }
        if (namedProfiles && namedProfiles.default) {
            configSource = 'system';
        }
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && (process.env.AWS_REGION || process.env.AMAZON_REGION)) {
            configSource = 'envVar';
        }
        if (process.env.AWS_PROFILE && namedProfiles && namedProfiles[process.env.AWS_PROFILE.trim()]) {
            configSource = 'envVar-profile';
        }
    }
    return configSource;
}
function getConfigLevel(context) {
    let configLevel;
    try {
        const namedProfiles = systemConfigManager.getNamedProfiles();
        const configInfoFilePath = amplify_cli_core_1.pathManager.getLocalAWSInfoFilePath();
        if (fs_extra_1.default.existsSync(configInfoFilePath)) {
            const { envName } = context.amplify.getEnvInfo();
            const envConfigInfo = amplify_cli_core_1.JSONUtilities.readJson(configInfoFilePath)[envName];
            if (envConfigInfo) {
                if (envConfigInfo.configLevel === 'general') {
                    configLevel = 'general';
                }
                else if (envConfigInfo.configLevel === 'amplifyAdmin') {
                    configLevel = 'amplifyAdmin';
                }
                else if (envConfigInfo.useProfile && envConfigInfo.profileName && namedProfiles && namedProfiles[envConfigInfo.profileName]) {
                    configLevel = 'project';
                }
                else if (envConfigInfo.awsConfigFilePath && fs_extra_1.default.existsSync(envConfigInfo.awsConfigFilePath)) {
                    configLevel = 'project';
                }
            }
        }
    }
    catch (e) {
    }
    return configLevel;
}
async function getAwsConfig(context) {
    const { awsConfigInfo } = context.exeInfo;
    const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    let resultAWSConfigInfo;
    if (awsConfigInfo.configLevel === 'project') {
        if (awsConfigInfo.config.useProfile) {
            try {
                resultAWSConfigInfo = await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
            }
            catch (err) {
                throw new amplify_cli_core_1.AmplifyError('ProfileConfigurationError', {
                    message: 'Failed to get profile credentials',
                    details: err.message,
                }, err);
            }
        }
        else {
            resultAWSConfigInfo = {
                accessKeyId: awsConfigInfo.config.accessKeyId,
                secretAccessKey: awsConfigInfo.config.secretAccessKey,
                sessionToken: awsConfigInfo.config.sessionToken,
                region: awsConfigInfo.config.region,
            };
        }
    }
    else if (awsConfigInfo.configLevel === 'amplifyAdmin') {
        const appId = (0, resolve_appId_1.resolveAppId)(context);
        try {
            resultAWSConfigInfo = await (0, admin_helpers_1.getTempCredsWithAdminTokens)(context, appId);
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('AmplifyStudioLoginError', {
                message: 'Failed to fetch Amplify Studio credentials',
                details: err.message,
            }, err);
        }
    }
    if (httpProxy) {
        resultAWSConfigInfo = {
            ...resultAWSConfigInfo,
            httpOptions: { agent: (0, proxy_agent_1.default)(httpProxy) },
        };
    }
    return resultAWSConfigInfo;
}
exports.getAwsConfig = getAwsConfig;
async function determineAuthFlow(context, projectConfig) {
    var _a, _b, _c, _d, _e, _f, _g;
    let cfnParams = lodash_1.default.get(context, ['exeInfo', 'inputParams', 'awscloudformation'], undefined);
    if (cfnParams === null || cfnParams === void 0 ? void 0 : cfnParams.config) {
        cfnParams = cfnParams.config;
    }
    let { accessKeyId, profileName, region, secretAccessKey, useProfile, } = cfnParams || {};
    useProfile = useProfile !== null && useProfile !== void 0 ? useProfile : (_a = projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.config) === null || _a === void 0 ? void 0 : _a.useProfile;
    profileName = profileName !== null && profileName !== void 0 ? profileName : (_b = projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.config) === null || _b === void 0 ? void 0 : _b.profileName;
    const generalCreds = (projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.configLevel) === 'general' || (cfnParams === null || cfnParams === void 0 ? void 0 : cfnParams.configLevel) === 'general';
    if (generalCreds) {
        return { type: 'general' };
    }
    if (useProfile && profileName) {
        return { type: 'profile', profileName };
    }
    if (accessKeyId && secretAccessKey && region) {
        return {
            type: 'accessKeys',
            accessKeyId,
            region,
            secretAccessKey,
        };
    }
    if ((_c = projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.config) === null || _c === void 0 ? void 0 : _c.awsConfigFilePath) {
        const awsConfigInfo = loadConfigFromPath(projectConfig.config.awsConfigFilePath);
        return { ...awsConfigInfo, type: 'accessKeys' };
    }
    let appId;
    let adminAppConfig;
    try {
        appId = (0, resolve_appId_1.resolveAppId)(context);
        if (appId) {
            adminAppConfig = await (0, admin_helpers_1.isAmplifyAdminApp)(appId);
            if (adminAppConfig.isAdminApp && adminAppConfig.region) {
                region = adminAppConfig.region;
                if ((0, admin_helpers_1.doAdminTokensExist)(appId) && (projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.configLevel) === 'amplifyAdmin') {
                    return { type: 'admin', appId, region };
                }
            }
        }
    }
    catch (e) {
    }
    if ((_e = (_d = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _d === void 0 ? void 0 : _d.inputParams) === null || _e === void 0 ? void 0 : _e.yes) {
        if (process.env.AWS_SDK_LOAD_CONFIG) {
            profileName = profileName || process.env.AWS_PROFILE || 'default';
            return { type: 'profile', profileName };
        }
        accessKeyId = accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        secretAccessKey = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
        region = region || resolveRegion();
        if (accessKeyId && secretAccessKey && region) {
            return {
                type: 'accessKeys',
                accessKeyId,
                region,
                secretAccessKey,
            };
        }
    }
    if ((_g = (_f = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _f === void 0 ? void 0 : _f.inputParams) === null || _g === void 0 ? void 0 : _g.yes) {
        const errorMessage = 'Failed to resolve AWS credentials with --yes flag.';
        const docsUrl = 'https://docs.amplify.aws/cli/usage/headless';
        context.print.error(errorMessage);
        context.print.info(`Access keys for continuous integration can be configured with headless parameters: ${chalk_1.default.green(docsUrl)}`);
        await context.usageData.emitError(new Error(errorMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    const authType = await askAuthType(adminAppConfig === null || adminAppConfig === void 0 ? void 0 : adminAppConfig.isAdminApp);
    if (authType === 'admin') {
        return { type: authType, appId, region };
    }
    return { type: authType };
}
async function askAuthType(isAdminAvailable = false) {
    let choices = [
        { name: 'AWS profile', value: 'profile' },
        { name: 'AWS access keys', value: 'accessKeys' },
    ];
    if (isAdminAvailable) {
        choices = [{ name: 'Amplify Studio', value: 'admin' }, ...choices];
    }
    const { authChoice } = await (0, inquirer_1.prompt)((0, configuration_questions_1.authTypeQuestion)(choices));
    return authChoice;
}
function validateAccessKeyId(input) {
    const INVALID_ACCESS_KEY_ID = 'Access Key ID must be 20 characters, and uppercase alphanumeric only.';
    const accessKeyIdRegex = /^[A-Z0-9]{20}$/;
    return accessKeyIdRegex.test(input) ? true : INVALID_ACCESS_KEY_ID;
}
function validateSecretAccessKey(input) {
    const INVALID_SECRET_ACCESS_KEY = 'Secret Access Key must be 40 characters, and base-64 string only.';
    const secretAccessKeyRegex = /^[A-Za-z0-9/+=]{40}$/;
    return secretAccessKeyRegex.test(input) ? true : INVALID_SECRET_ACCESS_KEY;
}
//# sourceMappingURL=configuration-manager.js.map