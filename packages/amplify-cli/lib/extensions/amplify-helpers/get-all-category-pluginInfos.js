"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategoryPluginInfo = void 0;
function getAllCategoryPluginInfo(context) {
    const categoryPluginInfoList = { notifications: [] };
    Object.keys(context.pluginPlatform.plugins).forEach((pluginName) => {
        const pluginInfo = context.pluginPlatform.plugins[pluginName].filter((singlePluginInfo) => {
            return singlePluginInfo.manifest.type === 'category';
        });
        if (pluginInfo.length > 0) {
            categoryPluginInfoList[pluginName] = pluginInfo;
        }
    });
    return categoryPluginInfoList;
}
exports.getAllCategoryPluginInfo = getAllCategoryPluginInfo;
//# sourceMappingURL=get-all-category-pluginInfos.js.map