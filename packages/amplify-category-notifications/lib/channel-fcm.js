"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pull = exports.disable = exports.enable = exports.configure = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const ora_1 = __importDefault(require("ora"));
const channel_types_1 = require("./channel-types");
const pinpoint_helper_1 = require("./pinpoint-helper");
const channelName = 'FCM';
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
        else {
            const successMessage = `The ${channelName} channel has been successfully updated.`;
            await (0, exports.enable)(context, successMessage);
        }
    }
    else {
        const enableChannel = await amplify_prompts_1.prompter.yesOrNo(`Do you want to enable the ${channelName} channel`, true);
        if (enableChannel) {
            await (0, exports.enable)(context, undefined);
        }
    }
};
exports.configure = configure;
const enable = async (context, successMessage) => {
    var _a;
    let answers;
    if ((_a = context.exeInfo.pinpointInputParams) === null || _a === void 0 ? void 0 : _a[channelName]) {
        answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
    }
    else {
        let channelOutput = {};
        if (context.exeInfo.serviceMeta.output[channelName]) {
            channelOutput = context.exeInfo.serviceMeta.output[channelName];
        }
        answers = {
            ApiKey: await amplify_prompts_1.prompter.input('Server Key', { initial: channelOutput.ApiKey, transform: (input) => input.trim() }),
        };
    }
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        GCMChannelRequest: {
            ...answers,
            Enabled: true,
        },
    };
    spinner.start('Enabling FCM channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateGcmChannel(params).promise();
        spinner.succeed(successMessage !== null && successMessage !== void 0 ? successMessage : `The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.ENABLE, deploymentType, channelName, data.GCMChannelResponse);
    }
    catch (err) {
        spinner.stop();
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelFCMFault', {
            message: `Failed to enable the ${channelName} channel`,
        }, err);
    }
};
exports.enable = enable;
const validateInputParams = (channelInput) => {
    if (!channelInput.ApiKey) {
        throw new amplify_cli_core_1.AmplifyError('UserInputError', {
            message: 'Server Key is missing for the FCM channel',
            resolution: 'Server Key for the FCM channel',
        });
    }
    return channelInput;
};
const disable = async (context) => {
    var _a;
    let answers;
    if ((_a = context.exeInfo.pinpointInputParams) === null || _a === void 0 ? void 0 : _a[channelName]) {
        answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
    }
    else {
        let channelOutput = {};
        if (context.exeInfo.serviceMeta.output[channelName]) {
            channelOutput = context.exeInfo.serviceMeta.output[channelName];
        }
        answers = {
            ApiKey: await amplify_prompts_1.prompter.input('Server Key', { initial: channelOutput.ApiKey, transform: (input) => input.trim() }),
        };
    }
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        GCMChannelRequest: {
            ...answers,
            Enabled: false,
        },
    };
    spinner.start('Disabling FCM channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateGcmChannel(params).promise();
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.DISABLE, deploymentType, channelName, data.GCMChannelResponse);
    }
    catch (err) {
        spinner.stop();
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelFCMFault', {
            message: `Failed to disable the ${channelName} channel`,
        }, err);
    }
};
exports.disable = disable;
const pull = async (context, pinpointApp) => {
    const params = {
        ApplicationId: pinpointApp.Id,
    };
    spinner.start(`Retrieving channel information for ${channelName}.`);
    try {
        const data = await context.exeInfo.pinpointClient.getGcmChannel(params).promise();
        spinner.succeed(`Successfully retrieved channel information for ${channelName}.`);
        pinpointApp[channelName] = data.GCMChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.PULL, deploymentType, channelName, data.GCMChannelResponse);
    }
    catch (err) {
        spinner.stop();
        if (err.code !== 'NotFoundException') {
            throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelFCMFault', {
                message: `Failed to retrieve channel information for ${channelName}`,
            }, err);
        }
        return undefined;
    }
};
exports.pull = pull;
//# sourceMappingURL=channel-fcm.js.map