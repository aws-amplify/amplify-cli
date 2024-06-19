import { $TSAny, $TSContext, AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import ora from 'ora';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
import { buildPinpointChannelResponseSuccess } from './pinpoint-helper';
import { validateFilePath } from './validate-filepath';
import fs from 'fs-extra';

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
export const enable = async (context: $TSContext, successMessage: string | undefined): Promise<IChannelAPIResponse> => {
  let answers;
  if (context.exeInfo.pinpointInputParams?.[channelName]) {
    answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
  } else {
    answers = {
      ServiceJson: await fs.readFile(
        await prompter.input('The service account file path (.json): ', { validate: validateFilePath }),
        'utf8',
      ),
    };
  }

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    GCMChannelRequest: {
      ...answers,
      DefaultAuthenticationMethod: 'TOKEN',
      Enabled: true,
    },
  };

  spinner.start('Enabling FCM channel.');
  try {
    const data = await context.exeInfo.pinpointClient.updateGcmChannel(params).promise();
    spinner.succeed(successMessage ?? `The ${channelName} channel has been successfully enabled.`);
    context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
    return buildPinpointChannelResponseSuccess(ChannelAction.ENABLE, deploymentType, channelName, data.GCMChannelResponse);
  } catch (err) {
    spinner.stop();
    throw new AmplifyFault(
      'NotificationsChannelFCMFault',
      {
        message: `Failed to enable the ${channelName} channel`,
      },
      err,
    );
  }
};

const validateInputParams = (channelInput: $TSAny): $TSAny => {
  if (!channelInput.ServiceJson) {
    throw new AmplifyError('UserInputError', {
      message: 'ServiceJson is missing for the FCM channel',
      resolution: 'Provide the JSON from your Firebase service account json file',
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
    answers = {
      ServiceJson: await fs.readFile(
        await prompter.input('The service account file path (.json): ', { validate: validateFilePath }),
        'utf8',
      ),
    };
  }
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    GCMChannelRequest: {
      ...answers,
      DefaultAuthenticationMethod: 'TOKEN',
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
    throw new AmplifyFault(
      'NotificationsChannelFCMFault',
      {
        message: `Failed to disable the ${channelName} channel`,
      },
      err,
    );
  }
};

/**
 * Pull Walkthrough for FCM type notifications channel information from the cloud and update the Pinpoint resource metadata
 * @param context amplify cli context
 * @param pinpointApp Pinpoint resource metadata
 * @returns GCMChannel response
 */
export const pull = async (context: $TSContext, pinpointApp: $TSAny): Promise<$TSAny> => {
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
      throw new AmplifyFault(
        'NotificationsChannelFCMFault',
        {
          message: `Failed to retrieve channel information for ${channelName}`,
        },
        err,
      );
    }

    return undefined;
  }
};
