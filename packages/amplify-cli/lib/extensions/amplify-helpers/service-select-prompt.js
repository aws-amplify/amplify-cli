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
exports.serviceSelectionPrompt = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer = __importStar(require("inquirer"));
const get_project_config_1 = require("./get-project-config");
const get_provider_plugins_1 = require("./get-provider-plugins");
function filterServicesByEnabledProviders(context, enabledProviders, supportedServices) {
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const filteredServices = [];
    if (supportedServices !== undefined && enabledProviders !== undefined) {
        Object.keys(supportedServices).forEach((serviceName) => {
            const { provider, alias } = supportedServices[serviceName];
            if (enabledProviders.includes(provider)) {
                filteredServices.push({
                    service: serviceName,
                    providerPlugin: providerPlugins[provider],
                    providerName: provider,
                    alias: alias,
                });
            }
        });
    }
    return filteredServices;
}
async function serviceQuestionWalkthrough(context, supportedServices, category, customQuestion = null, optionNameOverrides) {
    const options = [];
    for (const supportedService of supportedServices) {
        let optionName = supportedService.alias || `${supportedService.providerName}:${supportedService.service}`;
        if (optionNameOverrides && optionNameOverrides[supportedService.service]) {
            optionName = optionNameOverrides[supportedService.service];
        }
        options.push({
            name: optionName,
            value: {
                provider: supportedService.providerPlugin,
                service: supportedService.service,
                providerName: supportedService.providerName,
            },
        });
    }
    if (options.length === 0) {
        const errMessage = `No services defined by configured providers for category: ${category}`;
        context.print.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    if (options.length === 1) {
        context.print.info(`Using service: ${options[0].value.service}, provided by: ${options[0].value.providerName}`);
        return new Promise((resolve) => {
            resolve(options[0].value);
        });
    }
    const question = [
        {
            name: 'service',
            message: customQuestion || 'Select from one of the below mentioned services:',
            type: 'list',
            choices: options,
        },
    ];
    const answer = await inquirer.prompt(question);
    return answer.service;
}
function serviceSelectionPrompt(context, category, supportedServices, customQuestion = null, optionNameOverrides) {
    const { providers } = (0, get_project_config_1.getProjectConfig)();
    supportedServices = filterServicesByEnabledProviders(context, providers, supportedServices);
    return serviceQuestionWalkthrough(context, supportedServices, category, customQuestion, optionNameOverrides);
}
exports.serviceSelectionPrompt = serviceSelectionPrompt;
//# sourceMappingURL=service-select-prompt.js.map