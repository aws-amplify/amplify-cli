"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.alias = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpoint_helper_1 = require("../../pinpoint-helper");
const notifications_manager_1 = require("../../notifications-manager");
const channel_types_1 = require("../../channel-types");
const multi_env_manager_utils_1 = require("../../multi-env-manager-utils");
const display_utils_1 = require("../../display-utils");
const notifications_backend_cfg_channel_api_1 = require("../../notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("../../notifications-amplify-meta-api");
const multi_env_manager_1 = require("../../multi-env-manager");
exports.name = 'add';
exports.alias = 'enable';
const viewQuestionAskNotificationChannelToBeEnabled = async (availableChannels, disabledChannels, selectedChannel) => {
    let channelViewName = selectedChannel ? (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(selectedChannel) : undefined;
    const availableChannelViewNames = availableChannels.map((channelName) => (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName));
    const disabledChannelViewNames = disabledChannels.map((channelName) => (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName));
    if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
        channelViewName = await amplify_prompts_1.prompter.pick('Choose the notification channel to enable', disabledChannelViewNames);
    }
    else if (!disabledChannelViewNames.includes(channelViewName)) {
        amplify_prompts_1.printer.info(`The ${channelViewName} channel has already been enabled.`);
        channelViewName = undefined;
    }
    return channelViewName ? (0, notifications_backend_cfg_channel_api_1.getChannelNameFromView)(channelViewName) : undefined;
};
const run = async (context) => {
    if (await (0, notifications_amplify_meta_api_1.checkMigratedFromMobileHub)(context.exeInfo.amplifyMeta)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Notifications has been migrated from Mobile Hub and channels cannot be added with Amplify CLI.',
        });
    }
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    const disabledChannels = await (0, notifications_amplify_meta_api_1.getDisabledChannelsFromAmplifyMeta)();
    let channelName = context.parameters.first;
    if (disabledChannels.length <= 0) {
        (0, display_utils_1.viewShowAllChannelsEnabledWarning)();
        return context;
    }
    channelName = await viewQuestionAskNotificationChannelToBeEnabled(availableChannels, disabledChannels, channelName);
    if ((0, notifications_backend_cfg_channel_api_1.isValidChannel)(channelName) && typeof channelName === 'string') {
        const pinpointAppStatus = await (0, multi_env_manager_1.checkAndCreatePinpointApp)(context, channelName, await (0, pinpoint_helper_1.ensurePinpointApp)(context, undefined));
        if ((0, pinpoint_helper_1.isPinpointAppDeployed)(pinpointAppStatus.status) || (0, notifications_backend_cfg_channel_api_1.isChannelDeploymentDeferred)(channelName)) {
            const channelAPIResponse = await (0, notifications_manager_1.enableChannel)(context, channelName);
            await (0, multi_env_manager_utils_1.writeData)(context, channelAPIResponse);
            if ((channelAPIResponse === null || channelAPIResponse === void 0 ? void 0 : channelAPIResponse.deploymentType) === channel_types_1.ChannelConfigDeploymentType.DEFERRED) {
                (0, display_utils_1.viewShowDeferredModeInstructions)();
            }
        }
    }
    return context;
};
exports.run = run;
//# sourceMappingURL=add.js.map