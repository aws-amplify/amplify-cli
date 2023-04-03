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
exports.updateamplifyMetaAfterResourceDelete = exports.updateAmplifyMetaAfterPackage = exports.updateamplifyMetaAfterBuild = exports.updateamplifyMetaAfterPush = exports.updateamplifyMetaAfterResourceUpdate = exports.updateProviderAmplifyMeta = exports.updateamplifyMetaAfterResourceAdd = exports.updateAwsMetaFile = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const fs = __importStar(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const on_category_outputs_change_1 = require("./on-category-outputs-change");
const resource_status_1 = require("./resource-status");
const update_backend_config_1 = require("./update-backend-config");
const updateAwsMetaFile = (filePath, category, resourceName, attribute, value, timestamp) => {
    const amplifyMeta = amplify_cli_core_1.JSONUtilities.readJson(filePath);
    if (!amplifyMeta[category]) {
        amplifyMeta[category] = {};
        amplifyMeta[category][resourceName] = {};
    }
    else if (!amplifyMeta[category][resourceName]) {
        amplifyMeta[category][resourceName] = {};
    }
    if (!amplifyMeta[category][resourceName][attribute]) {
        amplifyMeta[category][resourceName][attribute] = {};
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        if (!amplifyMeta[category][resourceName][attribute]) {
            amplifyMeta[category][resourceName][attribute] = {};
        }
        Object.assign(amplifyMeta[category][resourceName][attribute], value);
    }
    else {
        amplifyMeta[category][resourceName][attribute] = value;
    }
    if (timestamp) {
        amplifyMeta[category][resourceName].lastPushTimeStamp = timestamp;
    }
    amplify_cli_core_1.JSONUtilities.writeJson(filePath, amplifyMeta);
    return amplifyMeta;
};
exports.updateAwsMetaFile = updateAwsMetaFile;
const moveBackendResourcesToCurrentCloudBackend = (resources) => {
    const amplifyMetaFilePath = amplify_cli_core_1.pathManager.getAmplifyMetaFilePath();
    const amplifyCloudMetaFilePath = amplify_cli_core_1.pathManager.getCurrentAmplifyMetaFilePath();
    const backendConfigFilePath = amplify_cli_core_1.pathManager.getBackendConfigFilePath();
    const backendConfigCloudFilePath = amplify_cli_core_1.pathManager.getCurrentBackendConfigFilePath();
    const overridePackageJsonBackendFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'package.json');
    const overrideTsConfigJsonBackendFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'tsconfig.json');
    const overridePackageJsonCurrentCloudBackendFilePath = path.join(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(), 'package.json');
    const overrideTsConfigJsonCurrentCloudBackendFilePath = path.join(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(), 'tsconfig.json');
    for (const resource of resources) {
        const sourceDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), resource.category, resource.resourceName));
        const targetDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(), resource.category, resource.resourceName));
        if (fs.pathExistsSync(targetDir)) {
            fs.removeSync(targetDir);
        }
        fs.ensureDirSync(targetDir);
        if (fs.pathExistsSync(sourceDir)) {
            fs.copySync(sourceDir, targetDir);
            if ((resource === null || resource === void 0 ? void 0 : resource.service) === "Lambda" || ((resource === null || resource === void 0 ? void 0 : resource.service) && (resource === null || resource === void 0 ? void 0 : resource.service.includes('custom')))) {
                removeNodeModulesDir(targetDir);
            }
        }
    }
    fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
    fs.copySync(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
    try {
        fs.writeFileSync(overridePackageJsonCurrentCloudBackendFilePath, fs.readFileSync(overridePackageJsonBackendFilePath));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    try {
        fs.writeFileSync(overrideTsConfigJsonCurrentCloudBackendFilePath, fs.readFileSync(overrideTsConfigJsonBackendFilePath));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
};
const removeNodeModulesDir = (currentCloudBackendDir) => {
    const nodeModulesDirs = glob_1.default.sync('**/node_modules', {
        cwd: currentCloudBackendDir,
        absolute: true,
    });
    for (const nodeModulesPath of nodeModulesDirs) {
        if (fs.existsSync(nodeModulesPath)) {
            fs.removeSync(nodeModulesPath);
        }
    }
};
const updateamplifyMetaAfterResourceAdd = (category, resourceName, metadataResource = {}, backendConfigResource, overwriteObjectIfExists) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (metadataResource.dependsOn) {
        checkForCyclicDependencies(category, resourceName, metadataResource.dependsOn);
    }
    if (!amplifyMeta[category]) {
        amplifyMeta[category] = {};
    }
    if (amplifyMeta[category][resourceName] && !overwriteObjectIfExists) {
        throw new Error(`${resourceName} is present in amplify-meta.json`);
    }
    amplifyMeta[category][resourceName] = {};
    amplifyMeta[category][resourceName] = metadataResource;
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
    (0, on_category_outputs_change_1.ensureAmplifyMetaFrontendConfig)(amplifyMeta);
    (0, update_backend_config_1.updateBackendConfigAfterResourceAdd)(category, resourceName, backendConfigResource || metadataResource);
};
exports.updateamplifyMetaAfterResourceAdd = updateamplifyMetaAfterResourceAdd;
const updateProviderAmplifyMeta = (providerName, options) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!amplifyMeta.providers) {
        amplifyMeta.providers = {};
        amplifyMeta.providers[providerName] = {};
    }
    else if (!amplifyMeta.providers[providerName]) {
        amplifyMeta.providers[providerName] = {};
    }
    Object.keys(options).forEach((key) => {
        amplifyMeta.providers[providerName][key] = options[key];
    });
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
exports.updateProviderAmplifyMeta = updateProviderAmplifyMeta;
const updateamplifyMetaAfterResourceUpdate = (category, resourceName, attribute, value) => {
    const amplifyMetaFilePath = amplify_cli_core_1.pathManager.getAmplifyMetaFilePath();
    const currentTimestamp = new Date();
    if (attribute === 'dependsOn') {
        checkForCyclicDependencies(category, resourceName, value);
    }
    const updatedMeta = (0, exports.updateAwsMetaFile)(amplifyMetaFilePath, category, resourceName, attribute, value, currentTimestamp);
    if (['dependsOn', 'service', 'frontendAuthConfig'].includes(attribute)) {
        (0, update_backend_config_1.updateBackendConfigAfterResourceUpdate)(category, resourceName, attribute, value);
    }
    return updatedMeta;
};
exports.updateamplifyMetaAfterResourceUpdate = updateamplifyMetaAfterResourceUpdate;
const updateamplifyMetaAfterPush = async (resources) => {
    await (0, amplify_environment_parameters_1.saveAll)();
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const currentTimestamp = new Date();
    for (const resource of resources) {
        if (resource.serviceType !== 'imported') {
            const sourceDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), resource.category, resource.resourceName));
            if (fs.pathExistsSync(sourceDir)) {
                let hashDir;
                if (resource.category === 'hosting' && resource.service === 'ElasticContainer') {
                    const { frontend, [frontend]: { config: { SourceDir }, }, } = amplify_cli_core_1.stateManager.getProjectConfig();
                    const projectRootPath = amplify_cli_core_1.pathManager.findProjectRoot();
                    if (projectRootPath) {
                        const sourceAbsolutePath = path.join(projectRootPath, SourceDir);
                        hashDir = await (0, resource_status_1.getHashForResourceDir)(sourceAbsolutePath, ['Dockerfile', 'docker-compose.yaml', 'docker-compose.yml']);
                    }
                }
                else if (resource.category === 'function' && resource.service === "LambdaLayer") {
                }
                else {
                    hashDir = await (0, resource_status_1.getHashForResourceDir)(sourceDir);
                }
                if (hashDir) {
                    amplifyMeta[resource.category][resource.resourceName].lastPushDirHash = hashDir;
                }
                amplifyMeta[resource.category][resource.resourceName].lastPushTimeStamp = currentTimestamp;
            }
        }
        if (resource.serviceType === 'imported' && amplifyMeta[resource.category] && amplifyMeta[resource.category][resource.resourceName]) {
            amplifyMeta[resource.category][resource.resourceName].lastPushTimeStamp = currentTimestamp;
        }
    }
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
    moveBackendResourcesToCurrentCloudBackend(resources);
};
exports.updateamplifyMetaAfterPush = updateamplifyMetaAfterPush;
const updateamplifyMetaAfterBuild = ({ category, resourceName }, buildType = amplify_function_plugin_interface_1.BuildType.PROD) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    lodash_1.default.setWith(amplifyMeta, [category, resourceName, amplify_category_function_1.buildTypeKeyMap[buildType]], new Date());
    lodash_1.default.setWith(amplifyMeta, [category, resourceName, 'lastBuildType'], buildType);
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
exports.updateamplifyMetaAfterBuild = updateamplifyMetaAfterBuild;
const updateAmplifyMetaAfterPackage = ({ category, resourceName }, zipFilename, hash) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    lodash_1.default.setWith(amplifyMeta, [category, resourceName, 'lastPackageTimeStamp'], new Date());
    lodash_1.default.setWith(amplifyMeta, [category, resourceName, 'distZipFilename'], zipFilename);
    if (hash) {
        lodash_1.default.setWith(amplifyMeta, [category, resourceName, hash.resourceKey], hash.hashValue);
    }
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
exports.updateAmplifyMetaAfterPackage = updateAmplifyMetaAfterPackage;
const updateamplifyMetaAfterResourceDelete = (category, resourceName) => {
    const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta();
    const resourceDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(), category, resourceName));
    if (currentMeta[category] && currentMeta[category][resourceName] !== undefined) {
        delete currentMeta[category][resourceName];
    }
    amplify_cli_core_1.stateManager.setCurrentMeta(undefined, currentMeta);
    fs.removeSync(resourceDir);
};
exports.updateamplifyMetaAfterResourceDelete = updateamplifyMetaAfterResourceDelete;
const checkForCyclicDependencies = (category, resourceName, dependsOn) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let cyclicDependency = false;
    if (dependsOn) {
        dependsOn.forEach((resource) => {
            if (resource.category === category && resource.resourceName === resourceName) {
                cyclicDependency = true;
            }
            if (amplifyMeta[resource.category] && amplifyMeta[resource.category][resource.resourceName]) {
                const dependsOnResourceDependency = amplifyMeta[resource.category][resource.resourceName].dependsOn;
                if (dependsOnResourceDependency) {
                    dependsOnResourceDependency.forEach((dependsOnResource) => {
                        if (dependsOnResource.category === category && dependsOnResource.resourceName === resourceName) {
                            cyclicDependency = true;
                        }
                    });
                }
            }
        });
    }
    if (cyclicDependency) {
        throw new Error(`Cannot add ${resourceName} due to a cyclic dependency`);
    }
};
//# sourceMappingURL=update-amplify-meta.js.map