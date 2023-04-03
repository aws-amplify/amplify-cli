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
exports.invokePluginMethod = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const invokePluginMethod = async (context, category, service, method, args) => {
    const pluginInfo = context.amplify.getCategoryPluginInfo(context, category, service);
    if (!pluginInfo) {
        throw new amplify_cli_core_1.AmplifyError('PluginNotFoundError', {
            message: `Plugin for category: ${category} was not found.`,
            resolution: `Make sure Amplify CLI is properly installed. You may need to run \`amplify plugin scan\``,
        });
    }
    const plugin = await Promise.resolve().then(() => __importStar(require(pluginInfo.packageLocation)));
    const pluginMethod = plugin[method];
    if (!pluginMethod || typeof pluginMethod !== 'function') {
        throw new amplify_cli_core_1.AmplifyError('PluginMethodNotFoundError', {
            message: `Method ${method} does not exist or is not a function in category plugin: ${category}.`,
        });
    }
    return pluginMethod(...args);
};
exports.invokePluginMethod = invokePluginMethod;
//# sourceMappingURL=invoke-plugin-method.js.map