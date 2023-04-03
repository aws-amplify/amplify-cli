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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullAllChannels = exports.configureChannel = exports.removeEmptyNotificationsApp = exports.disableAllChannels = exports.disableChannel = exports.enableChannel = void 0;
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpointHelper = __importStar(require("./pinpoint-helper"));
const pinpoint_helper_1 = require("./pinpoint-helper");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const enableChannel = async (context, channelName) => {
    var _a;
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    if (!(0, notifications_backend_cfg_channel_api_1.isValidChannel)(channelName)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `Enable channel failed: invalid notification channel ${channelName}`,
            resolution: `Select a valid notification channel from the list: ${(0, notifications_backend_cfg_channel_api_1.getAvailableChannels)().join(', ')}`,
        });
    }
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelActionHandler = await (_a = (0, notifications_backend_cfg_channel_api_1.getChannelHandlerPath)(channelName), Promise.resolve().then(() => __importStar(require(_a))));
    return channelActionHandler.enable(context);
};
exports.enableChannel = enableChannel;
const disableChannel = async (context, channelName) => {
    var _a;
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    if ((0, notifications_backend_cfg_channel_api_1.isValidChannel)(channelName)) {
        context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
        const channelActionHandler = await (_a = (0, notifications_backend_cfg_channel_api_1.getChannelHandlerPath)(channelName), Promise.resolve().then(() => __importStar(require(_a))));
        return channelActionHandler.disable(context);
    }
    return undefined;
};
exports.disableChannel = disableChannel;
const disableAllChannels = async (context) => {
    const enabledChannels = await (0, notifications_backend_cfg_channel_api_1.getEnabledChannels)(context);
    const responseArray = [];
    for (const channelName of enabledChannels) {
        const channelAPIResponse = await (0, exports.disableChannel)(context, channelName);
        if (channelAPIResponse) {
            responseArray.push(channelAPIResponse);
        }
    }
    return responseArray;
};
exports.disableAllChannels = disableAllChannels;
const removeEmptyNotificationsApp = async (context) => {
    let updatedContext = context;
    const enabledChannels = await (0, notifications_backend_cfg_channel_api_1.getEnabledChannels)(context);
    if (enabledChannels.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('RemoveNotificationAppError', {
            message: `Cannot remove notifications app`,
            resolution: `Remove all notification channels before removing the notifications app`,
        });
    }
    updatedContext = await (0, notifications_amplify_meta_api_1.removeNotificationsAppMeta)(updatedContext);
    return (0, notifications_backend_cfg_api_1.removeNotificationsAppConfig)(updatedContext);
};
exports.removeEmptyNotificationsApp = removeEmptyNotificationsApp;
const configureChannel = async (context, channelName) => {
    var _a;
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const notificationsMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta);
    const pinpointAppStatus = await (0, pinpoint_helper_1.getPinpointAppStatusFromMeta)(context, notificationsMeta, envName);
    if (channelName in notifications_backend_cfg_channel_api_1.ChannelType) {
        context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
        if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
            amplify_prompts_1.printer.error('No resources to update.');
            return undefined;
        }
        const channelActionHandler = await (_a = (0, notifications_backend_cfg_channel_api_1.getChannelHandlerPath)(channelName), Promise.resolve().then(() => __importStar(require(_a))));
        return channelActionHandler.configure(context, pinpointAppStatus.status);
    }
    return undefined;
};
exports.configureChannel = configureChannel;
const pullAllChannels = async (context, pinpointApp) => {
    var _a;
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const pullTasks = [];
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    for (const channelName of Object.keys(notifications_backend_cfg_channel_api_1.ChannelType)) {
        const channelActionHandler = await (_a = (0, notifications_backend_cfg_channel_api_1.getChannelHandlerPath)(channelName), Promise.resolve().then(() => __importStar(require(_a))));
        pullTasks.push(() => channelActionHandler.pull(context, pinpointApp));
    }
    const pullChannelsResponseList = await (0, promise_sequential_1.default)(pullTasks);
    return pullChannelsResponseList;
};
exports.pullAllChannels = pullAllChannels;
//# sourceMappingURL=notifications-manager.js.map