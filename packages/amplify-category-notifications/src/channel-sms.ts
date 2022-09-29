import { $TSAny, $TSContext } from 'amplify-cli-core';
import inquirer from 'inquirer';
import ora from 'ora';
import { printer } from 'amplify-prompts';
import { ChannelAction, ChannelConfigDeploymentType } from './channel-types';
import { buildPinpointChannelResponseError, buildPinpointChannelResponseSuccess } from './pinpoint-helper';
import { isAmplifyCLIPulling } from './multi-env-manager';

const channelName = 'SMS';
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.INLINE;

/**
 * Configure SMS channel on analytics resource
 * @param context - amplify cli context
 */
export const configure = async (context : $TSContext):Promise<void> => {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName]?.Enabled;

  if (isChannelEnabled) {
    printer.info(`The ${channelName} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${channelName} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      await disable(context);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await enable(context);
    }
  }
};

/**
 * Enable SMS channel on analytics resource
 * @param context - amplify cli context
 * @returns Pinpoint Client update Sms Channel
 */
export const enable = async (context:$TSContext):Promise<$TSAny> => {
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
    if (!isAmplifyCLIPulling(context)) {
      spinner.fail('enable channel error');
    }
    throw buildPinpointChannelResponseError(ChannelAction.ENABLE, deploymentType, channelName, e);
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
    spinner.succeed(`The ${channelName} channel has been successfully disabled.`);

    return buildPinpointChannelResponseSuccess(ChannelAction.DISABLE, deploymentType, channelName, data.SMSChannelResponse);
  } catch (e) {
    if (!isAmplifyCLIPulling(context)) {
      spinner.fail('disable channel error');
    }
    throw buildPinpointChannelResponseError(ChannelAction.DISABLE, deploymentType, channelName, e);
  }
};

/**
 * Pull the analytics resource and Notifications and Analytics configs
 * @param context amplify cli context
 * @param pinpointApp  Pinpoint resource meta
 * @returns pinpoint API response
 */
export const pull = async (context:$TSContext, pinpointApp:$TSAny) : Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };
  spinner.start(`Retrieving channel information for ${channelName}.`);
  return context.exeInfo.pinpointClient
    .getSmsChannel(params)
    .promise()
    .then((data :$TSAny) => {
      spinner.succeed(`Channel information retrieved for ${channelName}`);
      // eslint-disable-next-line no-param-reassign
      pinpointApp[channelName] = data.SMSChannelResponse;
      return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, data.SMSChannelResponse);
    })
    .catch((err : $TSAny) => {
      if (err.code === 'NotFoundException') {
        spinner.succeed(`Channel is not setup for ${channelName} `);
        return buildPinpointChannelResponseError(ChannelAction.PULL, deploymentType, channelName, err);
      }
      spinner.stop();
      throw err;
    });
};
