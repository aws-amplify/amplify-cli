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
exports.generateFiles = void 0;
const fs = __importStar(require("fs-extra"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const amplify_cli_core_1 = require("amplify-cli-core");
const get_frontend_plugins_1 = require("../extensions/amplify-helpers/get-frontend-plugins");
const get_provider_plugins_1 = require("../extensions/amplify-helpers/get-provider-plugins");
const git_manager_1 = require("../extensions/amplify-helpers/git-manager");
const generateFiles = async (context) => {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
    const dotConfigDirPath = amplify_cli_core_1.pathManager.getDotConfigDirPath(projectPath);
    const backendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath(projectPath);
    const currentBackendDirPath = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(projectPath);
    fs.ensureDirSync(amplifyDirPath);
    fs.ensureDirSync(dotConfigDirPath);
    fs.ensureDirSync(backendDirPath);
    fs.ensureDirSync(currentBackendDirPath);
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const providerOnSuccessTasks = [];
    const frontendPlugins = (0, get_frontend_plugins_1.getFrontendPlugins)(context);
    const frontendModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[context.exeInfo.projectConfig.frontend])));
    await frontendModule.onInitSuccessful(context);
    generateLocalRuntimeFiles(context);
    generateNonRuntimeFiles(context);
    for (const provider of context.exeInfo.projectConfig.providers) {
        const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
        providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
    }
    await (0, promise_sequential_1.default)(providerOnSuccessTasks);
    const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
        throwIfNotExist: false,
        default: {},
    });
    await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);
    return context;
};
exports.generateFiles = generateFiles;
const generateLocalRuntimeFiles = (context) => {
    generateLocalEnvInfoFile(context);
};
const generateLocalEnvInfoFile = (context) => {
    const { projectPath } = context.exeInfo.localEnvInfo;
    amplify_cli_core_1.stateManager.setLocalEnvInfo(projectPath, context.exeInfo.localEnvInfo);
};
const generateNonRuntimeFiles = (context) => {
    generateProjectConfigFile(context);
    generateBackendConfigFile(context);
    generateTeamProviderInfoFile(context);
    generateGitIgnoreFile(context);
};
const generateProjectConfigFile = (context) => {
    var _a;
    if (context.exeInfo.isNewProject || ((_a = context.exeInfo.existingLocalEnvInfo) === null || _a === void 0 ? void 0 : _a.noUpdateBackend)) {
        const { projectPath } = context.exeInfo.localEnvInfo;
        amplify_cli_core_1.stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
    }
};
const generateTeamProviderInfoFile = (context) => {
    var _a;
    const { projectPath, envName } = context.exeInfo.localEnvInfo;
    const { existingTeamProviderInfo, teamProviderInfo } = context.exeInfo;
    if ((_a = context.exeInfo.existingLocalEnvInfo) === null || _a === void 0 ? void 0 : _a.noUpdateBackend) {
        return amplify_cli_core_1.stateManager.setTeamProviderInfo(projectPath, existingTeamProviderInfo);
    }
    if (existingTeamProviderInfo) {
        if (existingTeamProviderInfo[envName]) {
            if (existingTeamProviderInfo[envName].categories) {
                teamProviderInfo[envName] = teamProviderInfo[envName] || {};
                teamProviderInfo[envName].categories = existingTeamProviderInfo[envName].categories;
            }
            delete existingTeamProviderInfo[envName];
        }
        Object.assign(teamProviderInfo, existingTeamProviderInfo);
    }
    amplify_cli_core_1.stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
    return undefined;
};
const generateBackendConfigFile = (context) => {
    const { projectPath } = context.exeInfo.localEnvInfo;
    if (!amplify_cli_core_1.stateManager.backendConfigFileExists(projectPath)) {
        amplify_cli_core_1.stateManager.setBackendConfig(projectPath, {});
    }
};
const generateGitIgnoreFile = (context) => {
    if (context.exeInfo.isNewProject) {
        const { projectPath } = context.exeInfo.localEnvInfo;
        const gitIgnoreFilePath = amplify_cli_core_1.pathManager.getGitIgnoreFilePath(projectPath);
        (0, git_manager_1.insertAmplifyIgnore)(gitIgnoreFilePath);
    }
};
//# sourceMappingURL=a40-generateFiles.js.map