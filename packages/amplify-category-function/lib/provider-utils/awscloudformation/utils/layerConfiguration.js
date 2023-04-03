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
exports.writeLayerConfigurationFile = exports.loadLayerConfigurationFile = exports.loadLayerParametersJson = exports.saveLayerPermissions = exports.deleteLayerVersionPermissionsToBeUpdatedInCfn = exports.getLayerVersionPermissionsToBeUpdatedInCfn = exports.saveLayerVersionPermissionsToBeUpdatedInCfn = exports.saveLayerVersionsToBeRemovedByCfn = exports.deleteLayerVersionsToBeRemovedByCfn = exports.getLayerVersionsToBeRemovedByCfn = exports.saveLayerRuntimes = exports.getLayerRuntimes = exports.getLayerConfiguration = exports.createLayerConfiguration = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const constants_2 = require("../../../constants");
const layerMigrationUtils_1 = require("./layerMigrationUtils");
const layerParams_1 = require("./layerParams");
function createLayerConfiguration(layerDirPath, parameters) {
    const layerConfigFilePath = path.join(layerDirPath, constants_1.layerConfigurationFileName);
    parameters.runtimes = toStoredRuntimeMetadata(parameters.runtimes);
    amplify_cli_core_1.JSONUtilities.writeJson(layerConfigFilePath, parameters);
}
exports.createLayerConfiguration = createLayerConfiguration;
function getLayerConfiguration(layerName) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    const { runtimes: cloudTemplateValues, description } = loadLayerParametersJson(layerName);
    layerConfig.runtimes.forEach((runtimeMeta) => {
        runtimeMeta.cloudTemplateValues = cloudTemplateValues.filter((ctv) => ctv.startsWith(runtimeMeta.value));
    });
    layerConfig.description = description;
    return layerConfig;
}
exports.getLayerConfiguration = getLayerConfiguration;
function getLayerRuntimes(layerName) {
    try {
        return getLayerConfiguration(layerName).runtimes;
    }
    catch (e) {
        const legacyState = (0, layerMigrationUtils_1.getLegacyLayerState)(layerName);
        if (legacyState !== 0) {
            return (0, layerMigrationUtils_1.readLegacyRuntimes)(layerName, legacyState);
        }
        throw e;
    }
}
exports.getLayerRuntimes = getLayerRuntimes;
function saveLayerRuntimes(layerDirPath, runtimes = []) {
    const layerConfigFilePath = path.join(layerDirPath, constants_1.layerConfigurationFileName);
    const layerConfig = amplify_cli_core_1.JSONUtilities.readJson(layerConfigFilePath);
    layerConfig.runtimes = toStoredRuntimeMetadata(runtimes);
    amplify_cli_core_1.JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}
exports.saveLayerRuntimes = saveLayerRuntimes;
function getLayerVersionsToBeRemovedByCfn(layerName, envName) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    return lodash_1.default.get(layerConfig, [constants_1.ephemeralField, constants_1.deleteVersionsField, envName], []);
}
exports.getLayerVersionsToBeRemovedByCfn = getLayerVersionsToBeRemovedByCfn;
function deleteLayerVersionsToBeRemovedByCfn(layerName, envName) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    (0, amplify_cli_core_1.recursiveOmit)(layerConfig, [constants_1.ephemeralField, constants_1.deleteVersionsField, envName]);
    writeLayerConfigurationFile(layerName, layerConfig);
}
exports.deleteLayerVersionsToBeRemovedByCfn = deleteLayerVersionsToBeRemovedByCfn;
function saveLayerVersionsToBeRemovedByCfn(layerName, skipVersions, envName) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    lodash_1.default.setWith(layerConfig, [constants_1.ephemeralField, constants_1.deleteVersionsField, envName], skipVersions);
    writeLayerConfigurationFile(layerName, layerConfig);
}
exports.saveLayerVersionsToBeRemovedByCfn = saveLayerVersionsToBeRemovedByCfn;
function saveLayerVersionPermissionsToBeUpdatedInCfn(layerName, envName, version, permissions) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    lodash_1.default.setWith(layerConfig, [constants_1.ephemeralField, constants_1.updateVersionPermissionsField, envName, version.toString()], permissions, Object);
    writeLayerConfigurationFile(layerName, layerConfig);
}
exports.saveLayerVersionPermissionsToBeUpdatedInCfn = saveLayerVersionPermissionsToBeUpdatedInCfn;
function getLayerVersionPermissionsToBeUpdatedInCfn(layerName, envName, version) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    return lodash_1.default.get(layerConfig, [constants_1.ephemeralField, constants_1.updateVersionPermissionsField, envName, version.toString()], undefined);
}
exports.getLayerVersionPermissionsToBeUpdatedInCfn = getLayerVersionPermissionsToBeUpdatedInCfn;
function deleteLayerVersionPermissionsToBeUpdatedInCfn(layerName, envName) {
    const layerConfig = loadLayerConfigurationFile(layerName);
    (0, amplify_cli_core_1.recursiveOmit)(layerConfig, [constants_1.ephemeralField, constants_1.updateVersionPermissionsField, envName]);
    writeLayerConfigurationFile(layerName, layerConfig);
}
exports.deleteLayerVersionPermissionsToBeUpdatedInCfn = deleteLayerVersionPermissionsToBeUpdatedInCfn;
function saveLayerPermissions(layerDirPath, permissions = [{ type: layerParams_1.PermissionEnum.Private }]) {
    const layerConfigFilePath = path.join(layerDirPath, constants_1.layerConfigurationFileName);
    const layerConfig = amplify_cli_core_1.JSONUtilities.readJson(layerConfigFilePath);
    let updated = false;
    if (!lodash_1.default.isEqual(layerConfig.permissions, permissions)) {
        layerConfig.permissions = permissions;
        amplify_cli_core_1.JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
        updated = true;
    }
    return updated;
}
exports.saveLayerPermissions = saveLayerPermissions;
function loadLayerParametersJson(layerName) {
    const parameters = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, constants_2.categoryName, layerName);
    if (Array.isArray(parameters.runtimes) && lodash_1.default.isEmpty(parameters.runtimes)) {
        delete parameters.runtimes;
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, constants_2.categoryName, layerName, parameters);
    }
    return parameters;
}
exports.loadLayerParametersJson = loadLayerParametersJson;
function loadLayerConfigurationFile(layerName, throwIfNotExist = true) {
    const layerConfigFilePath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_2.categoryName, layerName), constants_1.layerConfigurationFileName);
    return amplify_cli_core_1.JSONUtilities.readJson(layerConfigFilePath, { throwIfNotExist });
}
exports.loadLayerConfigurationFile = loadLayerConfigurationFile;
function writeLayerConfigurationFile(layerName, layerConfig) {
    const layerConfigFilePath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_2.categoryName, layerName), constants_1.layerConfigurationFileName);
    amplify_cli_core_1.JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}
exports.writeLayerConfigurationFile = writeLayerConfigurationFile;
function toStoredRuntimeMetadata(runtimes) {
    return runtimes.map((runtime) => lodash_1.default.pick(runtime, 'value', 'name', 'runtimePluginId', 'layerExecutablePath'));
}
//# sourceMappingURL=layerConfiguration.js.map