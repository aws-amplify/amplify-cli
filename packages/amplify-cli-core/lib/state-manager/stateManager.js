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
exports.stateManager = exports.StateManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const pathManager_1 = require("./pathManager");
const jsonUtilities_1 = require("../jsonUtilities");
const cliConstants_1 = require("../cliConstants");
const tags_1 = require("../tags");
class StateManager {
    constructor() {
        this.metaFileExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getAmplifyMetaFilePath, projectPath);
        this.getMeta = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getAmplifyMetaFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.currentMetaFileExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getCurrentAmplifyMetaFilePath, projectPath);
        this.setDeploymentSecrets = (deploymentSecrets) => {
            const deploymentSecretsPath = pathManager_1.pathManager.getDeploymentSecrets();
            jsonUtilities_1.JSONUtilities.writeJson(deploymentSecretsPath, deploymentSecrets, { mode: cliConstants_1.SecretFileMode });
        };
        this.getCurrentMeta = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            const data = this.getData(filePath, mergedOptions);
            return data;
        };
        this.getDeploymentSecrets = () => jsonUtilities_1.JSONUtilities.readJson(pathManager_1.pathManager.getDeploymentSecrets(), {
            throwIfNotExist: false,
        }) || { appSecrets: [] };
        this.getProjectTags = (projectPath) => (0, tags_1.ReadTags)(pathManager_1.pathManager.getTagFilePath(projectPath));
        this.getCurrentProjectTags = (projectPath) => (0, tags_1.ReadTags)(pathManager_1.pathManager.getCurrentTagFilePath(projectPath));
        this.teamProviderInfoExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getTeamProviderInfoFilePath, projectPath);
        this.getTeamProviderInfo = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getTeamProviderInfoFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.getCustomPolicies = (categoryName, resourceName) => {
            const filePath = pathManager_1.pathManager.getCustomPoliciesPath(categoryName, resourceName);
            return jsonUtilities_1.JSONUtilities.readJson(filePath, { throwIfNotExist: false }) || [];
        };
        this.getCurrentRegion = (projectPath) => this.getMeta(projectPath).providers.awscloudformation.Region;
        this.getCurrentEnvName = (projectPath) => { var _a; return (_a = this.getLocalEnvInfo(projectPath, { throwIfNotExist: false })) === null || _a === void 0 ? void 0 : _a.envName; };
        this.localEnvInfoExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getLocalEnvFilePath, projectPath);
        this.getLocalEnvInfo = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getLocalEnvFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.localAWSInfoExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getLocalAWSInfoFilePath, projectPath);
        this.getLocalAWSInfo = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getLocalAWSInfoFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.projectConfigExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getProjectConfigFilePath, projectPath);
        this.getProjectConfig = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getProjectConfigFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.backendConfigFileExists = (projectPath) => this.doesExist(pathManager_1.pathManager.getBackendConfigFilePath, projectPath);
        this.getBackendConfig = (projectPath, options, includeParameters = false) => {
            const filePath = pathManager_1.pathManager.getBackendConfigFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            const data = this.getData(filePath, mergedOptions);
            if (includeParameters) {
                return data;
            }
            return lodash_1.default.omit(data, 'parameters');
        };
        this.getCurrentBackendConfig = (projectPath, options) => {
            const filePath = pathManager_1.pathManager.getCurrentBackendConfigFilePath(projectPath);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.getProjectName = () => {
            const { projectName } = this.getProjectConfig();
            return projectName;
        };
        this.getAppID = () => {
            var _a, _b;
            const meta = exports.stateManager.getMeta(undefined, { throwIfNotExist: false });
            const appId = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
            if (!appId) {
                throw new Error('Could not find an Amplify AppId in the amplify-meta.json file. Make sure your project is initialized in the cloud.');
            }
            return appId;
        };
        this.getResourceParametersJson = (projectPath, category, resourceName, options) => {
            const filePath = pathManager_1.pathManager.getResourceParametersFilePath(projectPath, category, resourceName);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.getResourceInputsJson = (projectPath, category, resourceName, options) => {
            const filePath = pathManager_1.pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.getCurrentResourceParametersJson = (projectPath, category, resourceName, options) => {
            const filePath = pathManager_1.pathManager.getCurrentResourceParametersJsonPath(projectPath, category, resourceName);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.getAmplifyAdminConfigEntry = (appId, options) => {
            var _a;
            const mergedOptions = {
                throwIfNotExist: false,
                default: {},
                ...options,
            };
            const adminConfig = (_a = jsonUtilities_1.JSONUtilities.readJson(pathManager_1.pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : mergedOptions.default;
            return adminConfig[appId];
        };
        this.removeAmplifyAdminConfigEntry = (appId) => {
            const adminConfig = jsonUtilities_1.JSONUtilities.readJson(pathManager_1.pathManager.getAmplifyAdminConfigFilePath());
            delete adminConfig[appId];
            jsonUtilities_1.JSONUtilities.writeJson(pathManager_1.pathManager.getAmplifyAdminConfigFilePath(), adminConfig, { secureFile: true });
        };
        this.setAmplifyAdminConfigEntry = (appId, config) => {
            const adminConfig = jsonUtilities_1.JSONUtilities.readJson(pathManager_1.pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) || {};
            adminConfig[appId] = config;
            jsonUtilities_1.JSONUtilities.writeJson(pathManager_1.pathManager.getAmplifyAdminConfigFilePath(), adminConfig, { secureFile: true });
        };
        this.setLocalEnvInfo = (projectPath, localEnvInfo) => {
            const filePath = pathManager_1.pathManager.getLocalEnvFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, localEnvInfo);
        };
        this.setLocalAWSInfo = (projectPath, localAWSInfo) => {
            const filePath = pathManager_1.pathManager.getLocalAWSInfoFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, localAWSInfo);
        };
        this.getHydratedTags = (projectPath, skipProjEnv = false) => {
            const tags = this.getProjectTags(projectPath);
            const { projectName } = this.getProjectConfig(projectPath);
            const { envName } = this.getLocalEnvInfo(projectPath);
            return (0, tags_1.HydrateTags)(tags, { projectName, envName }, skipProjEnv);
        };
        this.isTagFilePresent = (projectPath) => {
            if (pathManager_1.pathManager.findProjectRoot())
                return fs.existsSync(pathManager_1.pathManager.getTagFilePath(projectPath));
            return false;
        };
        this.setProjectFileTags = (projectPath, tags) => {
            const tagFilePath = pathManager_1.pathManager.getTagFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(tagFilePath, tags);
        };
        this.setProjectConfig = (projectPath, projectConfig) => {
            const filePath = pathManager_1.pathManager.getProjectConfigFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, projectConfig);
        };
        this.setTeamProviderInfo = (projectPath, teamProviderInfo) => {
            const filePath = pathManager_1.pathManager.getTeamProviderInfoFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, teamProviderInfo);
        };
        this.setBackendConfig = (projectPath, backendConfig) => {
            const filePath = pathManager_1.pathManager.getBackendConfigFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, backendConfig, { orderedKeys: true });
        };
        this.setCurrentBackendConfig = (projectPath, backendConfig) => {
            const filePath = pathManager_1.pathManager.getCurrentBackendConfigFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, backendConfig, { orderedKeys: true });
        };
        this.setMeta = (projectPath, meta) => {
            const filePath = pathManager_1.pathManager.getAmplifyMetaFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, meta);
        };
        this.setCurrentMeta = (projectPath, meta) => {
            const filePath = pathManager_1.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, meta);
        };
        this.getHooksConfigJson = (projectPath) => { var _a; return (_a = this.getData(pathManager_1.pathManager.getHooksConfigFilePath(projectPath), { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : {}; };
        this.setSampleHooksDir = (projectPath, sourceDirPath) => {
            const targetDirPath = pathManager_1.pathManager.getHooksDirPath(projectPath);
            if (!fs.existsSync(targetDirPath)) {
                fs.ensureDirSync(targetDirPath);
                fs.copySync(path.join(sourceDirPath, pathManager_1.PathConstants.HooksShellSampleFileName), path.join(targetDirPath, pathManager_1.PathConstants.HooksShellSampleFileName));
                fs.copySync(path.join(sourceDirPath, pathManager_1.PathConstants.HooksJsSampleFileName), path.join(targetDirPath, pathManager_1.PathConstants.HooksJsSampleFileName));
                fs.copySync(path.join(sourceDirPath, pathManager_1.PathConstants.HooksReadmeFileName), path.join(targetDirPath, pathManager_1.PathConstants.ReadMeFileName));
            }
        };
        this.setResourceParametersJson = (projectPath, category, resourceName, parameters) => {
            const filePath = pathManager_1.pathManager.getResourceParametersFilePath(projectPath, category, resourceName);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, parameters);
        };
        this.setResourceInputsJson = (projectPath, category, resourceName, inputs) => {
            const filePath = pathManager_1.pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, inputs);
        };
        this.resourceInputsJsonExists = (projectPath, category, resourceName) => {
            try {
                return fs.existsSync(pathManager_1.pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName));
            }
            catch (e) {
                return false;
            }
        };
        this.cliJSONFileExists = (projectPath, env) => {
            try {
                return fs.existsSync(pathManager_1.pathManager.getCLIJSONFilePath(projectPath, env));
            }
            catch (e) {
                return false;
            }
        };
        this.getCLIJSON = (projectPath, env, options) => {
            const filePath = pathManager_1.pathManager.getCLIJSONFilePath(projectPath, env);
            const mergedOptions = {
                throwIfNotExist: true,
                ...options,
            };
            return this.getData(filePath, mergedOptions);
        };
        this.setCLIJSON = (projectPath, cliJSON, env) => {
            const filePath = pathManager_1.pathManager.getCLIJSONFilePath(projectPath, env);
            jsonUtilities_1.JSONUtilities.writeJson(filePath, cliJSON);
        };
        this.getResourceFromMeta = (amplifyMeta, categoryName, serviceName, resourceName, throwIfNotExist = true) => {
            const resources = this.filterResourcesFromMeta(amplifyMeta, categoryName, serviceName, resourceName);
            if (resources.length === 0) {
                const withNamePart = resourceName ? `with name: ${resourceName} ` : '';
                if (throwIfNotExist) {
                    throw new Error(`Resource for ${serviceName} service in ${categoryName} category, ${withNamePart}was not found.`);
                }
                else {
                    return null;
                }
            }
            else if (resources.length > 1) {
                throw new Error(`${resources.length} resources were found for ${serviceName} service in ${categoryName} category, but expected only 1.`);
            }
            return resources[0];
        };
        this.filterResourcesFromMeta = (amplifyMeta, categoryName, serviceName, resourceName) => {
            const categoryResources = lodash_1.default.get(amplifyMeta, [categoryName]);
            if (!categoryResources) {
                return [];
            }
            const result = [];
            for (const resourceKey of Object.keys(categoryResources)) {
                if (categoryResources[resourceKey].service === serviceName && (!resourceName || (resourceName && resourceKey === resourceName))) {
                    result.push({
                        resourceName: resourceKey,
                        resource: categoryResources[resourceKey],
                    });
                    if (resourceName && result.length === 1) {
                        break;
                    }
                }
            }
            return result;
        };
        this.doesExist = (filePathGetter, projectPath) => {
            let chkPath;
            try {
                chkPath = filePathGetter(projectPath);
            }
            catch (e) {
                return false;
            }
            return fs.existsSync(chkPath);
        };
        this.getData = (filePath, options) => {
            var _a;
            const data = jsonUtilities_1.JSONUtilities.readJson(filePath, {
                throwIfNotExist: (_a = options === null || options === void 0 ? void 0 : options.throwIfNotExist) !== null && _a !== void 0 ? _a : true,
            });
            return data !== null && data !== void 0 ? data : options === null || options === void 0 ? void 0 : options.default;
        };
    }
}
exports.StateManager = StateManager;
exports.stateManager = new StateManager();
//# sourceMappingURL=stateManager.js.map