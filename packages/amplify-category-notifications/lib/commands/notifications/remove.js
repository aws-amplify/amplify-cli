"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.alias = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const pinpoint_helper_1 = require("../../pinpoint-helper");
const plugin_provider_api_notifications_1 = require("../../plugin-provider-api-notifications");
const multi_env_manager_utils_1 = require("../../multi-env-manager-utils");
const notifications_backend_cfg_channel_api_1 = require("../../notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("../../notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("../../notifications-backend-cfg-api");
const notifications_manager_1 = require("../../notifications-manager");
const CANCEL = 'Cancel';
exports.name = 'remove';
exports.alias = ['disable', 'delete'];
const run = async (context) => {
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const notificationsMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    const notificationConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
    if (!notificationConfig) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Notifications have not been added to your project.',
        });
    }
    if (await (0, notifications_amplify_meta_api_1.checkMigratedFromMobileHub)(context.exeInfo.amplifyMeta)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Notifications has been migrated from Mobile Hub and channels cannot be added with Amplify CLI.',
        });
    }
    const availableChannelViewNames = (0, notifications_backend_cfg_channel_api_1.getAvailableChannelViewNames)();
    const enabledChannelViewNames = await (0, notifications_backend_cfg_channel_api_1.getEnabledChannelViewNames)(notificationConfig);
    const PinpointAppViewName = `All channels on Pinpoint resource : ${chalk_1.default.cyan.bold(notificationConfig.serviceName)}`;
    const optionChannelViewNames = [...enabledChannelViewNames, PinpointAppViewName, CANCEL];
    const channelName = context.parameters.first;
    let channelViewName = channelName ? (0, notifications_backend_cfg_channel_api_1.getChannelViewName)(channelName) : undefined;
    if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
        channelViewName = await amplify_prompts_1.prompter.pick('Choose the notification channel to remove', optionChannelViewNames);
    }
    else if (!optionChannelViewNames.includes(channelViewName)) {
        amplify_prompts_1.printer.info(`The ${channelViewName} channel has NOT been enabled.`);
        channelViewName = undefined;
    }
    if (channelViewName && channelViewName !== CANCEL) {
        const pinpointAppStatus = await (0, pinpoint_helper_1.getPinpointAppStatus)(context, context.exeInfo.amplifyMeta, notificationsMeta, envName);
        if (channelViewName !== PinpointAppViewName) {
            const selectedChannelName = (0, notifications_backend_cfg_channel_api_1.getChannelNameFromView)(channelViewName);
            await (0, pinpoint_helper_1.ensurePinpointApp)(context, undefined, pinpointAppStatus, envName);
            if ((0, pinpoint_helper_1.isPinpointAppDeployed)(pinpointAppStatus.status) || (0, notifications_backend_cfg_channel_api_1.isChannelDeploymentDeferred)(selectedChannelName)) {
                const channelAPIResponse = await (0, notifications_manager_1.disableChannel)(context, selectedChannelName);
                await (0, multi_env_manager_utils_1.writeData)(context, channelAPIResponse);
                amplify_prompts_1.printer.info('The channel has been successfully disabled.');
            }
        }
        else if ((0, pinpoint_helper_1.isPinpointAppOwnedByNotifications)(pinpointAppStatus.status)) {
            const confirmDelete = await amplify_prompts_1.prompter.confirmContinue('Confirm that you want to delete the associated Amazon Pinpoint application');
            if (confirmDelete) {
                await (0, pinpoint_helper_1.deletePinpointApp)(context);
                await (0, multi_env_manager_utils_1.writeData)(context, undefined);
                amplify_prompts_1.printer.info('The Pinpoint application has been successfully deleted.');
            }
        }
        else {
            await (0, pinpoint_helper_1.ensurePinpointApp)(context, notificationsMeta, pinpointAppStatus, envName);
            amplify_prompts_1.printer.info('Disabling all notifications from the Pinpoint resource');
            await (0, plugin_provider_api_notifications_1.notificationsAPIRemoveApp)(context);
            amplify_prompts_1.printer.success('All notifications have been disabled');
            amplify_prompts_1.printer.warn(`${PinpointAppViewName} is provisioned through analytics`);
            amplify_prompts_1.printer.warn(`Next step: Run "amplify analytics remove" and select the ${PinpointAppViewName} to remove`);
        }
    }
    return context;
};
exports.run = run;
//# sourceMappingURL=remove.js.map