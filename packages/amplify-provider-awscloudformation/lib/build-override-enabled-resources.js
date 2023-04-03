"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOverridesEnabledResources = void 0;
const amplify_category_custom_1 = require("@aws-amplify/amplify-category-custom");
const buildOverridesEnabledResources = async (context, resources) => {
    const resourcesToBuild = [];
    let allBuildResources = [];
    if (resources !== undefined && resources.length > 0) {
        allBuildResources = resources;
    }
    else {
        const { allResources } = await context.amplify.getResourceStatus();
        allBuildResources = allResources;
    }
    allBuildResources.forEach((resourceCreated) => {
        resourcesToBuild.push({
            service: resourceCreated.service,
            category: resourceCreated.category,
            resourceName: resourceCreated.resourceName,
        });
    });
    await (0, amplify_category_custom_1.generateDependentResourcesType)();
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
        resourcesToBuild,
        forceCompile: true,
    });
};
exports.buildOverridesEnabledResources = buildOverridesEnabledResources;
//# sourceMappingURL=build-override-enabled-resources.js.map