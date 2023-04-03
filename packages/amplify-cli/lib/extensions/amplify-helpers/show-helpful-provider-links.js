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
exports.showHelpfulProviderLinks = void 0;
const get_project_config_1 = require("./get-project-config");
const resource_status_1 = require("./resource-status");
const get_provider_plugins_1 = require("./get-provider-plugins");
async function showHelpfulProviderLinks(context) {
    const { providers } = (0, get_project_config_1.getProjectConfig)();
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const providerPromises = [];
    const { allResources } = await (0, resource_status_1.getResourceStatus)();
    for (const providerName of providers) {
        const pluginModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[providerName])));
        providerPromises.push(pluginModule.showHelpfulLinks(context, allResources));
    }
    return Promise.all(providerPromises);
}
exports.showHelpfulProviderLinks = showHelpfulProviderLinks;
//# sourceMappingURL=show-helpful-provider-links.js.map