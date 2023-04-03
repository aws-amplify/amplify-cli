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
exports.isUnderScanCoverageSync = exports.normalizePluginDirectory = exports.getCorePluginVersion = exports.getCorePluginDirPath = exports.scanPluginPlatform = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const global_prefix_1 = require("../utils/global-prefix");
const verify_plugin_1 = require("./verify-plugin");
const access_plugins_file_1 = require("./access-plugins-file");
const compare_plugins_1 = require("./compare-plugins");
const platform_health_check_1 = require("./platform-health-check");
const is_child_path_1 = __importDefault(require("../utils/is-child-path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const promise_sequential_1 = __importDefault(require("promise-sequential"));
async function scanPluginPlatform(pluginPlatform) {
    const pluginPlatformLocal = pluginPlatform || (0, access_plugins_file_1.readPluginsJsonFile)() || new amplify_cli_core_1.PluginPlatform();
    pluginPlatformLocal.plugins = new amplify_cli_core_1.PluginCollection();
    await addCore(pluginPlatformLocal);
    if (pluginPlatformLocal.userAddedLocations && pluginPlatformLocal.userAddedLocations.length > 0) {
        pluginPlatformLocal.userAddedLocations = pluginPlatformLocal.userAddedLocations.filter((pluginDirPath) => {
            const result = fs.existsSync(pluginDirPath);
            return result;
        });
        const scanUserLocationTasks = pluginPlatformLocal.userAddedLocations.map((pluginDirPath) => async () => await verifyAndAdd(pluginPlatformLocal, pluginDirPath));
        await (0, promise_sequential_1.default)(scanUserLocationTasks);
    }
    if (amplify_cli_core_1.isPackaged && !pluginPlatformLocal.pluginDirectories.includes(amplify_cli_core_1.constants.PACKAGED_NODE_MODULES)) {
        pluginPlatformLocal.pluginDirectories.push(amplify_cli_core_1.constants.PACKAGED_NODE_MODULES);
    }
    if (pluginPlatformLocal.pluginDirectories.length > 0 && pluginPlatformLocal.pluginPrefixes.length > 0) {
        const scanDirTasks = pluginPlatformLocal.pluginDirectories.map((directory) => async () => {
            directory = normalizePluginDirectory(directory);
            const exists = await fs.pathExists(directory);
            if (exists) {
                const subDirNames = await fs.readdir(directory);
                await addPluginPrefixWithMatchingPattern(subDirNames, directory, pluginPlatformLocal);
                if (subDirNames.includes('@aws-amplify')) {
                    const nameSpacedDir = path.join(directory, '@aws-amplify');
                    const nameSpacedPackages = await fs.readdir(nameSpacedDir);
                    await addPluginPrefixWithMatchingPattern(nameSpacedPackages, nameSpacedDir, pluginPlatformLocal);
                }
            }
        });
        await (0, promise_sequential_1.default)(scanDirTasks);
    }
    pluginPlatformLocal.lastScanTime = new Date();
    (0, access_plugins_file_1.writePluginsJsonFile)(pluginPlatformLocal);
    await (0, platform_health_check_1.checkPlatformHealth)(pluginPlatformLocal);
    return pluginPlatformLocal;
}
exports.scanPluginPlatform = scanPluginPlatform;
function getCorePluginDirPath() {
    return path.normalize(path.join(__dirname, '../../'));
}
exports.getCorePluginDirPath = getCorePluginDirPath;
function getCorePluginVersion() {
    const packageJsonFilePath = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
    const packageJson = amplify_cli_core_1.JSONUtilities.readJson(packageJsonFilePath);
    return packageJson.version;
}
exports.getCorePluginVersion = getCorePluginVersion;
async function addCore(pluginPlatform) {
    const corePluginDirPath = getCorePluginDirPath();
    const pluginVerificationResult = await (0, verify_plugin_1.verifyPlugin)(corePluginDirPath);
    if (pluginVerificationResult.verified) {
        const manifest = pluginVerificationResult.manifest;
        const { name, version } = pluginVerificationResult.packageJson;
        const pluginInfo = new amplify_cli_core_1.PluginInfo(name, version, corePluginDirPath, manifest);
        pluginPlatform.plugins[manifest.name] = [];
        pluginPlatform.plugins[manifest.name].push(pluginInfo);
    }
    else {
        throw new Error('The local Amplify-CLI is corrupted');
    }
}
function normalizePluginDirectory(directory) {
    switch (directory) {
        case amplify_cli_core_1.constants.PACKAGED_NODE_MODULES:
            return path.normalize(path.join(__dirname, '../../../..'));
        case amplify_cli_core_1.constants.LOCAL_NODE_MODULES:
            return path.normalize(path.join(__dirname, '../../node_modules'));
        case amplify_cli_core_1.constants.PARENT_DIRECTORY:
            return path.normalize(path.join(__dirname, '../../../'));
        case amplify_cli_core_1.constants.GLOBAL_NODE_MODULES:
            return (0, global_prefix_1.getGlobalNodeModuleDirPath)();
        default:
            return directory;
    }
}
exports.normalizePluginDirectory = normalizePluginDirectory;
function isMatchingNamePattern(pluginPrefixes, pluginDirName) {
    if (pluginPrefixes && pluginPrefixes.length > 0) {
        return pluginPrefixes.some((prefix) => {
            const regex = new RegExp(`^${prefix}`);
            return regex.test(pluginDirName);
        });
    }
    return true;
}
async function verifyAndAdd(pluginPlatform, pluginDirPath) {
    const pluginVerificationResult = await (0, verify_plugin_1.verifyPlugin)(pluginDirPath);
    if (pluginVerificationResult.verified &&
        pluginVerificationResult.manifest.name !== amplify_cli_core_1.constants.CORE) {
        const manifest = pluginVerificationResult.manifest;
        const { name, version } = pluginVerificationResult.packageJson;
        const pluginInfo = new amplify_cli_core_1.PluginInfo(name, version, pluginDirPath, manifest);
        let isPluginExcluded = false;
        if (pluginPlatform.excluded && pluginPlatform.excluded[manifest.name]) {
            isPluginExcluded = pluginPlatform.excluded[manifest.name].some((item) => (0, compare_plugins_1.twoPluginsAreTheSame)(item, pluginInfo));
        }
        if (!isPluginExcluded) {
            pluginPlatform.plugins[manifest.name] = pluginPlatform.plugins[manifest.name] || [];
            const pluginAlreadyAdded = pluginPlatform.plugins[manifest.name].some((item) => (0, compare_plugins_1.twoPluginsAreTheSame)(item, pluginInfo));
            if (!pluginAlreadyAdded) {
                pluginPlatform.plugins[manifest.name].push(pluginInfo);
            }
        }
    }
}
function isUnderScanCoverageSync(pluginPlatform, pluginDirPath) {
    let result = false;
    pluginDirPath = path.normalize(pluginDirPath);
    const pluginDirName = path.basename(pluginDirPath);
    if (fs.existsSync(pluginDirPath) && isMatchingNamePattern(pluginPlatform.pluginPrefixes, pluginDirName)) {
        result = pluginPlatform.pluginDirectories.some((directory) => {
            directory = normalizePluginDirectory(directory);
            if (fs.existsSync(directory) && (0, is_child_path_1.default)(pluginDirPath, directory)) {
                return true;
            }
            return undefined;
        });
    }
    return result;
}
exports.isUnderScanCoverageSync = isUnderScanCoverageSync;
const addPluginPrefixWithMatchingPattern = async (subDirNames, directory, pluginPlatform) => {
    if (subDirNames.length > 0) {
        const scanSubDirTasks = subDirNames.map((subDirName) => {
            return async () => {
                if (isMatchingNamePattern(pluginPlatform.pluginPrefixes, subDirName)) {
                    const pluginDirPath = path.join(directory, subDirName);
                    await verifyAndAdd(pluginPlatform, pluginDirPath);
                }
            };
        });
        await (0, promise_sequential_1.default)(scanSubDirTasks);
    }
};
//# sourceMappingURL=scan-plugin-platform.js.map