"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsResources = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const getAnalyticsResources = (context, resourceProviderServiceName) => {
    const resourceList = [];
    const amplifyMeta = context ? context.exeInfo.amplifyMeta : amplify_cli_core_1.stateManager.getMeta();
    if (amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]) {
        const categoryResources = amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
        Object.keys(categoryResources).forEach((resource) => {
            var _a, _b, _c, _d, _e;
            if (!resourceProviderServiceName || categoryResources[resource].service === resourceProviderServiceName) {
                resourceList.push({
                    category: amplify_cli_core_1.AmplifyCategories.ANALYTICS,
                    resourceName: resource,
                    service: categoryResources[resource].service,
                    region: (_b = (_a = categoryResources[resource]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.Region,
                    id: (_d = (_c = categoryResources[resource]) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.Id,
                    output: (_e = categoryResources[resource]) === null || _e === void 0 ? void 0 : _e.output,
                });
            }
        });
    }
    return resourceList;
};
exports.getAnalyticsResources = getAnalyticsResources;
//# sourceMappingURL=analytics-helper.js.map