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
exports.pull = exports.disable = exports.enable = exports.configure = void 0;
const ora_1 = __importDefault(require("ora"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const configureKey = __importStar(require("./apns-key-config"));
const configureCertificate = __importStar(require("./apns-cert-config"));
const channel_types_1 = require("./channel-types");
const pinpoint_helper_1 = require("./pinpoint-helper");
const channelName = 'APNS';
const spinner = (0, ora_1.default)('');
const deploymentType = channel_types_1.ChannelConfigDeploymentType.INLINE;
const configure = async (context) => {
    var _a;
    const isChannelEnabled = (_a = context.exeInfo.serviceMeta.output[channelName]) === null || _a === void 0 ? void 0 : _a.Enabled;
    let response;
    if (isChannelEnabled) {
        amplify_prompts_1.printer.info(`The ${channelName} channel is currently enabled`);
        const disableChannel = await amplify_prompts_1.prompter.yesOrNo(`Do you want to disable the ${channelName} channel`, false);
        if (disableChannel) {
            response = await (0, exports.disable)(context);
        }
        else {
            const successMessage = `The ${channelName} channel has been successfully updated.`;
            response = await (0, exports.enable)(context, successMessage);
        }
    }
    else {
        const enableChannel = await amplify_prompts_1.prompter.yesOrNo(`Do you want to enable the ${channelName} channel`, true);
        if (enableChannel) {
            response = await (0, exports.enable)(context, undefined);
        }
    }
    if (response) {
        return response;
    }
    return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.CONFIGURE, deploymentType, channelName);
};
exports.configure = configure;
const enable = async (context, successMessage) => {
    var _a;
    let channelInput;
    let answers;
    if ((_a = context.exeInfo.pinpointInputParams) === null || _a === void 0 ? void 0 : _a[channelName]) {
        channelInput = validateInputParams(channel_types_1.ChannelAction.ENABLE, context.exeInfo.pinpointInputParams[channelName]);
        answers = {
            DefaultAuthenticationMethod: channelInput.DefaultAuthenticationMethod,
        };
    }
    else {
        let channelOutput = {};
        if (context.exeInfo.serviceMeta.output[channelName]) {
            channelOutput = context.exeInfo.serviceMeta.output[channelName];
        }
        const authMethod = await amplify_prompts_1.prompter.pick('Select the authentication method for the APNS channel', ['Certificate', 'Key'], {
            initial: (0, amplify_prompts_1.byValue)(channelOutput.DefaultAuthenticationMethod || 'Certificate'),
        });
        answers = {
            DefaultAuthenticationMethod: authMethod,
        };
    }
    if (answers.DefaultAuthenticationMethod === 'Key') {
        const keyConfig = await configureKey.run(channelInput);
        Object.assign(answers, keyConfig);
    }
    else {
        const certificateConfig = await configureCertificate.run(channelInput);
        Object.assign(answers, certificateConfig);
    }
    spinner.start('Enabling APNS Channel.');
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        APNSChannelRequest: {
            ...answers,
            Enabled: true,
        },
    };
    const sandboxParams = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        APNSSandboxChannelRequest: {
            ...answers,
            Enabled: true,
        },
    };
    let data;
    try {
        data = await context.exeInfo.pinpointClient.updateApnsChannel(params).promise();
        await context.exeInfo.pinpointClient.updateApnsSandboxChannel(sandboxParams).promise();
        context.exeInfo.serviceMeta.output[channelName] = data.APNSChannelResponse;
    }
    catch (e) {
        spinner.stop();
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
            message: `Failed to enable the ${channelName} channel.`,
        }, e);
    }
    if (!successMessage) {
        successMessage = `The ${channelName} channel has been successfully enabled.`;
    }
    spinner.succeed(successMessage);
    return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.ENABLE, deploymentType, channelName, data.APNSChannelResponse);
};
exports.enable = enable;
const validateInputParams = (action, channelInput) => {
    if (channelInput.DefaultAuthenticationMethod) {
        const authMethod = channelInput.DefaultAuthenticationMethod;
        if (authMethod === 'Certificate') {
            if (!channelInput.P12FilePath) {
                throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                    message: 'P12FilePath is missing for the APNS channel',
                    details: `Action: ${action}`,
                });
            }
            else if (!fs_extra_1.default.existsSync(channelInput.P12FilePath)) {
                throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                    message: `P12 file ${channelInput.P12FilePath} can NOT be found for the APNS channel`,
                    details: `Action: ${action}`,
                });
            }
        }
        else if (authMethod === 'Key') {
            if (!channelInput.BundleId || !channelInput.TeamId || !channelInput.TokenKeyId) {
                throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                    message: 'Missing BundleId, TeamId or TokenKeyId for the APNS channel',
                    details: `Action: ${action}`,
                });
            }
            else if (!channelInput.P8FilePath) {
                throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                    message: 'P8FilePath is missing for the APNS channel',
                    details: `Action: ${action}`,
                });
            }
            else if (!fs_extra_1.default.existsSync(channelInput.P8FilePath)) {
                throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                    message: `P8 file ${channelInput.P8FilePath} can NOT be found for the APNS channel`,
                    details: `Action: ${action}`,
                });
            }
        }
        else {
            throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                message: `DefaultAuthenticationMethod ${authMethod} is unrecognized for the APNS channel`,
                details: `Action: ${action}`,
            });
        }
    }
    else {
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
            message: 'DefaultAuthenticationMethod is missing for the APNS channel',
            details: `Action: ${action}`,
        });
    }
    return channelInput;
};
const disable = async (context) => {
    const params = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        APNSChannelRequest: {
            Enabled: false,
        },
    };
    const sandboxParams = {
        ApplicationId: context.exeInfo.serviceMeta.output.Id,
        APNSSandboxChannelRequest: {
            Enabled: false,
        },
    };
    spinner.start('Disabling APNS Channel.');
    let data;
    try {
        data = await context.exeInfo.pinpointClient.updateApnsChannel(params).promise();
        await context.exeInfo.pinpointClient.updateApnsSandboxChannel(sandboxParams).promise();
    }
    catch (e) {
        spinner.fail(`Failed to update the ${channelName} channel.`);
        throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
            message: `Failed to update the ${channelName} channel.`,
            details: `Action: ${channel_types_1.ChannelAction.DISABLE}. ${e.message}`,
        }, e);
    }
    spinner.succeed(`The ${channelName} channel has been disabled.`);
    context.exeInfo.serviceMeta.output[channelName] = data.APNSChannelResponse;
    return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.DISABLE, deploymentType, channelName, data.APNSChannelResponse);
};
exports.disable = disable;
const pull = async (context, pinpointApp) => {
    const params = {
        ApplicationId: pinpointApp.Id,
    };
    spinner.start(`Retrieving channel information for ${channelName}.`);
    try {
        const data = await context.exeInfo.pinpointClient.getApnsChannel(params).promise();
        spinner.succeed(`Channel information retrieved for ${channelName}`);
        pinpointApp[channelName] = data.APNSChannelResponse;
        return (0, pinpoint_helper_1.buildPinpointChannelResponseSuccess)(channel_types_1.ChannelAction.PULL, deploymentType, channelName, data.APNSChannelResponse);
    }
    catch (err) {
        spinner.stop();
        if (err.code !== 'NotFoundException') {
            throw new amplify_cli_core_1.AmplifyFault('NotificationsChannelAPNSFault', {
                message: `Failed to pull the ${channelName} channel.`,
                details: `Action: ${channel_types_1.ChannelAction.PULL}. ${err.message}`,
            }, err);
        }
        return undefined;
    }
};
exports.pull = pull;
//# sourceMappingURL=channel-apns.js.map