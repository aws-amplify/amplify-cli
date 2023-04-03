"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceOutputs = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getResourceOutputs = (amplifyMeta) => {
    if (!amplifyMeta) {
        amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    }
    const outputsByProvider = {};
    const outputsByCategory = {};
    const outputsForFrontend = {
        metadata: {},
        serviceResourceMapping: {},
        testMode: false,
    };
    if (amplifyMeta.providers) {
        Object.keys(amplifyMeta.providers).forEach((provider) => {
            outputsByProvider[provider] = {};
            outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
            outputsByProvider[provider].serviceResourceMapping = {};
        });
    }
    if (amplifyMeta) {
        Object.keys(amplifyMeta).forEach((category) => {
            const categoryMeta = amplifyMeta[category];
            const isVirtualCategory = checkIfVirtualCategory(category);
            Object.keys(categoryMeta).forEach((resourceName) => {
                const resourceMeta = categoryMeta[resourceName];
                if (resourceMeta.output && (resourceMeta.lastPushTimeStamp || isVirtualCategory)) {
                    const { providerPlugin } = resourceMeta;
                    if (!outputsByProvider[providerPlugin]) {
                        outputsByProvider[providerPlugin] = {
                            metadata: {},
                            serviceResourceMapping: {},
                        };
                    }
                    if (!outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service]) {
                        outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service] = [];
                    }
                    outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service].push(resourceMeta);
                    if (!outputsByCategory[category]) {
                        outputsByCategory[category] = {};
                    }
                    if (resourceMeta.service) {
                        resourceMeta.output.service = resourceMeta.service;
                    }
                    outputsByCategory[category][resourceName] = resourceMeta.output;
                    if (!outputsForFrontend.serviceResourceMapping[resourceMeta.service]) {
                        outputsForFrontend.serviceResourceMapping[resourceMeta.service] = [];
                    }
                    resourceMeta.resourceName = resourceName;
                    outputsForFrontend.serviceResourceMapping[resourceMeta.service].push(resourceMeta);
                }
            });
        });
    }
    if (outputsByProvider.awscloudformation) {
        outputsForFrontend.metadata = outputsByProvider.awscloudformation.metadata;
    }
    if (amplifyMeta && amplifyMeta.testMode) {
        outputsForFrontend.testMode = true;
    }
    return { outputsByProvider, outputsByCategory, outputsForFrontend };
};
exports.getResourceOutputs = getResourceOutputs;
const checkIfVirtualCategory = (category) => {
    const virtualCategoryTable = [amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    return virtualCategoryTable.includes(category);
};
//# sourceMappingURL=get-resource-outputs.js.map