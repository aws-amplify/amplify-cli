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
exports.readLegacyRuntimes = exports.getLegacyLayerState = exports.migrateLegacyLayer = exports.LegacyPermissionEnum = exports.LegacyState = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("../../../constants");
const constants_2 = require("./constants");
const functionPluginLoader_1 = require("./functionPluginLoader");
const layerConfiguration_1 = require("./layerConfiguration");
const layerParams_1 = require("./layerParams");
var LegacyState;
(function (LegacyState) {
    LegacyState[LegacyState["NOT_LEGACY"] = 0] = "NOT_LEGACY";
    LegacyState[LegacyState["MULTI_ENV_LEGACY"] = 1] = "MULTI_ENV_LEGACY";
    LegacyState[LegacyState["SINGLE_ENV_LEGACY"] = 2] = "SINGLE_ENV_LEGACY";
})(LegacyState = exports.LegacyState || (exports.LegacyState = {}));
var LegacyPermissionEnum;
(function (LegacyPermissionEnum) {
    LegacyPermissionEnum["AwsAccounts"] = "awsAccounts";
    LegacyPermissionEnum["AwsOrg"] = "awsOrg";
    LegacyPermissionEnum["Private"] = "private";
    LegacyPermissionEnum["Public"] = "public";
})(LegacyPermissionEnum = exports.LegacyPermissionEnum || (exports.LegacyPermissionEnum = {}));
const layerVersionMapKey = 'layerVersionMap';
const migrateLegacyLayer = async (context, layerName) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const layerDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName);
    const legacyState = (0, exports.getLegacyLayerState)(layerName);
    if (legacyState === 0) {
        return false;
    }
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.warn('Amplify updated the way Lambda layers work to better support team workflows and additional features.');
    amplify_prompts_1.printer.info('This change requires a migration. Amplify will create a new Lambda layer version even if no layer content changes are made.');
    if (((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.yes) !== true) {
        const shouldProceedWithMigration = await context.amplify.confirmPrompt('Continue?');
        if (!shouldProceedWithMigration) {
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
    const layerConfiguration = {
        permissions: undefined,
        runtimes: undefined,
    };
    let legacyRuntimeArray;
    let layerVersionMap;
    if (legacyState === 1) {
        legacyRuntimeArray = (0, exports.readLegacyRuntimes)(layerName, legacyState);
        layerVersionMap = (_f = (_e = (_d = (_c = amplify_cli_core_1.stateManager.getMeta()) === null || _c === void 0 ? void 0 : _c[constants_1.categoryName]) === null || _d === void 0 ? void 0 : _d[layerName]) === null || _e === void 0 ? void 0 : _e[layerVersionMapKey]) !== null && _f !== void 0 ? _f : {};
    }
    else {
        ({ layerVersionMap, runtimes: legacyRuntimeArray } = readLegacyLayerParametersJson(layerDirPath));
        layerConfiguration.nonMultiEnv = true;
    }
    const runtimeCloudTemplateValues = legacyRuntimeArray.map((legacyRuntime) => legacyRuntime.cloudTemplateValue);
    legacyRuntimeArray.forEach((runtime) => {
        runtime.cloudTemplateValue = undefined;
    });
    layerConfiguration.runtimes = legacyRuntimeArray;
    await Promise.all(layerConfiguration.runtimes.map(async (runtime) => {
        if (runtime.value === 'nodejs') {
            runtime.runtimePluginId = 'amplify-nodejs-function-runtime-provider';
        }
        else if (runtime.value === 'python') {
            runtime.runtimePluginId = 'amplify-python-function-runtime-provider';
        }
        const runtimePlugin = await (0, functionPluginLoader_1.loadPluginFromFactory)(runtime.runtimePluginId, 'functionRuntimeContributorFactory', context);
        const runtimeInfo = await runtimePlugin.contribute({ selection: runtime.value });
        runtime.layerExecutablePath = runtimeInfo.runtime.layerExecutablePath;
    }));
    const layerVersions = Object.keys(layerVersionMap)
        .map((version) => parseInt(version, 10))
        .sort((a, b) => b - a);
    const permissions = (_g = layerVersionMap[`${lodash_1.default.first(layerVersions)}`]) === null || _g === void 0 ? void 0 : _g.permissions;
    if (permissions === undefined) {
        amplify_prompts_1.printer.warn(`Unable to find layer permissions for ${layerName}, falling back to default.`);
        layerConfiguration.permissions = [layerParams_1.defaultLayerPermission];
    }
    else {
        layerConfiguration.permissions = [];
        permissions.forEach((permission) => {
            switch (permission.type) {
                case "private":
                    layerConfiguration.permissions.push({ type: layerParams_1.PermissionEnum.Private });
                    break;
                case "awsAccounts":
                    layerConfiguration.permissions.push({ type: layerParams_1.PermissionEnum.AwsAccounts, accounts: permission.accounts });
                    break;
                case "awsOrg":
                    layerConfiguration.permissions.push({ type: layerParams_1.PermissionEnum.AwsOrg, orgs: permission.orgs });
                    break;
                case "public":
                    layerConfiguration.permissions.push({ type: layerParams_1.PermissionEnum.Public });
                    break;
                default:
                    throw new Error('Failed to determine permission type.');
            }
        });
    }
    amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, constants_1.categoryName, layerName, {
        runtimes: runtimeCloudTemplateValues.length > 0 ? runtimeCloudTemplateValues : undefined,
        description: '',
    });
    migrateAmplifyProjectFiles(layerName, 'legacyLayerMigration');
    (0, layerConfiguration_1.writeLayerConfigurationFile)(layerName, layerConfiguration);
    fs.removeSync(path.join(layerDirPath, "layer-runtimes.json"));
    fs.removeSync(path.join(layerDirPath, "layer-parameters.json"));
    return true;
};
exports.migrateLegacyLayer = migrateLegacyLayer;
const getLegacyLayerState = (layerName) => {
    const layerDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName);
    if (fs.existsSync(path.join(layerDirPath, "layer-parameters.json"))) {
        return 2;
    }
    if (fs.existsSync(path.join(layerDirPath, "layer-runtimes.json"))) {
        return 1;
    }
    if (fs.existsSync(path.join(layerDirPath, constants_2.layerConfigurationFileName))) {
        return 0;
    }
    throw new Error(`Lambda layer ${layerName} is missing a state file. Try running "amplify pull --restore". If the issue persists, recreating the layer is the best option. \
${chalk_1.default.red('Ensure your layer content is backed up!')}`);
};
exports.getLegacyLayerState = getLegacyLayerState;
const readLegacyRuntimes = (layerName, legacyState) => {
    const layerDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName);
    if (legacyState === 2) {
        return readLegacyLayerParametersJson(layerDirPath).runtimes;
    }
    if (legacyState === 1) {
        return amplify_cli_core_1.JSONUtilities.readJson(path.join(layerDirPath, "layer-runtimes.json"));
    }
    return undefined;
};
exports.readLegacyRuntimes = readLegacyRuntimes;
const readLegacyLayerParametersJson = (layerDirPath) => amplify_cli_core_1.JSONUtilities.readJson(path.join(layerDirPath, "layer-parameters.json"));
const migrateAmplifyProjectFiles = (layerName, latestLegacyHash) => {
    var _a, _b;
    const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    const meta = amplify_cli_core_1.stateManager.getMeta(projectRoot);
    if ((_b = (_a = meta === null || meta === void 0 ? void 0 : meta[constants_1.categoryName]) === null || _a === void 0 ? void 0 : _a[layerName]) === null || _b === void 0 ? void 0 : _b[layerVersionMapKey]) {
        meta[constants_1.categoryName][layerName][layerVersionMapKey] = undefined;
    }
    lodash_1.default.setWith(meta, [constants_1.categoryName, layerName, constants_2.versionHash], latestLegacyHash);
    amplify_cli_core_1.stateManager.setMeta(projectRoot, meta);
};
//# sourceMappingURL=layerMigrationUtils.js.map