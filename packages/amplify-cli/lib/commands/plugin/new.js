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
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const plugin_manager_1 = require("../../plugin-manager");
const plugin_manager_2 = require("../../plugin-manager");
const add_plugin_result_1 = require("../../domain/add-plugin-result");
const run = async (context) => {
    const pluginDirPath = await (0, plugin_manager_1.createNewPlugin)(context, process.cwd());
    if (pluginDirPath) {
        const isPluggedInLocalAmplifyCLI = await plugIntoLocalAmplifyCli(context, pluginDirPath);
        printInfo(context, pluginDirPath, isPluggedInLocalAmplifyCLI);
    }
};
exports.run = run;
async function plugIntoLocalAmplifyCli(context, pluginDirPath) {
    let isPluggedIn = false;
    const addPluginResult = await (0, plugin_manager_2.addUserPluginPackage)(context.pluginPlatform, pluginDirPath);
    if (addPluginResult.isAdded) {
        isPluggedIn = true;
    }
    else {
        context.print.error('Failed to add the plugin package to the local Amplify CLI.');
        context.print.info(`Error code: ${addPluginResult.error}`);
        if (addPluginResult.error === add_plugin_result_1.AddPluginError.FailedVerification &&
            addPluginResult.pluginVerificationResult &&
            addPluginResult.pluginVerificationResult.error) {
            const { error } = addPluginResult.pluginVerificationResult;
            context.print.info(`Plugin verification error code: ${error}`);
        }
    }
    return isPluggedIn;
}
function printInfo(context, pluginDirPath, isPluggedInLocalAmplifyCLI) {
    context.print.info('');
    context.print.info(`The plugin package ${path.basename(pluginDirPath)} \
    has been successfully setup.`);
    context.print.info('Next steps:');
    if (!isPluggedInLocalAmplifyCLI) {
        context.print.info(`$ amplify plugin add: add the plugin into the local Amplify CLI for testing.`);
    }
    const amplifyPluginJsonFilePath = path.normalize(path.join(pluginDirPath, amplify_cli_core_1.constants.MANIFEST_FILE_NAME));
    const commandsDirPath = path.normalize(path.join(pluginDirPath, 'commands'));
    const eventHandlerDirPath = path.normalize(path.join(pluginDirPath, 'event-handlers'));
    context.print.info('');
    context.print.info('To add/remove command:');
    context.print.info('1. Add/remove the command name in the commands array in amplify-plugin.json.');
    context.print.green(amplifyPluginJsonFilePath);
    context.print.info('2. Add/remove the command code file in the commands folder.');
    context.print.green(commandsDirPath);
    context.print.info('');
    context.print.info('To add/remove eventHandlers:');
    context.print.info('1. Add/remove the event name in the eventHandlers array in amplify-plugin.json.');
    context.print.green(amplifyPluginJsonFilePath);
    context.print.info('2. Add/remove the event handler code file into the event-handler folder.');
    context.print.green(eventHandlerDirPath);
    context.print.info('');
}
//# sourceMappingURL=new.js.map