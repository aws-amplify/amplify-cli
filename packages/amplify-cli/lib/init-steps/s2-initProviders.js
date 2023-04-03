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
exports.initProviders = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer = __importStar(require("inquirer"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const get_provider_plugins_1 = require("../extensions/amplify-helpers/get-provider-plugins");
const input_params_manager_1 = require("../input-params-manager");
const initProviders = async (context) => {
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const providers = await getProviders(context, providerPlugins);
    context.exeInfo.projectConfig.providers = providers;
    const initializationTasks = [];
    for (const provider of providers) {
        const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
        initializationTasks.push(() => providerModule.init(context));
    }
    await (0, promise_sequential_1.default)(initializationTasks);
    return context;
};
exports.initProviders = initProviders;
const getProviders = async (context, providerPlugins) => {
    let providers = [];
    const providerPluginList = Object.keys(providerPlugins);
    if (providerPluginList.length === 0) {
        throw new amplify_cli_core_1.AmplifyError('ProjectInitError', {
            message: 'Found no provider plugins',
            resolution: `Run 'amplify plugin scan' to scan your system for provider plugins.`,
        });
    }
    const { inputParams } = context.exeInfo;
    if (inputParams && inputParams.amplify && inputParams.amplify.providers) {
        inputParams.amplify.providers.forEach((provider) => {
            provider = (0, input_params_manager_1.normalizeProviderName)(provider, providerPluginList);
            if (provider) {
                providers.push(provider);
            }
        });
    }
    if (providers.length === 0) {
        if ((inputParams && inputParams.yes) || providerPluginList.length === 1) {
            context.print.info(`Using default provider  ${providerPluginList[0]}`);
            providers.push(providerPluginList[0]);
        }
        else {
            const selectProviders = {
                type: 'checkbox',
                name: 'selectedProviders',
                message: 'Select the backend providers.',
                choices: providerPluginList,
                default: providerPluginList[0],
            };
            const answer = await inquirer.prompt(selectProviders);
            providers = answer.selectedProviders;
        }
    }
    return providers;
};
//# sourceMappingURL=s2-initProviders.js.map