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
exports.storeCurrentCloudBackend = exports.syncCurrentCloudBackend = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const auth_notifications_1 = require("./auth-notifications");
const get_provider_plugins_1 = require("./get-provider-plugins");
const get_project_config_1 = require("./get-project-config");
const syncCurrentCloudBackend = async (context) => {
    context.exeInfo.restoreBackend = false;
    const currentEnv = context.exeInfo.localEnvInfo.envName;
    try {
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
        const pullCurrentCloudTasks = [];
        for (const provider of context.exeInfo.projectConfig.providers) {
            const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
            pullCurrentCloudTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
        }
        await (0, auth_notifications_1.notifySecurityEnhancement)(context);
        if (!(await (0, auth_notifications_1.notifyFieldAuthSecurityChange)(context))) {
            await (0, auth_notifications_1.notifyListQuerySecurityChange)(context);
        }
        amplify_cli_core_1.spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
        await (0, promise_sequential_1.default)(pullCurrentCloudTasks);
        amplify_cli_core_1.spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
    }
    catch (e) {
        amplify_cli_core_1.spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
        throw new amplify_cli_core_1.AmplifyFault('BackendPullFault', { message: e.message }, e);
    }
};
exports.syncCurrentCloudBackend = syncCurrentCloudBackend;
const storeCurrentCloudBackend = async (context) => {
    const { providers } = (0, get_project_config_1.getProjectConfig)();
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    await Promise.all(providers.map(async (provider) => {
        const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
        return providerModule.storeCurrentCloudBackend(context);
    }));
};
exports.storeCurrentCloudBackend = storeCurrentCloudBackend;
//# sourceMappingURL=current-cloud-backend-utils.js.map