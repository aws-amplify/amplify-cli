"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationConfigStatus = exports.updateChannelAPIResponse = exports.generateMetaFromConfig = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const channel_types_1 = require("./channel-types");
const pinpoint_name_1 = require("./pinpoint-name");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const buildPartialChannelMeta = (channelNames) => {
    const partialOutput = {};
    for (const channelName of channelNames) {
        partialOutput[channelName] = { Enabled: true };
    }
    return Object.keys(partialOutput).length > 0 ? partialOutput : undefined;
};
const generateMetaFromConfig = (envName, cfg) => {
    var _a;
    const outputRecords = ((_a = cfg === null || cfg === void 0 ? void 0 : cfg.channels) === null || _a === void 0 ? void 0 : _a.length) && cfg.channels.length > 0 ? buildPartialChannelMeta(cfg.channels) : undefined;
    if (cfg.resourceName === undefined) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Pinpoint resource name is missing in the backend config',
        });
    }
    const notificationsMeta = {
        Name: pinpoint_name_1.PinpointName.generatePinpointAppName(cfg.resourceName, envName),
        ResourceName: cfg.resourceName,
        service: cfg.service || amplify_cli_core_1.AmplifySupportedService.PINPOINT,
    };
    if (outputRecords) {
        notificationsMeta.output = outputRecords;
    }
    return notificationsMeta;
};
exports.generateMetaFromConfig = generateMetaFromConfig;
const updateChannelAPIResponse = async (context, channelAPIResponse) => {
    var _a;
    let notificationConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
    if (notificationConfig) {
        switch (channelAPIResponse.action) {
            case channel_types_1.ChannelAction.ENABLE:
                if (notificationConfig.channels && !notificationConfig.channels.includes(channelAPIResponse.channel)) {
                    notificationConfig = (0, notifications_backend_cfg_channel_api_1.enableNotificationsChannel)(notificationConfig, channelAPIResponse.channel);
                    context.exeInfo.amplifyMeta = await (0, notifications_amplify_meta_api_1.toggleNotificationsChannelAppMeta)(channelAPIResponse.channel, true, context.exeInfo.amplifyMeta);
                }
                break;
            case channel_types_1.ChannelAction.DISABLE:
                if ((_a = notificationConfig.channels) === null || _a === void 0 ? void 0 : _a.includes(channelAPIResponse.channel)) {
                    notificationConfig = (0, notifications_backend_cfg_channel_api_1.disableNotificationsChannel)(notificationConfig, channelAPIResponse.channel);
                }
                context.exeInfo.amplifyMeta = await (0, notifications_amplify_meta_api_1.toggleNotificationsChannelAppMeta)(channelAPIResponse.channel, false, context.exeInfo.amplifyMeta);
                break;
            case channel_types_1.ChannelAction.CONFIGURE:
                break;
            case channel_types_1.ChannelAction.PULL:
            default:
                amplify_prompts_1.printer.error(`Error: Channel action ${channelAPIResponse.action} not supported`);
                break;
        }
        context.exeInfo.backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][notificationConfig.serviceName] = notificationConfig;
    }
    return context;
};
exports.updateChannelAPIResponse = updateChannelAPIResponse;
const getNotificationConfigStatus = async (context) => {
    const notificationConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
    if (!notificationConfig) {
        return undefined;
    }
    let appInitialized = true;
    let deployedBackendConfig;
    try {
        deployedBackendConfig = amplify_cli_core_1.stateManager.getCurrentBackendConfig() || undefined;
    }
    catch (e) {
        appInitialized = false;
        deployedBackendConfig = undefined;
    }
    const deployedNotificationConfig = await (0, notifications_backend_cfg_api_1.getCurrentNotificationsAppConfig)(deployedBackendConfig);
    const emptyChannels = { enabledChannels: [], disabledChannels: [] };
    return {
        local: {
            config: notificationConfig,
            channels: await (0, notifications_backend_cfg_channel_api_1.getChannelAvailability)(notificationConfig),
        },
        deployed: {
            config: deployedNotificationConfig,
            channels: deployedNotificationConfig ? await (0, notifications_backend_cfg_channel_api_1.getChannelAvailability)(deployedNotificationConfig) : emptyChannels,
        },
        appInitialized,
    };
};
exports.getNotificationConfigStatus = getNotificationConfigStatus;
//# sourceMappingURL=notifications-api.js.map