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
exports.removePluginPackage = exports.addPluginPackage = exports.addExcludedPluginPackage = exports.addUserPluginPackage = exports.confirmAndScan = exports.createNewPlugin = exports.verifyPlugin = exports.scan = exports.getAllPluginNames = exports.getPluginsWithEventHandler = exports.getPluginsWithNameAndCommand = exports.getPluginsWithName = exports.getPluginPlatform = void 0;
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const access_plugins_file_1 = require("./plugin-helpers/access-plugins-file");
const scan_plugin_platform_1 = require("./plugin-helpers/scan-plugin-platform");
const verify_plugin_1 = require("./plugin-helpers/verify-plugin");
Object.defineProperty(exports, "verifyPlugin", { enumerable: true, get: function () { return verify_plugin_1.verifyPlugin; } });
const create_new_plugin_1 = __importDefault(require("./plugin-helpers/create-new-plugin"));
exports.createNewPlugin = create_new_plugin_1.default;
const add_plugin_result_1 = require("./domain/add-plugin-result");
const compare_plugins_1 = require("./plugin-helpers/compare-plugins");
const post_install_initialization_1 = require("./utils/post-install-initialization");
async function getPluginPlatform() {
    let pluginPlatform = (0, access_plugins_file_1.readPluginsJsonFile)();
    if (pluginPlatform) {
        if (isCoreMatching(pluginPlatform)) {
            const lastScanTime = new Date(pluginPlatform.lastScanTime);
            const currentTime = new Date();
            const timeDiffInSeconds = (currentTime.getTime() - lastScanTime.getTime()) / 1000;
            if (timeDiffInSeconds > pluginPlatform.maxScanIntervalInSeconds) {
                pluginPlatform = await scan();
            }
        }
        else {
            await (0, post_install_initialization_1.postInstallInitialization)();
            pluginPlatform = await scan();
        }
    }
    else {
        await (0, post_install_initialization_1.postInstallInitialization)();
        pluginPlatform = await scan();
    }
    return pluginPlatform;
}
exports.getPluginPlatform = getPluginPlatform;
function isCoreMatching(pluginPlatform) {
    try {
        const currentCorePluginDirPath = (0, scan_plugin_platform_1.getCorePluginDirPath)();
        const currentCorePluginVersion = (0, scan_plugin_platform_1.getCorePluginVersion)();
        const platformCorePluginDirPath = pluginPlatform.plugins[amplify_cli_core_1.constants.CORE][0].packageLocation;
        const platformCorePluginVersion = pluginPlatform.plugins[amplify_cli_core_1.constants.CORE][0].packageVersion;
        return currentCorePluginDirPath === platformCorePluginDirPath && currentCorePluginVersion === platformCorePluginVersion;
    }
    catch (_a) {
        return false;
    }
}
function getPluginsWithName(pluginPlatform, nameOrAlias) {
    let result = new Array();
    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        if (pluginName === nameOrAlias) {
            result = result.concat(pluginPlatform.plugins[pluginName]);
        }
        else {
            pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
                if (pluginInfo.manifest.aliases && pluginInfo.manifest.aliases.includes(nameOrAlias)) {
                    result.push(pluginInfo);
                }
            });
        }
    });
    return result;
}
exports.getPluginsWithName = getPluginsWithName;
function getPluginsWithNameAndCommand(pluginPlatform, nameOrAlias, command) {
    const result = new Array();
    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
            const { name, aliases, commands, commandAliases } = pluginInfo.manifest;
            const nameOrAliasMatching = name === nameOrAlias || (aliases && aliases.includes(nameOrAlias));
            if (nameOrAliasMatching) {
                if ((commands && commands.includes(command)) || (commandAliases && Object.keys(commandAliases).includes(command))) {
                    result.push(pluginInfo);
                }
            }
        });
    });
    return result;
}
exports.getPluginsWithNameAndCommand = getPluginsWithNameAndCommand;
function getPluginsWithEventHandler(pluginPlatform, event) {
    const result = new Array();
    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
            const { eventHandlers } = pluginInfo.manifest;
            if (eventHandlers && eventHandlers.length > 0 && eventHandlers.includes(event)) {
                result.push(pluginInfo);
            }
        });
    });
    return result;
}
exports.getPluginsWithEventHandler = getPluginsWithEventHandler;
function getAllPluginNames(pluginPlatform) {
    const result = new Set();
    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        result.add(pluginName);
        pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
            if (pluginInfo.manifest.aliases && pluginInfo.manifest.aliases.length > 0) {
                pluginInfo.manifest.aliases.forEach((alias) => {
                    result.add(alias);
                });
            }
        });
    });
    return result;
}
exports.getAllPluginNames = getAllPluginNames;
async function scan(pluginPlatform) {
    try {
        const result = await (0, scan_plugin_platform_1.scanPluginPlatform)(pluginPlatform);
        return result;
    }
    catch (e) {
        amplify_cli_core_1.print.error('Plugin scan failed.');
        amplify_cli_core_1.print.info(e);
        throw new Error('Plugin scan failed.');
    }
}
exports.scan = scan;
async function confirmAndScan(pluginPlatform) {
    const { confirmed } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmed',
        message: 'Run a fresh scan for plugins on the Amplify CLI pluggable platform',
        default: false,
    });
    if (confirmed) {
        await scan(pluginPlatform);
    }
}
exports.confirmAndScan = confirmAndScan;
const addUserPluginPackage = async (pluginPlatform, pluginDirPath) => {
    return (0, exports.addPluginPackage)(pluginPlatform, pluginDirPath);
};
exports.addUserPluginPackage = addUserPluginPackage;
const addExcludedPluginPackage = async (pluginPlatform, pluginInfo) => {
    return (0, exports.addPluginPackage)(pluginPlatform, pluginInfo.packageLocation);
};
exports.addExcludedPluginPackage = addExcludedPluginPackage;
const addPluginPackage = async (pluginPlatform, pluginDirPath) => {
    const pluginVerificationResult = await (0, verify_plugin_1.verifyPlugin)(pluginDirPath);
    const result = new add_plugin_result_1.AddPluginResult(false, pluginVerificationResult);
    if (pluginVerificationResult.verified) {
        const { packageJson, manifest } = pluginVerificationResult;
        const pluginInfo = new amplify_cli_core_1.PluginInfo(packageJson.name, packageJson.version, pluginDirPath, manifest);
        if (pluginPlatform.excluded[pluginInfo.manifest.name] && pluginPlatform.excluded[pluginInfo.manifest.name].length > 0) {
            const updatedExcluded = new Array();
            pluginPlatform.excluded[pluginInfo.manifest.name].forEach((pluginInfoItem) => {
                if (!(0, compare_plugins_1.twoPluginsAreTheSame)(pluginInfoItem, pluginInfo)) {
                    updatedExcluded.push(pluginInfoItem);
                }
            });
            if (updatedExcluded.length > 0) {
                pluginPlatform.excluded[pluginInfo.manifest.name] = updatedExcluded;
            }
            else {
                delete pluginPlatform.excluded[pluginInfo.manifest.name];
            }
        }
        const updatedPlugins = new Array();
        if (pluginPlatform.plugins[pluginInfo.manifest.name] && pluginPlatform.plugins[pluginInfo.manifest.name].length > 0) {
            pluginPlatform.plugins[pluginInfo.manifest.name].forEach((pluginInfoItem) => {
                if (!(0, compare_plugins_1.twoPluginsAreTheSame)(pluginInfoItem, pluginInfo)) {
                    updatedPlugins.push(pluginInfoItem);
                }
            });
        }
        updatedPlugins.push(pluginInfo);
        pluginPlatform.plugins[pluginInfo.manifest.name] = updatedPlugins;
        if (!(0, scan_plugin_platform_1.isUnderScanCoverageSync)(pluginPlatform, pluginDirPath) && !pluginPlatform.userAddedLocations.includes(pluginDirPath)) {
            pluginPlatform.userAddedLocations.push(pluginDirPath);
        }
        (0, access_plugins_file_1.writePluginsJsonFile)(pluginPlatform);
        result.isAdded = true;
    }
    else {
        result.error = add_plugin_result_1.AddPluginError.FailedVerification;
    }
    return result;
};
exports.addPluginPackage = addPluginPackage;
function removePluginPackage(pluginPlatform, pluginInfo) {
    if (pluginPlatform.plugins[pluginInfo.manifest.name] && pluginPlatform.plugins[pluginInfo.manifest.name].length > 0) {
        const updatedPlugins = new Array();
        pluginPlatform.plugins[pluginInfo.manifest.name].forEach((pluginInfoItem) => {
            if (!(0, compare_plugins_1.twoPluginsAreTheSame)(pluginInfoItem, pluginInfo)) {
                updatedPlugins.push(pluginInfoItem);
            }
        });
        if (updatedPlugins.length > 0) {
            pluginPlatform.plugins[pluginInfo.manifest.name] = updatedPlugins;
        }
        else {
            delete pluginPlatform.plugins[pluginInfo.manifest.name];
        }
    }
    if (pluginPlatform.userAddedLocations.includes(pluginInfo.packageLocation)) {
        const updatedUserAddedLocations = new Array();
        pluginPlatform.userAddedLocations.forEach((packageLocation) => {
            if (packageLocation !== pluginInfo.packageLocation) {
                updatedUserAddedLocations.push(packageLocation);
            }
        });
        pluginPlatform.userAddedLocations = updatedUserAddedLocations;
    }
    if ((0, scan_plugin_platform_1.isUnderScanCoverageSync)(pluginPlatform, pluginInfo.packageLocation)) {
        pluginPlatform.excluded[pluginInfo.manifest.name] = pluginPlatform.excluded[pluginInfo.manifest.name] || [];
        pluginPlatform.excluded[pluginInfo.manifest.name].push(pluginInfo);
    }
    (0, access_plugins_file_1.writePluginsJsonFile)(pluginPlatform);
}
exports.removePluginPackage = removePluginPackage;
//# sourceMappingURL=plugin-manager.js.map