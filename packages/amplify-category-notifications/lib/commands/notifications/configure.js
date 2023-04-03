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
exports.run = exports.alias = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpointHelper = __importStar(require("../../pinpoint-helper"));
const notificationManager = __importStar(require("../../notifications-manager"));
const pinpoint_helper_1 = require("../../pinpoint-helper");
const display_utils_1 = require("../../display-utils");
const multi_env_manager_utils_1 = require("../../multi-env-manager-utils");
const notifications_backend_cfg_channel_api_1 = require("../../notifications-backend-cfg-channel-api");
exports.name = 'configure';
exports.alias = 'update';
const run = async (context) => {
    const availableChannelViewNames = (0, notifications_backend_cfg_channel_api_1.getAvailableChannelViewNames)();
    const channelName = context.parameters.first;
    let channelViewName = channelName ? (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName) : undefined;
    if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
        channelViewName = await amplify_prompts_1.prompter.pick('Choose the notification channel to configure', availableChannelViewNames);
    }
    if (channelViewName && typeof channelName === 'string') {
        const selectedChannel = (0, notifications_backend_cfg_channel_api_1.getChannelNameFromView)(channelViewName);
        let pinpointAppStatus = await pinpointHelper.ensurePinpointApp(context, undefined);
        if (pinpointHelper.isPinpointDeploymentRequired(channelName, pinpointAppStatus)) {
            await (0, display_utils_1.viewShowInlineModeInstructionsStart)(channelName);
            try {
                pinpointAppStatus = await pinpointHelper.pushAuthAndAnalyticsPinpointResources(context, pinpointAppStatus);
                await (0, display_utils_1.viewShowInlineModeInstructionsStop)(channelName);
            }
            catch (err) {
                await (0, display_utils_1.viewShowInlineModeInstructionsFail)(channelName, err);
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: 'Failed to deploy Auth and Pinpoint resources.',
                    resolution: 'Deploy Auth and Pinpoint resources manually.',
                }, err);
            }
        }
        if ((0, pinpoint_helper_1.isPinpointAppDeployed)(pinpointAppStatus.status) || (0, notifications_backend_cfg_channel_api_1.isChannelDeploymentDeferred)(selectedChannel)) {
            const channelAPIResponse = await notificationManager.configureChannel(context, selectedChannel);
            await (0, multi_env_manager_utils_1.writeData)(context, channelAPIResponse);
        }
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `Update failure: Invalid Channel selected ${channelViewName}`,
            resolution: `Select an available channel from the list: ${availableChannelViewNames.join(', ')}`,
        });
    }
    return context;
};
exports.run = run;
//# sourceMappingURL=configure.js.map