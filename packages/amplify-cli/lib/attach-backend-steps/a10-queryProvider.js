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
exports.queryProvider = void 0;
const inquirer = __importStar(require("inquirer"));
const get_provider_plugins_1 = require("../extensions/amplify-helpers/get-provider-plugins");
const input_params_manager_1 = require("../input-params-manager");
async function queryProvider(context) {
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const provider = await getProvider(context, providerPlugins);
    context.exeInfo.projectConfig.providers = [provider];
    const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
    await providerModule.attachBackend(context);
    return context;
}
exports.queryProvider = queryProvider;
async function getProvider(context, providerPlugins) {
    let result;
    const providers = [];
    const providerPluginList = Object.keys(providerPlugins);
    if (providerPluginList.length === 0) {
        const errorMessage = 'Found no provider plugins';
        context.print.error(errorMessage);
        context.print.info("Run 'amplify plugin scan' to scan your system for provider plugins.");
        throw new Error(errorMessage);
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
            result = providerPluginList[0];
        }
        else {
            const selectProvider = {
                type: 'list',
                name: 'selectedProvider',
                message: 'Select the backend provider.',
                choices: providerPluginList,
                default: providerPluginList[0],
            };
            const answer = await inquirer.prompt(selectProvider);
            result = answer.selectedProvider;
        }
    }
    else if (providers.length === 1) {
        result = providers[0];
    }
    else {
        const selectProvider = {
            type: 'list',
            name: 'selectedProvider',
            message: 'Select the backend provider.',
            choices: providers,
            default: providers[0],
        };
        const answer = await inquirer.prompt(selectProvider);
        result = answer.selectedProvider;
    }
    return result;
}
//# sourceMappingURL=a10-queryProvider.js.map