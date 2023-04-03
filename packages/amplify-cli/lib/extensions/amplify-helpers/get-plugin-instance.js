"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginInstance = void 0;
function getPluginInstance(context, pluginName) {
    let result;
    let pluginInfo;
    if (context.pluginPlatform.plugins[pluginName] && context.pluginPlatform.plugins[pluginName].length > 0) {
        pluginInfo = context.pluginPlatform.plugins[pluginName][0];
    }
    if (pluginInfo) {
        result = require(pluginInfo.packageLocation);
    }
    return result;
}
exports.getPluginInstance = getPluginInstance;
//# sourceMappingURL=get-plugin-instance.js.map