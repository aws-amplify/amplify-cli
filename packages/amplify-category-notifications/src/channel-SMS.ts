/* eslint-disable no-param-reassign */
import { $TSAny, $TSContext } from 'amplify-cli-core';

import inquirer from 'inquirer';
import ora from 'ora';

const channelName = 'SMS';
const spinner = ora('');
/**
 * Configure SMS channel on analytics resource
 * @param context - amplify cli context
 */
export const configure = async (context : $TSContext):Promise<void> => {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName] && context.exeInfo.serviceMeta.output[channelName].Enabled;

  if (isChannelEnabled) {
    context.print.info(`The ${channelName} channel is currently enabled`);
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

  spinner.start('Updating SMS channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err:$TSAny, data:$TSAny) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        resolve(data);
      }
    });
  });
};

/**
 *  Disable SMS channel on the Analytics resource
 * @param context amplify cli context
 * @returns Pinpoint API response
 */
export const disable = async (context: $TSContext) : Promise<$TSAny> => {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    SMSChannelRequest: {
      Enabled: false,
    },
  };

  spinner.start('Updating SMS channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err:$TSAny, data:$TSAny) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        resolve(data);
      }
    });
  });
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
      pinpointApp[channelName] = data.SMSChannelResponse;
      return data.SMSChannelResponse;
    })
    .catch((err : $TSAny) => {
      if (err.code === 'NotFoundException') {
        spinner.succeed(`Channel is not setup for ${channelName} `);
        return err;
      }
      spinner.stop();
      throw err;
    });
};

module.exports = {
  configure,
  enable,
  disable,
  pull,
};
