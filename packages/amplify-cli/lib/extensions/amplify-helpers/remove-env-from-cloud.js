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
exports.removeEnvFromCloud = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const get_project_config_1 = require("./get-project-config");
const get_all_category_pluginInfos_1 = require("./get-all-category-pluginInfos");
const get_provider_plugins_1 = require("./get-provider-plugins");
const execution_manager_1 = require("../../execution-manager");
const removeEnvFromCloud = async (context, envName, deleteS3) => {
    const { providers } = (0, get_project_config_1.getProjectConfig)();
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const providerPromises = [];
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info(`Deleting env: ${envName}.`);
    const categoryPluginInfoList = (0, get_all_category_pluginInfos_1.getAllCategoryPluginInfo)(context);
    if (categoryPluginInfoList.notifications) {
        const notificationsModule = await Promise.resolve().then(() => __importStar(require(categoryPluginInfoList.notifications[0].packageLocation)));
        await notificationsModule.deletePinpointAppForEnv(context, envName);
    }
    for (const providerName of providers) {
        const pluginModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[providerName])));
        providerPromises.push(pluginModule.deleteEnv(context, envName, deleteS3));
    }
    try {
        await Promise.all(providerPromises);
        await (0, execution_manager_1.raiseInternalOnlyPostEnvRemoveEvent)(context, envName);
    }
    catch (ex) {
        if ((ex === null || ex === void 0 ? void 0 : ex.name) !== 'BucketNotFoundError') {
            throw new amplify_cli_core_1.AmplifyFault('BackendDeleteFault', {
                message: `Error occurred while deleting env: ${envName}.`,
            }, ex);
        }
    }
};
exports.removeEnvFromCloud = removeEnvFromCloud;
//# sourceMappingURL=remove-env-from-cloud.js.map