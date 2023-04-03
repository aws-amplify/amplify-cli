"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = exports.disable = exports.enable = exports.configure = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const ora_1 = __importDefault(require("ora"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const plugin_client_api_analytics_1 = require("./plugin-client-api-analytics");
const channel_types_1 = require("./channel-types");
const pinpoint_helper_1 = require("./pinpoint-helper");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const channelName = 'InAppMessaging';
const channelViewName = (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName);
const spinner = (0, ora_1.default)('');
const deploymentType = channel_types_1.ChannelConfigDeploymentType.DEFERRED;
const NOOP_CFG_RESPONSE = {
    action: channel_types_1.ChannelAction.CONFIGURE,
    channel: channelName,
    response: {
        pluginName: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        resourceProviderServiceName: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        status: true,
        capability: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        subCapability: notifications_backend_cfg_channel_api_1.ChannelType.InAppMessaging,
    },
    deploymentType: channel_types_1.ChannelConfigDeploymentType.DEFERRED,
};
const configure = async (context) => {
    if (await (0, notifications_backend_cfg_channel_api_1.isChannelEnabledNotificationsBackendConfig)(channelName)) {
        amplify_prompts_1.printer.info(`The ${channelViewName} channel is currently enabled`);
        if (await amplify_prompts_1.prompter.yesOrNo(`Do you want to disable the ${channelViewName} channel`, false)) {
            return (0, exports.disable)(context);
        }
    }
    else if (await amplify_prompts_1.prompter.yesOrNo(`Do you want to enable the ${channelViewName} channel`, true)) {
        return (0, exports.enable)(context);
    }
    return NOOP_CFG_RESPONSE;
};
exports.configure = configure;
const invokeInlineEnableInAppMessagingChannel = () => {
    throw new amplify_cli_core_1.AmplifyFault('ConfigurationFault', {
        message: 'Inline enable not supported for In-App Messaging channel.',
        details: 'Adding In-App Messaging to a project with Analytics or Push Notification enabled is currently not supported. Please refer to this Github issue for updates: https://github.com/aws-amplify/amplify-cli/issues/11087',
    });
};
const enable = async (context) => {
    spinner.start(`Enabling ${(0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName)} channel.`);
    try {
        const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
        const notificationsMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta);
        const pinpointAppStatus = await (0, pinpoint_helper_1.getPinpointAppStatusFromMeta)(context, notificationsMeta, envName);
        const enableInAppMsgAPIResponse = pinpointAppStatus.status === "APP_IS_DEPLOYED_NOTIFICATIONS" ||
            !(await (0, plugin_client_api_analytics_1.invokeAnalyticsPinpointHasInAppMessagingPolicy)(context))
            ? invokeInlineEnableInAppMessagingChannel()
            : await (0, plugin_client_api_analytics_1.invokeAnalyticsResourceToggleNotificationChannel)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT, amplify_cli_core_1.NotificationChannels.IN_APP_MSG, true);
        if (enableInAppMsgAPIResponse.status) {
            spinner.succeed(`The ${(0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName)} channel has been successfully enabled.`);
        }
        else {
            spinner.fail(`Enable channel error: ${enableInAppMsgAPIResponse.reasonMsg}`);
        }
        const enableChannelInAppMsgResponse = {
            action: channel_types_1.ChannelAction.ENABLE,
            deploymentType,
            channel: channelName,
            response: enableInAppMsgAPIResponse,
        };
        return enableChannelInAppMsgResponse;
    }
    catch (e) {
        spinner.fail(`Enable channel error: ${e.message}`);
        throw e;
    }
};
exports.enable = enable;
const disable = async (context) => {
    spinner.start('Disabling In-App Messaging channel.');
    const disableInAppMsgResponse = await (0, plugin_client_api_analytics_1.invokeAnalyticsResourceToggleNotificationChannel)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT, amplify_cli_core_1.NotificationChannels.IN_APP_MSG, false);
    if (disableInAppMsgResponse.status) {
        spinner.succeed(`The ${(0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName)} channel has been disabled.`);
    }
    else {
        spinner.fail('Disable channel error');
    }
    const disableChannelInAppMsgResponse = {
        action: channel_types_1.ChannelAction.DISABLE,
        deploymentType,
        channel: channelName,
        response: disableInAppMsgResponse,
    };
    return disableChannelInAppMsgResponse;
};
exports.disable = disable;
const pull = async (__context, pinpointApp) => {
    var _a, _b;
    const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta();
    const currentBackendCfg = amplify_cli_core_1.stateManager.getCurrentBackendConfig();
    spinner.start(`Retrieving channel information for ${(0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName)}.`);
    const notificationsMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(currentAmplifyMeta);
    let channelMeta = ((_a = notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.output) === null || _a === void 0 ? void 0 : _a.channels) ? notificationsMeta.output.channels[channelName] : undefined;
    if (!channelMeta) {
        const backendConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(currentBackendCfg);
        if ((_b = backendConfig === null || backendConfig === void 0 ? void 0 : backendConfig.channels) === null || _b === void 0 ? void 0 : _b.includes(channelName)) {
            channelMeta = {
                Enabled: true,
                ApplicationId: pinpointApp.Id,
                Name: pinpointApp.Name,
            };
        }
        else {
            spinner.stop();
            return undefined;
        }
    }
    spinner.succeed(`Channel information retrieved for ${(0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName)}`);
    pinpointApp[channelName] = channelMeta;
    return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.PULL, deploymentType, channelName, channelMeta);
};
exports.pull = pull;
//# sourceMappingURL=channel-in-app-msg.js.map