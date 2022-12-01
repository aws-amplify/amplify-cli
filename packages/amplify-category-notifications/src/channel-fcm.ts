import {
  $TSAny, $TSContext, AmplifyError, AmplifyFault,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import ora from 'ora';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
import { buildPinpointChannelResponseSuccess } from './pinpoint-helper';

const channelName = 'FCM';
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.INLINE;

/**
 * Configure the Pinpoint resource to enable the FireBase Cloud Messaging channel
 * @param context amplify cli context
 */
export const configure = async (context: $TSContext): Promise<void> => {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName]?.Enabled;

  if (isChannelEnabled) {
    printer.info(`The ${channelName} channel is currently enabled`);
    const disableChannel = await prompter.yesOrNo(`Do you want to disable the ${channelName} channel`, false);
    if (disableChannel) {
      await disable(context);
    } else {
      const successMessage = `The ${channelName} channel has been successfully updated.`;
      await enable(context, successMessage);
    }
  } else {
    const enableChannel = await prompter.yesOrNo(`Do you want to enable the ${channelName} channel`, true);
    if (enableChannel) {
      await enable(context, undefined);
    }
  }
};

/**
 * Enable Walkthrough for the FireBase Cloud Messaging channel for notifications
 * @param context amplify cli context
 * @param successMessage optional message to be displayed on successfully enabling channel for notifications
 */
export const enable = async (context: $TSContext, successMessage: string | undefined) : Promise<IChannelAPIResponse> => {
  let answers;
  if (context.exeInfo.pinpointInputParams?.[channelName]) {
    answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
  } else {
    let channelOutput : $TSAny = {};
    if (context.exeInfo.serviceMeta.output[channelName]) {
      channelOutput = context.exeInfo.serviceMeta.output[channelName];
    }
    answers = {
      ApiKey: await prompter.input('ApiKey', { initial: channelOutput.ApiKey, transform: input => input.trim() }),
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
    const data = context.exeInfo.pinpointClient.updateGcmChannel(params).promise();
    spinner.succeed(successMessage ?? `The ${channelName} channel has been successfully enabled.`);
    context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
    return buildPinpointChannelResponseSuccess(
      ChannelAction.ENABLE,
      deploymentType,
      channelName,
      data.GCMChannelResponse,
    );
  } catch (err) {
    spinner.stop();
    throw new AmplifyFault('NotificationsChannelFCMFault', {
      message: `Failed to enable the ${channelName} channel`,
    }, err);
  }
};

const validateInputParams = (channelInput: $TSAny):$TSAny => {
  if (!channelInput.ApiKey) {
    throw new AmplifyError('UserInputError', {
      message: 'ApiKey is missing for the FCM channel',
      resolution: 'Provide the ApiKey for the FCM channel',
    });
  }
  return channelInput;
};

/**
 * Disable walkthrough for FCM type notifications channel information from the cloud and update the Pinpoint resource metadata
 * @param context amplify cli notifications
 * @returns GCMChannel response
 */
export const disable = async (context: $TSContext): Promise<$TSAny> => {
  let answers;
  if (context.exeInfo.pinpointInputParams?.[channelName]) {
    answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
  } else {
    let channelOutput: $TSAny = {};
    if (context.exeInfo.serviceMeta.output[channelName]) {
      channelOutput = context.exeInfo.serviceMeta.output[channelName];
    }
    answers = {
      ApiKey: await prompter.input('ApiKey', { initial: channelOutput.ApiKey, transform: input => input.trim() }),
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
    return buildPinpointChannelResponseSuccess(ChannelAction.DISABLE, deploymentType, channelName, data.GCMChannelResponse);
  } catch (err) {
    spinner.stop();
    throw new AmplifyFault('NotificationsChannelFCMFault', {
      message: `Failed to disable the ${channelName} channel`,
    }, err);
  }
};

/**
 * Pull Walkthrough for FCM type notifications channel information from the cloud and update the Pinpoint resource metadata
 * @param context amplify cli context
 * @param pinpointApp Pinpoint resource metadata
 * @returns GCMChannel response
 */
export const pull = async (context: $TSContext, pinpointApp: $TSAny):Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };

  spinner.start(`Retrieving channel information for ${channelName}.`);
  try {
    const data = await context.exeInfo.pinpointClient.getGcmChannel(params).promise();
    spinner.succeed(`Successfully retrieved channel information for ${channelName}.`);
    // eslint-disable-next-line no-param-reassign
    pinpointApp[channelName] = data.GCMChannelResponse;
    return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, data.GCMChannelResponse);
  } catch (err) {
    spinner.stop();
    if (err.code !== 'NotFoundException') {
      throw new AmplifyFault('NotificationsChannelFCMFault', {
        message: `Failed to retrieve channel information for ${channelName}`,
      }, err);
    }

    return undefined;
  }
};
