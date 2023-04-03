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
exports.raiseEvent = exports.raisePostEnvAddEvent = exports.raiseInternalOnlyPostEnvRemoveEvent = exports.raisePrePushEvent = exports.isContainersEnabled = exports.executeCommand = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const set_ops_1 = require("./utils/set-ops");
const plugin_manager_1 = require("./plugin-manager");
const amplify_cli_core_1 = require("amplify-cli-core");
const headless_input_utils_1 = require("./utils/headless-input-utils");
const executeCommand = async (context) => {
    const pluginCandidates = (0, plugin_manager_1.getPluginsWithNameAndCommand)(context.pluginPlatform, context.input.plugin, context.input.command);
    if (pluginCandidates.length === 1) {
        await executePluginModuleCommand(context, pluginCandidates[0]);
    }
    else if (pluginCandidates.length > 1) {
        const selectedPluginInfo = await selectPluginForExecution(context, pluginCandidates);
        await executePluginModuleCommand(context, selectedPluginInfo);
    }
};
exports.executeCommand = executeCommand;
const isContainersEnabled = (context) => {
    var _a, _b, _c;
    const projectConfig = context.amplify.getProjectConfig();
    return (_c = (_b = (_a = projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig[projectConfig.frontend]) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.ServerlessContainers) !== null && _c !== void 0 ? _c : false;
};
exports.isContainersEnabled = isContainersEnabled;
const selectPluginForExecution = async (context, pluginCandidates) => {
    let result = pluginCandidates[0];
    let promptForSelection = true;
    const noSmartPickCommands = ['add', 'help'];
    const commandAllowsSmartPick = !noSmartPickCommands.includes(context.input.command);
    if (commandAllowsSmartPick) {
        const smartPickResult = smartPickPlugin(pluginCandidates);
        if (smartPickResult) {
            result = smartPickResult;
            promptForSelection = false;
        }
    }
    if (promptForSelection) {
        const displayNames = pluginCandidates.map((candidate) => { var _a; return (_a = candidate === null || candidate === void 0 ? void 0 : candidate.manifest) === null || _a === void 0 ? void 0 : _a.displayName; });
        const noDuplicateDisplayNames = new Set(displayNames).size === displayNames.length;
        const consoleHostingPlugins = pluginCandidates.filter((pluginInfo) => pluginInfo.packageName === '@aws-amplify/amplify-console-hosting');
        if (consoleHostingPlugins.length > 0) {
            const otherPlugins = pluginCandidates.filter((pluginInfo) => pluginInfo.packageName !== '@aws-amplify/amplify-console-hosting');
            pluginCandidates = consoleHostingPlugins.concat(otherPlugins);
        }
        const amplifyMeta = context.amplify.getProjectMeta();
        const { Region } = amplifyMeta.providers.awscloudformation;
        if (!(0, exports.isContainersEnabled)(context) || Region !== 'us-east-1') {
            pluginCandidates = pluginCandidates.filter((plugin) => { var _a; return !((_a = plugin.manifest.services) === null || _a === void 0 ? void 0 : _a.includes('ElasticContainer')); });
        }
        result = await amplify_prompts_1.prompter.pick('Select the plugin module to execute', pluginCandidates.map((plugin) => {
            const displayName = plugin.manifest.displayName && noDuplicateDisplayNames
                ? plugin.manifest.displayName
                : `${plugin.packageName}@${plugin.packageVersion}`;
            return {
                name: displayName,
                value: plugin,
            };
        }));
    }
    return result;
};
const smartPickPlugin = (pluginCandidates) => {
    const candidatesAreAllCategoryPlugins = pluginCandidates.every((pluginInfo) => pluginInfo.manifest.type === 'category');
    const pluginName = pluginCandidates[0].manifest.name;
    const candidatesAllHaveTheSameName = pluginCandidates.every((pluginInfo) => pluginInfo.manifest.name === pluginName);
    if (candidatesAreAllCategoryPlugins && candidatesAllHaveTheSameName && amplify_cli_core_1.stateManager.metaFileExists()) {
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const servicesSetInMeta = new Set(Object.keys(amplifyMeta[pluginName] || {}));
        const pluginWithMatchingServices = [];
        const pluginWithDisjointServices = [];
        const pluginWithoutServicesDeclared = [];
        pluginCandidates.forEach((candidate) => {
            if (candidate.manifest.services && candidate.manifest.services.length > 0) {
                const servicesSetInPlugin = new Set(candidate.manifest.services);
                if ((0, set_ops_1.twoStringSetsAreEqual)(servicesSetInMeta, servicesSetInPlugin)) {
                    pluginWithMatchingServices.push(candidate);
                }
                if ((0, set_ops_1.twoStringSetsAreDisjoint)(servicesSetInMeta, servicesSetInPlugin)) {
                    pluginWithDisjointServices.push(candidate);
                }
            }
            else {
                pluginWithDisjointServices.push(candidate);
                pluginWithoutServicesDeclared.push(candidate);
            }
        });
        if (pluginWithMatchingServices.length === 1 && pluginWithDisjointServices.length === pluginCandidates.length - 1) {
            return pluginWithMatchingServices[0];
        }
        if (pluginWithDisjointServices.length === pluginCandidates.length && pluginWithoutServicesDeclared.length === 1) {
            return pluginWithoutServicesDeclared[0];
        }
    }
    return undefined;
};
const executePluginModuleCommand = async (context, plugin) => {
    const { commands, commandAliases } = plugin.manifest;
    if (!commands.includes(context.input.command)) {
        context.input.command = commandAliases[context.input.command];
    }
    if (!fs.existsSync(plugin.packageLocation)) {
        await (0, plugin_manager_1.scan)();
        context.print.error('The Amplify CLI plugin platform detected an error.');
        context.print.info('It has performed a fresh scan.');
        context.print.info('Please execute your command again.');
        return;
    }
    const handler = await getHandler(plugin, context);
    await attachContextExtensions(context, plugin);
    await raisePreEvent(context);
    context.usageData.stopCodePathTimer(amplify_cli_core_1.FromStartupTimedCodePaths.PLATFORM_STARTUP);
    context.usageData.startCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PLUGIN_TIME);
    await handler();
    context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PLUGIN_TIME);
    context.usageData.startCodePathTimer(amplify_cli_core_1.UntilExitTimedCodePath.POST_PROCESS);
    await raisePostEvent(context);
};
const getHandler = async (pluginInfo, context) => {
    const pluginModule = await Promise.resolve().then(() => __importStar(require(pluginInfo.packageLocation)));
    let commandName = amplify_cli_core_1.constants.EXECUTE_AMPLIFY_COMMAND;
    let fallbackFn = () => legacyCommandExecutor(context, pluginInfo);
    if ((0, headless_input_utils_1.isHeadlessCommand)(context)) {
        commandName = amplify_cli_core_1.constants.EXECUTE_AMPLIFY_HEADLESS_COMMAND;
        fallbackFn = () => context.print.error(`Headless mode is not implemented for ${pluginInfo.packageName}`);
    }
    if (typeof (pluginModule === null || pluginModule === void 0 ? void 0 : pluginModule[commandName]) === 'function') {
        if (commandName === amplify_cli_core_1.constants.EXECUTE_AMPLIFY_HEADLESS_COMMAND) {
            return async () => pluginModule[commandName](context, await (0, headless_input_utils_1.readHeadlessPayload)());
        }
        return () => pluginModule[commandName](context);
    }
    return fallbackFn;
};
const legacyCommandExecutor = async (context, plugin) => {
    let commandFilePath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name, context.input.command));
    if (context.input.subCommands && context.input.subCommands.length > 0) {
        commandFilePath = path.join(commandFilePath, ...context.input.subCommands);
    }
    let commandModule;
    try {
        commandModule = await Promise.resolve().then(() => __importStar(require(commandFilePath)));
    }
    catch (e) {
    }
    if (!commandModule) {
        commandFilePath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name));
        try {
            commandModule = await Promise.resolve().then(() => __importStar(require(commandFilePath)));
        }
        catch (e) {
        }
    }
    if (commandModule) {
        await attachContextExtensions(context, plugin);
        await commandModule.run(context);
    }
    else {
        const { showAllHelp } = await Promise.resolve().then(() => __importStar(require('./extensions/amplify-helpers/show-all-help')));
        showAllHelp(context);
    }
};
const EVENT_EMITTING_PLUGINS = new Set([amplify_cli_core_1.constants.CORE, amplify_cli_core_1.constants.CODEGEN]);
const raisePreEvent = async (context) => {
    await (0, amplify_cli_core_1.executeHooks)(amplify_cli_core_1.HooksMeta.getInstance(context.input, 'pre'));
    const { command, plugin } = context.input;
    if (!plugin || !EVENT_EMITTING_PLUGINS.has(plugin)) {
        return;
    }
    switch (command) {
        case 'init':
            await raisePreInitEvent(context);
            break;
        case 'push':
            await (0, exports.raisePrePushEvent)(context);
            break;
        case 'pull':
            await raisePrePullEvent(context);
            break;
        case 'models':
            await raisePreCodegenModelsEvent(context);
            break;
        case 'export':
            await raisePreExportEvent(context);
            break;
        default:
    }
};
const raisePreInitEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PreInit, data: {} });
};
const raisePrePushEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PrePush, data: {} });
};
exports.raisePrePushEvent = raisePrePushEvent;
const raisePrePullEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PrePull, data: {} });
};
const raisePreExportEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PreExport, data: {} });
};
const raisePreCodegenModelsEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PreCodegenModels, data: {} });
};
const raisePostEvent = async (context) => {
    const { command, plugin } = context.input;
    if (!plugin || !EVENT_EMITTING_PLUGINS.has(plugin)) {
        await (0, amplify_cli_core_1.executeHooks)(amplify_cli_core_1.HooksMeta.getInstance(context.input, 'post'));
        return;
    }
    switch (command) {
        case 'init':
            await raisePostInitEvent(context);
            break;
        case 'push':
            await raisePostPushEvent(context);
            break;
        case 'pull':
            await raisePostPullEvent(context);
            break;
        case 'models':
            await raisePostCodegenModelsEvent(context);
            break;
        default:
    }
    await (0, amplify_cli_core_1.executeHooks)(amplify_cli_core_1.HooksMeta.getInstance(context.input, 'post'));
};
const raisePostInitEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PostInit, data: {} });
};
const raisePostPushEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PostPush, data: {} });
};
const raisePostPullEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PostPull, data: {} });
};
const raisePostCodegenModelsEvent = async (context) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PostCodegenModels, data: {} });
};
const raiseInternalOnlyPostEnvRemoveEvent = async (context, envName) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.InternalOnlyPostEnvRemove, data: { envName } });
};
exports.raiseInternalOnlyPostEnvRemoveEvent = raiseInternalOnlyPostEnvRemoveEvent;
const raisePostEnvAddEvent = async (context, prevEnvName, newEnvName) => {
    await (0, exports.raiseEvent)(context, { event: amplify_cli_core_1.AmplifyEvent.PostEnvAdd, data: { prevEnvName, newEnvName } });
};
exports.raisePostEnvAddEvent = raisePostEnvAddEvent;
const raiseEvent = async (context, args) => {
    const plugins = (0, plugin_manager_1.getPluginsWithEventHandler)(context.pluginPlatform, args.event);
    if (plugins.length > 0) {
        const eventHandlers = plugins
            .filter((plugin) => {
            const exists = fs.existsSync(plugin.packageLocation);
            return exists;
        })
            .map((plugin) => {
            const eventHandler = async () => {
                await attachContextExtensions(context, plugin);
                const pluginModule = await Promise.resolve().then(() => __importStar(require(plugin.packageLocation)));
                await pluginModule.handleAmplifyEvent(context, args);
            };
            return eventHandler;
        });
        for (const eventHandler of eventHandlers) {
            await eventHandler();
        }
    }
};
exports.raiseEvent = raiseEvent;
const attachContextExtensions = async (context, plugin) => {
    const extensionsDirPath = path.normalize(path.join(plugin.packageLocation, 'extensions'));
    if (fs.existsSync(extensionsDirPath)) {
        const stats = fs.statSync(extensionsDirPath);
        if (stats.isDirectory()) {
            const itemNames = fs.readdirSync(extensionsDirPath);
            for (const itemName of itemNames) {
                const itemPath = path.join(extensionsDirPath, itemName);
                try {
                    const itemModule = await Promise.resolve().then(() => __importStar(require(itemPath)));
                    itemModule(context);
                }
                catch (e) {
                }
            }
        }
    }
};
//# sourceMappingURL=execution-manager.js.map