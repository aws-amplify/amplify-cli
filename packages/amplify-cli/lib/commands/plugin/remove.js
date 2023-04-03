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
const inquirer = __importStar(require("inquirer"));
const plugin_manager_1 = require("../../plugin-manager");
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer_helper_1 = require("../../domain/inquirer-helper");
const run = async (context) => {
    const options = new Array();
    const { plugins } = context.pluginPlatform;
    if (plugins && Object.keys(plugins).length > 0) {
        Object.keys(plugins).forEach((key) => {
            if (key === amplify_cli_core_1.constants.CORE) {
                return;
            }
            if (plugins[key].length > 0) {
                const option = {
                    name: key + inquirer_helper_1.EXPAND,
                    value: plugins[key],
                    short: key + inquirer_helper_1.EXPAND,
                };
                if (plugins[key].length === 1) {
                    const pluginInfo = plugins[key][0];
                    option.name = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
                    option.short = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
                }
                options.push(option);
            }
        });
    }
    if (options.length > 0) {
        const { selections } = await inquirer.prompt({
            type: 'checkbox',
            name: 'selections',
            message: 'Select the plugin packages to remove',
            choices: options,
        });
        if (selections.length > 0) {
            const sequential = require('promise-sequential');
            const removeTasks = selections.map((selection) => async () => {
                await removeNamedPlugins(context.pluginPlatform, selection);
            });
            await sequential(removeTasks);
            await (0, plugin_manager_1.confirmAndScan)(context.pluginPlatform);
        }
    }
    else {
        context.print.console.error('No plugins are found');
    }
};
exports.run = run;
async function removeNamedPlugins(pluginPlatform, pluginInfo) {
    if (pluginInfo.length === 1) {
        (0, plugin_manager_1.removePluginPackage)(pluginPlatform, pluginInfo[0]);
    }
    else if (pluginInfo.length > 1) {
        const options = pluginInfo.map((singlePluginInfo) => {
            const optionObject = {
                name: singlePluginInfo.packageName + '@' + singlePluginInfo.packageVersion,
                value: singlePluginInfo,
                short: singlePluginInfo.packageName + '@' + singlePluginInfo.packageVersion,
            };
            return optionObject;
        });
        const { selections } = await inquirer.prompt({
            type: 'checkbox',
            name: 'selections',
            message: 'Select the plugin packages to remove',
            choices: options,
        });
        if (selections.length > 0) {
            const sequential = require('promise-sequential');
            const removeTasks = selections.map((singlePluginInfo) => async () => {
                await (0, plugin_manager_1.removePluginPackage)(pluginPlatform, singlePluginInfo);
            });
            await sequential(removeTasks);
        }
    }
}
//# sourceMappingURL=remove.js.map