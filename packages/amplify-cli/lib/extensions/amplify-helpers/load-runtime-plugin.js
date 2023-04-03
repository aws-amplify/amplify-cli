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
exports.loadRuntimePlugin = void 0;
async function loadRuntimePlugin(context, pluginId) {
    if (!context.pluginPlatform.plugins.functionRuntime) {
        throw new Error('No function runtime plugins found. Try "amplify plugin scan" and then rerun the command.');
    }
    const pluginMeta = context.pluginPlatform.plugins.functionRuntime.find((meta) => { var _a; return ((_a = meta.manifest.functionRuntime) === null || _a === void 0 ? void 0 : _a.pluginId) === pluginId; });
    if (!pluginMeta) {
        throw new Error(`Could not find runtime plugin with id [${pluginId}]`);
    }
    try {
        const plugin = await Promise.resolve().then(() => __importStar(require(pluginMeta.packageLocation)));
        return plugin.functionRuntimeContributorFactory(context);
    }
    catch (err) {
        throw new Error(`Could not load runtime plugin with id [${pluginId}]. Underlying error is ${err}`);
    }
}
exports.loadRuntimePlugin = loadRuntimePlugin;
//# sourceMappingURL=load-runtime-plugin.js.map