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
const channelName = 'Email';
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
            FromAddress: await amplify_prompts_1.prompter.input(`The 'From' Email address used to send emails`, { initial: channelOutput.FromAddress }),
            Identity: await amplify_prompts_1.prompter.input('The ARN of an identity verified with SES', { initial: channelOutput.Identity }),
            RoleArn: await amplify_prompts_1.prompter.input(`The ARN of an IAM Role used to submit events to Mobile notifications' event ingestion service`, {
                initial: channelOutput.RoleArn,
            }),
        };
    }
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        EmailChannelRequest: {
            ...answers,
            Enabled: true,
        },
    };
    spinner.start('Enabling Email Channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateEmailChannel(params).promise();
        spinner.succeed(successMessage !== null && successMessage !== void 0 ? successMessage : `The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = {
            RoleArn: params.EmailChannelRequest.RoleArn,
            ...data.EmailChannelResponse,
        };
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.ENABLE, deploymentType, channelName, data.EmailChannelResponse);
    }
    catch (err) {
        if (err && err.code === 'NotFoundException') {
            spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
            return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.ENABLE, deploymentType, channelName, {
                id: params.ApplicationId,
            });
        }
        spinner.stop();
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelEmailFault', {
            message: `Failed to enable the ${channelName} channel.`,
            details: err.message,
        }, err);
    }
};
exports.enable = enable;
const validateInputParams = (channelInput) => {
    if (!channelInput.FromAddress || !channelInput.Identity) {
        throw new amplify_cli_core_1.AmplifyError('UserInputError', {
            message: 'FromAddress or Identity is missing for the Email channel',
            resolution: 'Provide the required parameters for the Email channel',
        });
    }
    return channelInput;
};
const disable = async (context) => {
    const channelOutput = validateInputParams(context.exeInfo.serviceMeta.output[channelName]);
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        EmailChannelRequest: {
            Enabled: false,
            FromAddress: channelOutput.FromAddress,
            Identity: channelOutput.Identity,
            RoleArn: channelOutput.RoleArn,
        },
    };
    spinner.start('Disabling Email Channel.');
    try {
        const data = await context.exeInfo.pinpointClient.updateEmailChannel(params).promise();
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.DISABLE, deploymentType, channelName, data.EmailChannelResponse);
    }
    catch (err) {
        if (err && err.code === 'NotFoundException') {
            spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
            return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.DISABLE, deploymentType, channelName, {
                id: params.ApplicationId,
            });
        }
        spinner.fail(`Failed to disable the ${channelName} channel.`);
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelEmailFault', {
            message: `Failed to disable the ${channelName} channel.`,
            details: err.message,
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
        const data = await context.exeInfo.pinpointClient.getEmailChannel(params).promise();
        spinner.succeed(`Channel information retrieved for ${channelName}`);
        pinpointApp[channelName] = data.EmailChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.PULL, deploymentType, channelName, data.EmailChannelResponse);
    }
    catch (err) {
        spinner.stop();
        if (err.code !== 'NotFoundException') {
            throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelEmailFault', {
                message: `Failed to pull the ${channelName} channel.`,
            }, err);
        }
        return undefined;
    }
};
exports.pull = pull;
//# sourceMappingURL=channel-email.js.map