"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = exports.disable = exports.enable = exports.configure = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const ora_1 = __importDefault(require("ora"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const channel_types_1 = require("./channel-types");
const pinpoint_helper_1 = require("./pinpoint-helper");
const channelName = 'SMS';
const spinner = (0, ora_1.default)('');
const deploymentType = channel_types_1.ChannelConfigDeploymentType.INLINE;
const configure = async (context) => {
    var _a;
    const isChannelEnabled = (_a = context.exeInfo.serviceMeta.output[channelName]) === null || _a === void 0 ? void 0 : _a.Enabled;
    if (isChannelEnabled) {
        amplify_prompts_1.printer.info(`The ${channelName} channel is currently enabled`);
        const disableChannel = await amplify_prompts_1.prompter.yesOrNo(`Do you want to disable the ${channelName} channel`, false);
        if (disableChannel) {
            await (0, exports.disable)(context);
        }
    }
    else {
        const enableChannel = await amplify_prompts_1.prompter.yesOrNo(`Do you want to enable the ${channelName} channel`, true);
        if (enableChannel) {
            await (0, exports.enable)(context);
        }
    }
};
exports.configure = configure;
const enable = async (context) => {
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        SMSChannelRequest: {
            Enabled: true,
        },
    };
    spinner.start('Enabling SMS channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateSmsChannel(params).promise();
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        spinner.succeed(`The ${channelName} channel has been successfully enabled.`);
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.ENABLE, deploymentType, channelName, data.SMSChannelResponse);
    }
    catch (e) {
        spinner.stop();
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelSmsFault', {
            message: `Failed to enable the ${channelName} channel.`,
        }, e);
    }
};
exports.enable = enable;
const disable = async (context) => {
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        SMSChannelRequest: {
            Enabled: false,
        },
    };
    spinner.start('Disabling SMS channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateSmsChannel(params).promise();
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.DISABLE, deploymentType, channelName, data.SMSChannelResponse);
    }
    catch (e) {
        spinner.fail(`Failed to disable the ${channelName} channel.`);
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelSmsFault', {
            message: `Failed to disable the ${channelName} channel.`,
        }, e);
    }
};
exports.disable = disable;
const pull = async (context, pinpointApp) => {
    const params = {
        ApplicationId: pinpointApp.Id,
    };
    spinner.start(`Retrieving channel information for ${channelName}.`);
    try {
        const data = await context.exeInfo.pinpointClient.getSmsChannel(params).promise();
        spinner.succeed(`Successfully retrieved channel information for ${channelName}.`);
        pinpointApp[channelName] = data.SMSChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.PULL, deploymentType, channelName, data.SMSChannelResponse);
    }
    catch (err) {
        spinner.stop();
        if (err.code !== 'NotFoundException') {
            throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelSmsFault', {
                message: `Channel ${channelName} not found in the notifications metadata.`,
            }, err);
        }
        return undefined;
    }
};
exports.pull = pull;
//# sourceMappingURL=channel-sms.js.map