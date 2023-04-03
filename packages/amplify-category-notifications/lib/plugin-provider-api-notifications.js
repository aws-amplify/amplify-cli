"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.notificationsAPIGetAvailableChannelNames = exports.notificationsAPIRemoveApp = exports.notificationsPluginAPIRemoveApp = exports.notificationsPluginAPIGetResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const notificationManager = __importStar(require("./notifications-manager"));
const multi_env_manager_utils_1 = require("./multi-env-manager-utils");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const notificationsPluginAPIGetResource = async (context) => {
    context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
    const notificationsBackendConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
    const notificationsMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta);
    const response = notificationsBackendConfig
        ? {
            id: notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.Id,
            region: notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.Region,
            output: notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.output,
            category: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
            resourceName: notificationsBackendConfig === null || notificationsBackendConfig === void 0 ? void 0 : notificationsBackendConfig.serviceName,
            service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        }
        : undefined;
    return response;
};
exports.notificationsPluginAPIGetResource = notificationsPluginAPIGetResource;
const notificationsPluginAPIRemoveApp = async (context, appName) => {
    context.exeInfo = context.exeInfo ? context.exeInfo : context.amplify.getProjectDetails();
    context.exeInfo.serviceMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta, appName);
    try {
        await (0, exports.notificationsAPIRemoveApp)(context);
        const successResponse = {
            pluginName: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
            resourceProviderServiceName: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
            status: true,
        };
        return successResponse;
    }
    catch (error) {
        const errorResponse = {
            pluginName: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
            resourceProviderServiceName: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
            status: false,
            errorCode: amplify_cli_core_1.PluginAPIError.E_UNKNOWN,
            reasonMsg: error,
        };
        return errorResponse;
    }
};
exports.notificationsPluginAPIRemoveApp = notificationsPluginAPIRemoveApp;
const notificationsAPIRemoveApp = async (context) => {
    const channelAPIResponseList = await notificationManager.disableAllChannels(context);
    for (const channelAPIResponse of channelAPIResponseList) {
        await (0, multi_env_manager_utils_1.writeData)(context, channelAPIResponse);
    }
    await notificationManager.removeEmptyNotificationsApp(context);
    await (0, multi_env_manager_utils_1.writeData)(context, undefined);
    return context;
};
exports.notificationsAPIRemoveApp = notificationsAPIRemoveApp;
const notificationsAPIGetAvailableChannelNames = async () => (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
exports.notificationsAPIGetAvailableChannelNames = notificationsAPIGetAvailableChannelNames;
//# sourceMappingURL=plugin-provider-api-notifications.js.map