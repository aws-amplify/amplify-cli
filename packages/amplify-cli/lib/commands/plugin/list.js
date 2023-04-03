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
const display_plugin_platform_1 = require("../../plugin-helpers/display-plugin-platform");
const run = async (context) => {
    const { pluginPlatform } = context;
    const plugins = 'active plugins';
    const excluded = 'excluded plugins';
    const generalInfo = 'general information';
    const options = [plugins, excluded, generalInfo];
    const answer = await inquirer.prompt({
        type: 'list',
        name: 'selection',
        message: 'Select the section to list',
        choices: options,
    });
    switch (answer.selection) {
        case plugins:
            await listPluginCollection(context, pluginPlatform.plugins);
            break;
        case excluded:
            await listPluginCollection(context, pluginPlatform.excluded);
            break;
        case generalInfo:
            (0, display_plugin_platform_1.displayGeneralInfo)(context, pluginPlatform);
            break;
        default:
            await listPluginCollection(context, pluginPlatform.plugins);
            break;
    }
};
exports.run = run;
async function listPluginCollection(context, collection) {
    const all = 'all';
    const options = Object.keys(collection);
    if (options.length > 0) {
        let toList = options[0];
        if (options.length > 1) {
            options.push(all);
            const answer = await inquirer.prompt({
                type: 'list',
                name: 'selection',
                message: 'Select the name of the plugin to list',
                choices: options,
            });
            toList = answer.selection;
        }
        if (toList === all) {
            (0, display_plugin_platform_1.displayPluginCollection)(context, collection);
        }
        else {
            (0, display_plugin_platform_1.displayPluginInfoArray)(context, collection[toList]);
        }
    }
    else {
        context.print.info('The collection is empty');
    }
}
//# sourceMappingURL=list.js.map