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
exports.updateNotificationsChannelConfig = exports.disableNotificationsChannel = exports.enableNotificationsChannel = exports.getChannelDeploymentType = exports.getEnabledChannelsFromBackendConfig = exports.getEnabledChannels = exports.getEnabledChannelViewNames = exports.getAvailableChannelViewNames = exports.getAvailableChannels = exports.isChannelEnabledNotificationsBackendConfig = exports.isNotificationChannelEnabledInBackendConfig = exports.isChannelDeploymentInline = exports.isChannelDeploymentDeferred = exports.getDisabledChannelsFromBackendConfig = exports.getChannelAvailability = exports.getChannelNameFromView = exports.getChannelViewName = exports.getChannelViewHelp = exports.getChannelViewInfo = exports.isValidChannel = exports.getChannelHandlerPath = exports.ChannelType = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const path = __importStar(require("path"));
const channel_types_1 = require("./channel-types");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
exports.ChannelType = {
    APNS: 'APNS',
    FCM: 'FCM',
    InAppMessaging: 'InAppMessaging',
    Email: 'Email',
    SMS: 'SMS',
};
const getChannelHandlerPath = (channelName) => `${path.join(__dirname, channelViewInfo[channelName].module)}`;
exports.getChannelHandlerPath = getChannelHandlerPath;
const channelViewInfo = {
    [exports.ChannelType.APNS]: {
        channelName: exports.ChannelType.APNS,
        viewName: 'APNS |  Apple Push Notifications   ',
        help: 'Send Apple push notifications to Pinpoint user segments',
        module: './channel-apns',
        deploymentType: channel_types_1.ChannelConfigDeploymentType.INLINE,
    },
    [exports.ChannelType.FCM]: {
        channelName: exports.ChannelType.FCM,
        viewName: 'FCM  | » Firebase Push Notifications ',
        help: 'Send Firebase Cloud Messaging push notifications to your Pinpoint user segments',
        module: './channel-fcm',
        deploymentType: channel_types_1.ChannelConfigDeploymentType.INLINE,
    },
    [exports.ChannelType.InAppMessaging]: {
        channelName: exports.ChannelType.InAppMessaging,
        viewName: 'In-App Messaging',
        help: 'Allow application clients in Pinpoint user segment mobile devices to pull engagement messages from Pinpoint',
        module: './channel-in-app-msg',
        deploymentType: channel_types_1.ChannelConfigDeploymentType.DEFERRED,
    },
    [exports.ChannelType.Email]: {
        channelName: exports.ChannelType.Email,
        viewName: 'Email',
        help: 'Send Email messages to your Pinpoint user segments',
        module: './channel-email',
        deploymentType: channel_types_1.ChannelConfigDeploymentType.INLINE,
    },
    [exports.ChannelType.SMS]: {
        channelName: exports.ChannelType.SMS,
        viewName: 'SMS',
        help: 'Send SMS messages to your Pinpoint user segments',
        module: './channel-sms',
        deploymentType: channel_types_1.ChannelConfigDeploymentType.INLINE,
    },
};
const isValidChannel = (channelName) => channelName !== undefined && channelName in exports.ChannelType;
exports.isValidChannel = isValidChannel;
const getChannelViewInfo = (channelName) => channelViewInfo[channelName];
exports.getChannelViewInfo = getChannelViewInfo;
const getChannelViewHelp = (channelName) => channelViewInfo[channelName].help;
exports.getChannelViewHelp = getChannelViewHelp;
const getChannelViewName = (channelName) => channelViewInfo[channelName].viewName;
exports.getChannelViewName = getChannelViewName;
const getChannelNameFromView = (channelViewString) => {
    for (const channelName of Object.keys(exports.ChannelType)) {
        if (channelViewInfo[channelName].viewName === channelViewString) {
            return channelName;
        }
    }
    throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
        message: `No channel name found for view: ${channelViewString}`,
    });
};
exports.getChannelNameFromView = getChannelNameFromView;
const getChannelAvailability = async (backendResourceConfig) => {
    const availableChannels = (0, exports.getAvailableChannels)();
    const enabledChannels = (await (0, exports.getEnabledChannelsFromBackendConfig)(backendResourceConfig)) || [];
    const disabledChannels = (await (0, exports.getDisabledChannelsFromBackendConfig)(availableChannels, enabledChannels)) || [];
    const backend = {
        enabledChannels,
        disabledChannels,
    };
    return backend;
};
exports.getChannelAvailability = getChannelAvailability;
const getDisabledChannelsFromBackendConfig = async (availableChannels, enabledChannels) => {
    let result = [];
    const tmpEnabledChannels = enabledChannels || (await (0, exports.getEnabledChannelsFromBackendConfig)());
    const tmpAvailableChannels = availableChannels || (0, exports.getAvailableChannels)();
    if (!tmpAvailableChannels) {
        return result;
    }
    result = tmpAvailableChannels.filter((channelName) => !tmpEnabledChannels.includes(channelName));
    return result;
};
exports.getDisabledChannelsFromBackendConfig = getDisabledChannelsFromBackendConfig;
const isChannelDeploymentDeferred = (validChannelName) => (0, exports.getChannelDeploymentType)(validChannelName) === channel_types_1.ChannelConfigDeploymentType.DEFERRED;
exports.isChannelDeploymentDeferred = isChannelDeploymentDeferred;
const isChannelDeploymentInline = (validChannelName) => (0, exports.getChannelDeploymentType)(validChannelName) === channel_types_1.ChannelConfigDeploymentType.INLINE;
exports.isChannelDeploymentInline = isChannelDeploymentInline;
const isNotificationChannelEnabledInBackendConfig = (resourceBackendConfig, channel) => { var _a; return (_a = resourceBackendConfig.channels) === null || _a === void 0 ? void 0 : _a.includes(channel); };
exports.isNotificationChannelEnabledInBackendConfig = isNotificationChannelEnabledInBackendConfig;
const isChannelEnabledNotificationsBackendConfig = async (channelName) => {
    var _a;
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    const notificationResources = backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    if (!notificationResources) {
        return false;
    }
    for (const resourceName of Object.keys(notificationResources)) {
        if (notificationResources[resourceName].service === amplify_cli_core_1.AmplifySupportedService.PINPOINT) {
            return (_a = notificationResources[resourceName].channels) === null || _a === void 0 ? void 0 : _a.includes(channelName);
        }
    }
    return false;
};
exports.isChannelEnabledNotificationsBackendConfig = isChannelEnabledNotificationsBackendConfig;
const getAvailableChannels = () => Object.keys(exports.ChannelType);
exports.getAvailableChannels = getAvailableChannels;
const getAvailableChannelViewNames = () => Object.keys(exports.ChannelType).map(exports.getChannelViewName);
exports.getAvailableChannelViewNames = getAvailableChannelViewNames;
const getEnabledChannelViewNames = async (notificationConfig) => {
    const enabledChannels = await (0, exports.getEnabledChannelsFromBackendConfig)(notificationConfig);
    return enabledChannels.map(exports.getChannelViewName);
};
exports.getEnabledChannelViewNames = getEnabledChannelViewNames;
const getEnabledChannels = async (context) => {
    const notificationConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
    return (await (0, exports.getEnabledChannelsFromBackendConfig)(notificationConfig)) || [];
};
exports.getEnabledChannels = getEnabledChannels;
const getEnabledChannelsFromBackendConfig = async (notificationsConfig) => {
    const tmpNotificationsCfg = notificationsConfig || (await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)());
    if (tmpNotificationsCfg) {
        return tmpNotificationsCfg.channels;
    }
    return [];
};
exports.getEnabledChannelsFromBackendConfig = getEnabledChannelsFromBackendConfig;
const getChannelDeploymentType = (channelName) => channelName === exports.ChannelType.InAppMessaging ? channel_types_1.ChannelConfigDeploymentType.DEFERRED : channel_types_1.ChannelConfigDeploymentType.INLINE;
exports.getChannelDeploymentType = getChannelDeploymentType;
const enableNotificationsChannel = (notificationsConfig, validChannelName, channelConfig) => {
    const enabledNotificationsConfig = notificationsConfig;
    if (enabledNotificationsConfig.channels && !enabledNotificationsConfig.channels.includes(validChannelName)) {
        enabledNotificationsConfig.channels.push(validChannelName);
        if (channelConfig) {
            enabledNotificationsConfig.channelConfig[validChannelName] = channelConfig;
        }
        return enabledNotificationsConfig;
    }
    throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
        message: `Failed to enable notification channel: ${validChannelName}`,
        details: `Invalid notificationsConfig: ${JSON.stringify(enabledNotificationsConfig, null, 2)}`,
        resolution: `Provide valid notification channel config`,
    });
};
exports.enableNotificationsChannel = enableNotificationsChannel;
const disableNotificationsChannel = (notificationsConfig, validChannelName) => {
    var _a;
    const disabledNotificationsConfig = notificationsConfig;
    if ((_a = notificationsConfig.channels) === null || _a === void 0 ? void 0 : _a.includes(validChannelName)) {
        disabledNotificationsConfig.channels = notificationsConfig.channels.filter((channelName) => channelName !== validChannelName);
        if (notificationsConfig.channelConfig && validChannelName in disabledNotificationsConfig.channelConfig) {
            delete disabledNotificationsConfig.channelConfig[validChannelName];
        }
        return disabledNotificationsConfig;
    }
    throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
        message: `Failed to disable notification channel: ${validChannelName}`,
        details: `Invalid notificationsConfig: ${JSON.stringify(disabledNotificationsConfig, null, 2)}`,
        resolution: `Provide valid notification channel config`,
    });
};
exports.disableNotificationsChannel = disableNotificationsChannel;
const updateNotificationsChannelConfig = (notificationsConfig, validChannelName, channelConfig) => {
    const updatedNotificationsConfig = notificationsConfig;
    if (updatedNotificationsConfig.channels && !updatedNotificationsConfig.channels.includes(validChannelName)) {
        updatedNotificationsConfig.channels = updatedNotificationsConfig.channels.filter((channelName) => channelName !== validChannelName);
        if (notificationsConfig.channelConfig) {
            updatedNotificationsConfig.channelConfig[validChannelName] = channelConfig;
        }
        return notificationsConfig;
    }
    throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
        message: `Failed to update notification channel config`,
        details: `Invalid notificationsConfig: ${JSON.stringify(notificationsConfig, null, 2)}`,
        resolution: `Provide valid notification channel config`,
    });
};
exports.updateNotificationsChannelConfig = updateNotificationsChannelConfig;
//# sourceMappingURL=notifications-backend-cfg-channel-api.js.map