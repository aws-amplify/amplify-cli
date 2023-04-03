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
exports.getOfficialPlugins = exports.checkPlatformHealth = void 0;
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const amplify_cli_core_1 = require("amplify-cli-core");
const semver_1 = require("semver");
const indent = '    ';
async function checkPlatformHealth(pluginPlatform) {
    const activePlugins = pluginPlatform.plugins;
    const officialPlugins = getOfficialPlugins();
    const missingOfficialPlugins = [];
    const mismatchedOfficialPlugins = [];
    Object.keys(officialPlugins).forEach((pluginName) => {
        let officialArray = [];
        if (!Array.isArray(officialPlugins[pluginName])) {
            officialArray.push(officialPlugins[pluginName]);
        }
        else {
            officialArray = officialPlugins[pluginName];
        }
        if (activePlugins[pluginName]) {
            const activeArray = activePlugins[pluginName];
            officialArray.forEach((officialPlugin) => {
                let matchLevel = 0;
                for (let i = 0; i < activeArray.length; i++) {
                    const activePlugin = activeArray[i];
                    if (activePlugin.packageName === officialPlugin.packageName) {
                        if (isMatching(officialPlugin, activePlugin)) {
                            matchLevel = 2;
                            break;
                        }
                        else {
                            matchLevel = 1;
                        }
                    }
                }
                if (matchLevel === 0) {
                    missingOfficialPlugins.push(officialPlugin);
                }
                if (matchLevel === 1) {
                    mismatchedOfficialPlugins.push(officialPlugin);
                }
            });
        }
        else {
            missingOfficialPlugins.push(...officialArray);
        }
    });
    if (missingOfficialPlugins.length > 0) {
        console.log(chalk_1.default.yellow('The following official plugins are missing or inactive:'));
        missingOfficialPlugins.forEach((pluginDescription) => {
            const { name, type, packageName, packageVersion } = pluginDescription;
            console.log(`${indent}${name}: ${type} | ${packageName}@${packageVersion}`);
        });
    }
    if (mismatchedOfficialPlugins.length > 0) {
        console.log(chalk_1.default.yellow('The following official plugins have mismatched packages:'));
        mismatchedOfficialPlugins.forEach((pluginDescription) => {
            const { name, type, packageName, packageVersion } = pluginDescription;
            console.log('Expected:');
            console.log(`${indent}${name}: ${type} | ${packageName}@${packageVersion}`);
            console.log('Found:');
            activePlugins[name].every((pluginInfo) => {
                const { manifest } = pluginInfo;
                console.log(`${indent}${manifest.name}: ${manifest.type} | ${pluginInfo.packageName}@${pluginInfo.packageVersion}`);
            });
        });
    }
    return missingOfficialPlugins.length === 0 && mismatchedOfficialPlugins.length === 0;
}
exports.checkPlatformHealth = checkPlatformHealth;
function isMatching(pluginDescription, pluginInfo) {
    let result = pluginDescription.packageName === pluginInfo.packageName && pluginDescription.type === pluginInfo.manifest.type;
    if (result && pluginDescription.packageVersion) {
        result = (0, semver_1.satisfies)(pluginInfo.packageVersion, pluginDescription.packageVersion);
    }
    return result;
}
function getOfficialPlugins() {
    const packageJsonFilePath = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
    const packageJson = amplify_cli_core_1.JSONUtilities.readJson(packageJsonFilePath);
    const { officialPlugins } = packageJson.amplify;
    const { dependencies } = packageJson;
    Object.keys(officialPlugins).forEach((plugin) => {
        const plugins = Array.isArray(officialPlugins[plugin]) ? officialPlugins[plugin] : [officialPlugins[plugin]];
        plugins.forEach((officialPlugin) => {
            const { packageName } = officialPlugin;
            if (dependencies[packageName]) {
                const version = dependencies[packageName];
                officialPlugin.packageVersion = version;
            }
            else {
                delete officialPlugin.packageVersion;
            }
        });
    });
    const coreVersion = packageJson.version;
    officialPlugins.core.packageVersion = coreVersion;
    return officialPlugins;
}
exports.getOfficialPlugins = getOfficialPlugins;
//# sourceMappingURL=platform-health-check.js.map