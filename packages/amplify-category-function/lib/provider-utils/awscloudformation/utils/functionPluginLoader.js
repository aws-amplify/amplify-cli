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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeManager = exports.loadPluginFromFactory = exports.runtimeWalkthrough = exports.templateWalkthrough = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../../../constants");
async function templateWalkthrough(context, params) {
    const { service } = params.providerContext;
    const selectionOptions = {
        pluginType: 'functionTemplate',
        listOptionsField: 'templates',
        predicate: (condition) => {
            return (condition.provider === params.providerContext.provider &&
                condition.services.includes(service) &&
                (condition.runtime === params.runtime.value ||
                    (Array.isArray(condition.runtime) && condition.runtime.includes(params.runtime.value))));
        },
        selectionPrompt: 'Choose the function template that you want to use:',
        notFoundMessage: `No ${params.runtime.name} ${params.providerContext.service} templates found`,
        service,
        defaultSelection: params.template,
    };
    const selections = await getSelectionsFromContributors(context, selectionOptions);
    const selection = selections[0];
    const plugin = await loadPluginFromFactory(selection.pluginPath, 'functionTemplateContributorFactory', context);
    const contributionRequest = {
        selection: selection.value,
        contributionContext: {
            runtime: params.runtime,
            functionName: params.functionName,
            resourceName: params.resourceName,
        },
    };
    return await plugin.contribute(contributionRequest);
}
exports.templateWalkthrough = templateWalkthrough;
async function runtimeWalkthrough(context, params) {
    const { service } = params.providerContext;
    let runtimeLayers;
    if (isLayerParameter(params)) {
        runtimeLayers = params.runtimes.map((runtime) => runtime.name);
    }
    const selectionOptions = {
        pluginType: 'functionRuntime',
        listOptionsField: 'runtimes',
        predicate: (condition) => {
            return condition.provider === params.providerContext.provider && condition.services.includes(service);
        },
        selectionPrompt: 'Choose the runtime that you want to use:',
        notFoundMessage: `No runtimes found for provider ${params.providerContext.provider} and service ${params.providerContext.service}`,
        service,
        runtimeState: runtimeLayers,
        defaultSelection: params.defaultRuntime,
    };
    const selections = await getSelectionsFromContributors(context, selectionOptions);
    const plugins = [];
    for (const selection of selections) {
        const plugin = await loadPluginFromFactory(selection.pluginPath, 'functionRuntimeContributorFactory', context);
        const depCheck = await plugin.checkDependencies(selection.value);
        if (!depCheck.hasRequiredDependencies) {
            context.print.warning(depCheck.errorMessage || 'Some dependencies required for building and packaging this runtime are not installed');
        }
        plugins.push(plugin);
    }
    return _functionRuntimeWalkthroughHelper(params, plugins, selections);
}
exports.runtimeWalkthrough = runtimeWalkthrough;
async function _functionRuntimeWalkthroughHelper(params, plugins, selections) {
    const runtimes = [];
    for (let i = 0; i < selections.length && i < plugins.length; ++i) {
        const contributionRequest = {
            selection: selections[i].value,
            contributionContext: {
                functionName: isLayerParameter(params) ? params.layerName : params.functionName,
                resourceName: isLayerParameter(params) ? params.layerName : params.resourceName,
            },
        };
        const contribution = await plugins[i].contribute(contributionRequest);
        runtimes.push({
            ...contribution,
            runtimePluginId: selections[i].pluginId,
        });
    }
    return runtimes;
}
async function getSelectionsFromContributors(context, selectionOptions) {
    const notFoundSuffix = 'You can download and install additional plugins then rerun this command';
    const templateProviders = context.pluginPlatform.plugins[selectionOptions.pluginType];
    if (!templateProviders) {
        context.print.error(selectionOptions.notFoundMessage);
        context.print.error(notFoundSuffix);
        throw new Error('No plugins found for function configuration');
    }
    const selectionMap = new Map();
    const selections = templateProviders
        .filter((meta) => selectionOptions.predicate(meta.manifest[selectionOptions.pluginType].conditions))
        .map((meta) => {
        const packageLoc = meta.packageLocation;
        const pluginId = meta.manifest[selectionOptions.pluginType].pluginId;
        meta.manifest[selectionOptions.pluginType][selectionOptions.listOptionsField].forEach((op) => {
            selectionMap.set(op.value, { path: packageLoc, pluginId });
        });
        return meta;
    })
        .map((meta) => meta.manifest[selectionOptions.pluginType])
        .map((contributes) => contributes[selectionOptions.listOptionsField])
        .reduce((acc, it) => acc.concat(it), [])
        .sort((a, b) => a.name.localeCompare(b.name));
    let selection;
    if (selections.length === 0) {
        context.print.error(selectionOptions.notFoundMessage);
        context.print.error(notFoundSuffix);
        throw new Error('Plugins found but no selections supplied for function configuration');
    }
    else if (selections.length === 1) {
        let singleOptionMsg = `Only one selection option found for ${selectionOptions.listOptionsField}. Using ${selections[0].name} by default`;
        if (selectionOptions.listOptionsField === 'templates') {
            singleOptionMsg = `Only one template found - using ${selections[0].name} by default.`;
        }
        else if (selectionOptions.listOptionsField === 'runtimes') {
            singleOptionMsg = `Only one runtime detected: ${selections[0].name}. Learn more about additional runtimes at https://docs.amplify.aws/cli/function`;
        }
        context.print.info(singleOptionMsg);
        selection = selections[0].value;
    }
    else if (isDefaultDefined(selectionOptions)) {
        selection = selectionOptions.defaultSelection;
    }
    else {
        const answer = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selection',
                message: selectionOptions.selectionPrompt,
                choices: selections,
                default: defaultSelection(selectionOptions, selections),
            },
        ]);
        selection = answer.selection;
    }
    if (!Array.isArray(selection)) {
        selection = [selection];
    }
    return selection.map((s) => {
        return {
            value: s,
            pluginPath: selectionMap.get(s).path,
            pluginId: selectionMap.get(s).pluginId,
        };
    });
}
function isDefaultDefined(selectionOptions) {
    return (selectionOptions.defaultSelection &&
        (selectionOptions.pluginType == 'functionTemplate' || selectionOptions.pluginType == 'functionRuntime'));
}
async function loadPluginFromFactory(pluginPath, expectedFactoryFunction, context) {
    let plugin;
    try {
        plugin = await (_a = pluginPath, Promise.resolve().then(() => __importStar(require(_a))));
    }
    catch (err) {
        throw new Error(`Could not load selected plugin. Error is [${err}]`);
    }
    if (!plugin) {
        throw new Error('Could not load selected plugin');
    }
    return plugin[expectedFactoryFunction](context);
}
exports.loadPluginFromFactory = loadPluginFromFactory;
async function getRuntimeManager(context, resourceName) {
    const { pluginId, functionRuntime } = context.amplify.readBreadcrumbs(constants_1.categoryName, resourceName);
    return {
        ...(await context.amplify.loadRuntimePlugin(context, pluginId)),
        runtime: functionRuntime,
    };
}
exports.getRuntimeManager = getRuntimeManager;
function isLayerParameter(params) {
    return params.runtimes !== undefined;
}
function defaultSelection(selectionOptions, selections) {
    if (selectionOptions.service === "Lambda") {
        if (selectionOptions.listOptionsField === 'runtimes') {
            return 'nodejs';
        }
        else {
            return 'hello-world';
        }
    }
    else {
        if (selectionOptions.runtimeState !== undefined) {
            return selections
                .filter((selection) => selectionOptions.runtimeState.includes(selection.name))
                .forEach((selection) => lodash_1.default.assign(selection, { checked: true }));
        }
        else {
            return undefined;
        }
    }
}
//# sourceMappingURL=functionPluginLoader.js.map