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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeProviderCommand = exports.getConfiguredProviders = exports.getProviderPlugins = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const getProviderPlugins = (context) => {
    const providers = {};
    context.runtime.plugins.forEach((plugin) => {
        if (plugin.pluginType === 'provider') {
            providers[plugin.pluginName] = plugin.directory;
        }
    });
    return providers;
};
exports.getProviderPlugins = getProviderPlugins;
const getConfiguredProviders = (context) => {
    var _a;
    const configuredProviders = (_a = amplify_cli_core_1.stateManager.getProjectConfig()) === null || _a === void 0 ? void 0 : _a.providers;
    if (!Array.isArray(configuredProviders) || configuredProviders.length < 1) {
        throw new Error('No providers are configured for the project');
    }
    return lodash_1.default.pick((0, exports.getProviderPlugins)(context), configuredProviders);
};
exports.getConfiguredProviders = getConfiguredProviders;
const executeProviderCommand = async (context, command, args = []) => {
    const providers = await Promise.all(Object.values((0, exports.getConfiguredProviders)(context)).map((providerPath) => Promise.resolve().then(() => __importStar(require(providerPath)))));
    await Promise.all(providers.filter((provider) => typeof (provider === null || provider === void 0 ? void 0 : provider[command]) === 'function').map((provider) => provider[command](context, ...args)));
};
exports.executeProviderCommand = executeProviderCommand;
//# sourceMappingURL=get-provider-plugins.js.map