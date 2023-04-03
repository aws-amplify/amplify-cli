"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlugin = void 0;
function getPlugin(context, pluginName) {
    let result;
    const { plugins } = context.runtime;
    for (let i = 0; i < plugins.length; i++) {
        if (plugins[i].name === pluginName) {
            result = plugins[i].directory;
            break;
        }
    }
    return result;
}
exports.getPlugin = getPlugin;
//# sourceMappingURL=get-plugin.js.map