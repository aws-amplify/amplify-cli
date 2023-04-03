"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryPluginInfo = void 0;
function getCategoryPluginInfo(context, category, service) {
    let categoryPluginInfo;
    const pluginInformationForCategory = context.pluginPlatform.plugins[category];
    if ((pluginInformationForCategory === null || pluginInformationForCategory === void 0 ? void 0 : pluginInformationForCategory.length) > 0) {
        if (service) {
            const pluginInformationForCategoryAndService = pluginInformationForCategory.filter((pluginInfo) => {
                return pluginInfo.manifest.services && pluginInfo.manifest.services.includes(service);
            });
            if (pluginInformationForCategoryAndService.length > 0) {
                categoryPluginInfo = pluginInformationForCategoryAndService[0];
            }
            else {
                categoryPluginInfo = pluginInformationForCategory[0];
            }
        }
        else {
            const overriddenPlugin = pluginInformationForCategory.find((plugin) => plugin.packageName === `@aws-amplify/amplify-category-${category}`);
            if (overriddenPlugin !== undefined) {
                return overriddenPlugin;
            }
            categoryPluginInfo = pluginInformationForCategory[0];
        }
    }
    return categoryPluginInfo;
}
exports.getCategoryPluginInfo = getCategoryPluginInfo;
//# sourceMappingURL=get-category-pluginInfo.js.map