import { $TSAny, $TSContext, AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import ora from 'ora';
import { ChannelAction, ChannelConfigDeploymentType } from './channel-types';
import { buildPinpointChannelResponseSuccess } from './pinpoint-helper';
import { UpdateEmailChannelCommand, GetEmailChannelCommand } from '@aws-sdk/client-pinpoint';

const channelName = 'Email';
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.INLINE;

/**
 * Configure Email channel on analytics resource
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
 * Enable Email channel on Analytics resource
 * @param context amplify cli context
 * @param successMessage message to be printed on successfully enabling channel
 */
export const enable = async (context: $TSContext, successMessage: string | undefined): Promise<$TSAny> => {
  let answers;
  if (context.exeInfo.pinpointInputParams?.[channelName]) {
    answers = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
  } else {
    let channelOutput: $TSAny = {};
    if (context.exeInfo.serviceMeta.output[channelName]) {
      channelOutput = context.exeInfo.serviceMeta.output[channelName];
    }
    answers = {
      FromAddress: await prompter.input(`The 'From' Email address used to send emails`, { initial: channelOutput.FromAddress }),
      Identity: await prompter.input('The ARN of an identity verified with SES', { initial: channelOutput.Identity }),
      RoleArn: await prompter.input(`The ARN of an IAM Role used to submit events to Mobile notifications' event ingestion service`, {
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
    const data = await context.exeInfo.pinpointClient.send(new UpdateEmailChannelCommand(params));
    spinner.succeed(successMessage ?? `The ${channelName} channel has been successfully enabled.`);
    context.exeInfo.serviceMeta.output[channelName] = {
      RoleArn: params.EmailChannelRequest.RoleArn,
      ...data.EmailChannelResponse,
    };
    return buildPinpointChannelResponseSuccess(ChannelAction.ENABLE, deploymentType, channelName, data.EmailChannelResponse);
  } catch (err) {
    if (err && err.code === 'NotFoundException') {
      spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
      return buildPinpointChannelResponseSuccess(ChannelAction.ENABLE, deploymentType, channelName, {
        id: params.ApplicationId,
      });
    }

    spinner.stop();
    throw new AmplifyFault(
      'NotificationsChannelEmailFault',
      {
        message: `Failed to enable the ${channelName} channel.`,
        details: err.message,
      },
      err,
    );
  }
};

const validateInputParams = (channelInput: $TSAny): $TSAny => {
  if (!channelInput.FromAddress || !channelInput.Identity) {
    throw new AmplifyError('UserInputError', {
      message: 'FromAddress or Identity is missing for the Email channel',
      resolution: 'Provide the required parameters for the Email channel',
    });
  }
  return channelInput;
};

/**
 * Disable Email notification channel on Analytics resource
 * @param context - amplify cli context
 * @returns Pinpoint API response
 */
export const disable = async (context: $TSContext): Promise<$TSAny> => {
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
    const data = await context.exeInfo.pinpointClient.send(new UpdateEmailChannelCommand(params));
    spinner.succeed(`The ${channelName} channel has been disabled.`);
    context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
    return buildPinpointChannelResponseSuccess(ChannelAction.DISABLE, deploymentType, channelName, data.EmailChannelResponse);
  } catch (err) {
    if (err && err.code === 'NotFoundException') {
      spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
      return buildPinpointChannelResponseSuccess(ChannelAction.DISABLE, deploymentType, channelName, {
        id: params.ApplicationId,
      });
    }

    spinner.fail(`Failed to disable the ${channelName} channel.`);
    throw new AmplifyFault(
      'NotificationsChannelEmailFault',
      {
        message: `Failed to disable the ${channelName} channel.`,
        details: err.message,
      },
      err,
    );
  }
};

/**
 * Pull the Analytics resource and Email channel configuration
 * @param context amplify cli context
 * @param pinpointApp Pinpoint resource meta
 * @returns Pinpoint API response
 */
export const pull = async (context: $TSContext, pinpointApp: $TSAny): Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };

  spinner.start(`Retrieving channel information for ${channelName}.`);
  try {
    const data = await context.exeInfo.pinpointClient.send(new GetEmailChannelCommand(params));
    spinner.succeed(`Channel information retrieved for ${channelName}`);
    // eslint-disable-next-line no-param-reassign
    pinpointApp[channelName] = data.EmailChannelResponse;
    return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, data.EmailChannelResponse);
  } catch (err) {
    spinner.stop();
    if (err.code !== 'NotFoundException') {
      throw new AmplifyFault(
        'NotificationsChannelEmailFault',
        {
          message: `Failed to pull the ${channelName} channel.`,
        },
        err,
      );
    }

    return undefined;
  }
};
