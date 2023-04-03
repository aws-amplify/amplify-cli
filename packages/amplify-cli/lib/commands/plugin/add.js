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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const os = __importStar(require("os"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const plugin_manager_1 = require("../../plugin-manager");
const inquirer_helper_1 = require("../../domain/inquirer-helper");
const add_plugin_result_1 = require("../../domain/add-plugin-result");
const scan_plugin_platform_1 = require("../../plugin-helpers/scan-plugin-platform");
const NEW_PLUGIN_PACKAGE = 'A new plugin package';
const CANCEL = 'cancel';
const run = async (context) => {
    if (context.input.subCommands && context.input.subCommands.length > 1) {
        const input = context.input.subCommands[1];
        const { excluded } = context.pluginPlatform;
        if (excluded[input] && excluded[input].length > 0) {
            const { confirmed } = await inquirer.prompt({
                type: 'confirm',
                name: 'confirmed',
                message: `Add from previously removed ${input} plugin`,
                default: true,
            });
            if (confirmed) {
                await addExcludedPluginPackage(context, excluded[input]);
            }
            else {
                await resolvePluginPathAndAdd(context, input);
            }
        }
        else {
            await resolvePluginPathAndAdd(context, input);
        }
    }
    else {
        await promptAndAdd(context);
    }
};
exports.run = run;
async function resolvePluginPathAndAdd(context, inputPath) {
    const pluginDirPath = await resolvePluginPackagePath(context, inputPath);
    if (pluginDirPath) {
        await addNewPluginPackage(context, pluginDirPath);
    }
}
async function resolvePluginPackagePath(context, inputPath) {
    if (path.isAbsolute(inputPath)) {
        return inputPath;
    }
    let result;
    const { pluginPlatform } = context;
    let searchDirPaths = [amplify_cli_core_1.constants.PARENT_DIRECTORY, amplify_cli_core_1.constants.LOCAL_NODE_MODULES, amplify_cli_core_1.constants.GLOBAL_NODE_MODULES, process.cwd()];
    searchDirPaths = searchDirPaths.filter((dirPath) => !pluginPlatform.pluginDirectories.includes(dirPath.toString()));
    searchDirPaths = searchDirPaths.concat(pluginPlatform.pluginDirectories);
    const candidatePluginDirPaths = searchDirPaths
        .map((dirPath) => path.normalize(path.join((0, scan_plugin_platform_1.normalizePluginDirectory)(dirPath), inputPath)))
        .filter((pluginDirPath) => fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory());
    if (candidatePluginDirPaths.length === 0) {
        context.print.error('Can not locate the plugin package.');
        result = await promptForPluginPath();
    }
    else if (candidatePluginDirPaths.length === 1) {
        context.print.green('Plugin package found.');
        context.print.blue(candidatePluginDirPaths[0]);
        const { confirmed } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirmed',
            message: `Confirm to add the plugin package to your Amplify CLI.`,
            default: true,
        });
        if (confirmed) {
            result = candidatePluginDirPaths[0];
        }
    }
    else if (candidatePluginDirPaths.length > 1) {
        context.print.warning('Multiple plugins with the package name are found.');
        const options = candidatePluginDirPaths.concat([CANCEL]);
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'selection',
            message: 'Select the plugin package to add',
            choices: options,
        });
        if (answer.selection !== CANCEL) {
            result = answer.selection;
        }
    }
    return result;
}
async function promptAndAdd(context) {
    const options = new Array();
    const { excluded } = context.pluginPlatform;
    if (excluded && Object.keys(excluded).length > 0) {
        Object.keys(excluded).forEach((key) => {
            if (excluded[key].length > 0) {
                const option = {
                    name: key + inquirer_helper_1.EXPAND,
                    value: excluded[key],
                    short: key + inquirer_helper_1.EXPAND,
                };
                if (excluded[key].length === 1) {
                    const pluginInfo = excluded[key][0];
                    option.name = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
                    option.short = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
                }
                options.push(option);
            }
        });
    }
    if (options.length > 0) {
        options.unshift({
            name: NEW_PLUGIN_PACKAGE,
            value: NEW_PLUGIN_PACKAGE,
            short: NEW_PLUGIN_PACKAGE,
        });
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'selection',
            message: 'Select the plugin package to add',
            choices: options,
        });
        if (answer.selection === NEW_PLUGIN_PACKAGE) {
            const pluginDirPath = await promptForPluginPath();
            await addNewPluginPackage(context, pluginDirPath);
        }
        else {
            await addExcludedPluginPackage(context, answer.selection);
        }
    }
    else {
        const pluginDirPath = await promptForPluginPath();
        await addNewPluginPackage(context, pluginDirPath);
    }
}
async function promptForPluginPath() {
    const answer = await inquirer.prompt({
        type: 'input',
        name: 'pluginDirPath',
        message: `Enter the absolute path for the root of the plugin directory: ${os.EOL}`,
        transformer: (pluginDirPath) => pluginDirPath.trim(),
        validate: (pluginDirPath) => {
            pluginDirPath = pluginDirPath.trim();
            if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
                return true;
            }
            return 'The plugin package directory path you entered does NOT exist';
        },
    });
    return answer.pluginDirPath;
}
async function addNewPluginPackage(context, pluginDirPath) {
    try {
        const addUserPluginResult = await (0, plugin_manager_1.addUserPluginPackage)(context.pluginPlatform, pluginDirPath.trim());
        if (addUserPluginResult.isAdded) {
            context.print.success('Successfully added plugin package.');
            await (0, plugin_manager_1.confirmAndScan)(context.pluginPlatform);
        }
        else {
            context.print.error('Failed to add the plugin package.');
            context.print.info(`Error code: ${addUserPluginResult.error}`);
            if (addUserPluginResult.error === add_plugin_result_1.AddPluginError.FailedVerification &&
                addUserPluginResult.pluginVerificationResult &&
                addUserPluginResult.pluginVerificationResult.error) {
                context.print.info(`Plugin verification error code: ${addUserPluginResult.pluginVerificationResult.error}`);
            }
        }
    }
    catch (e) {
        context.print.error('Failed to add the plugin package.');
        context.print.info(e);
    }
}
async function addExcludedPluginPackage(context, userSelection) {
    if (userSelection.length > 0) {
        if (userSelection.length === 1) {
            await (0, plugin_manager_1.addExcludedPluginPackage)(context.pluginPlatform, userSelection[0]);
        }
        else {
            const options = new Array();
            userSelection.forEach((pluginInfo) => {
                options.push({
                    name: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
                    value: pluginInfo,
                    short: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
                });
            });
            const answer = await inquirer.prompt({
                type: 'list',
                name: 'selection',
                message: 'Select the plugin package to add',
                choices: options,
            });
            await (0, plugin_manager_1.addExcludedPluginPackage)(context.pluginPlatform, answer.selection);
        }
        await (0, plugin_manager_1.confirmAndScan)(context.pluginPlatform);
    }
}
//# sourceMappingURL=add.js.map