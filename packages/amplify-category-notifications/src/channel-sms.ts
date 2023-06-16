import { $TSAny, $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import ora from 'ora';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { ChannelAction, ChannelConfigDeploymentType } from './channel-types';
import { buildPinpointChannelResponseSuccess } from './pinpoint-helper';

const channelName = 'SMS';
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.INLINE;

/**
 * Configure SMS channel on analytics resource
 * @param context - amplify cli context
 */
export const configure = async (context: $TSContext): Promise<void> => {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName]?.Enabled;

  if (isChannelEnabled) {
    printer.info(`The ${channelName} channel is currently enabled`);
    const disableChannel = await prompter.yesOrNo(`Do you want to disable the ${channelName} channel`, false);
    if (disableChannel) {
      await disable(context);
    }
  } else {
    const enableChannel = await prompter.yesOrNo(`Do you want to enable the ${channelName} channel`, true);
    if (enableChannel) {
      await enable(context);
    }
  }
};

/**
 * Enable SMS channel on analytics resource
 * @param context - amplify cli context
 * @returns Pinpoint Client update Sms Channel
 */
export const enable = async (context: $TSContext): Promise<$TSAny> => {
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

    return buildPinpointChannelResponseSuccess(ChannelAction.ENABLE, deploymentType, channelName, data.SMSChannelResponse);
  } catch (e) {
    spinner.stop();
    throw new AmplifyFault(
      'NotificationsChannelSmsFault',
      {
        message: `Failed to enable the ${channelName} channel.`,
      },
      e,
    );
  }
};

/**
 *  Disable SMS channel on the Analytics resource
 * @param context amplify cli context
 * @returns Pinpoint API response
 */
export const disable = async (context: $TSContext): Promise<$TSAny> => {
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

    return buildPinpointChannelResponseSuccess(ChannelAction.DISABLE, deploymentType, channelName, data.SMSChannelResponse);
  } catch (e) {
    spinner.fail(`Failed to disable the ${channelName} channel.`);
    throw new AmplifyFault(
      'NotificationsChannelSmsFault',
      {
        message: `Failed to disable the ${channelName} channel.`,
      },
      e,
    );
  }
};

/**
 * Pull the analytics resource and Notifications and Analytics configs
 * @param context amplify cli context
 * @param pinpointApp  Pinpoint resource meta
 * @returns pinpoint API response
 */
export const pull = async (context: $TSContext, pinpointApp: $TSAny): Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };
  spinner.start(`Retrieving channel information for ${channelName}.`);
  try {
    const data = await context.exeInfo.pinpointClient.getSmsChannel(params).promise();
    spinner.succeed(`Successfully retrieved channel information for ${channelName}.`);
    // eslint-disable-next-line no-param-reassign
    pinpointApp[channelName] = data.SMSChannelResponse;
    return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, data.SMSChannelResponse);
  } catch (err) {
    spinner.stop();
    if (err.code !== 'NotFoundException') {
      throw new AmplifyFault(
        'NotificationsChannelSmsFault',
        {
          message: `Channel ${channelName} not found in the notifications metadata.`,
        },
        err,
      );
    }

    return undefined;
  }
};
