/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny, $TSContext, AmplifySupportedService,
} from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/no-var-requires */
import * as inquirer from 'inquirer';
import ora from 'ora';
import { isChannelEnabledNotificationsBackendConfig } from './notifications-state-db-api';
import {
  AnalyticsCapabilityAPIResponse, invokeAnalyticsResourceToggleNotificationChannel, NotificationChannels,
} from './analytics-resource-api';
import { toggleChannelBackendConfig } from './multi-env-manager';

const channelName = 'InAppMsg';
const spinner = ora('');

/**
 * Configure Pinpoint with configs and IAM roles
 * @param {*} context amplify cli context
 */
export const configure = async (context: $TSContext) => {
  console.log(`SACPCDEBUG: channel-in-app-msg: config : ${JSON.stringify(context.exeInfo.serviceMeta, null, 2)}`);
  // const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName] && context.exeInfo.serviceMeta.output[channelName].Enabled;

  if (isChannelEnabledNotificationsBackendConfig(channelName)) {
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
      console.log('SACPCDEBUG: channel-in-app-msg: config : Calling Enable-InAppMessaging');
      await enable(context);
    }
    await toggleChannelBackendConfig(channelName); //save configuration in backend-config.json
  }
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<AnalyticsCapabilityAPIResponse> => {
  spinner.start('Updating In-App messaging channel.');
  //TBD: add the PINPOINT resource id - right now its assumed to be a single resource
  const enableInAppMsgResponse : AnalyticsCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    true);
  if (enableInAppMsgResponse.status) {
    spinner.succeed(`The ${channelName} channel has been successfully enabled.`);
    // context.exeInfo.serviceMeta.output[channelName] = analyticsAPIResponse.response.channelName;
    // TBD: Analytics API should respond with a resourceID ( pinpointResourceName+shortID)
    console.log('SACPCDEBUG: channel-in-app-msg: analytics API Enable response : ', JSON.stringify(enableInAppMsgResponse, null, 2));
    await toggleChannelBackendConfig(channelName);
  } else {
    console.log('SACPCDEBUG: channel-in-app-msg: analytics API Enable ERROR : ', JSON.stringify(enableInAppMsgResponse, null, 2));
    spinner.fail(`update channel error: ${enableInAppMsgResponse.reasonMsg as string}`);
  }
  return enableInAppMsgResponse;
};

/**
 * Disable walkthrough for InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const disable = async (context: $TSContext):Promise<$TSAny> => {
  const disableInAppMsgResponse : AnalyticsCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    false /*disable*/);
  spinner.start('Updating In-App messaging channel.');
  if (disableInAppMsgResponse.status) {
    spinner.succeed(`The ${channelName} channel has been disabled.`);
    //context.exeInfo.serviceMeta.output[channelName] = analyticsAPIResponse.response.channelName;
  } else {
    spinner.fail('update channel error');
  }
  return disableInAppMsgResponse;
};

/**
 * Pull walkthrough for InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const pull = async (context: $TSContext, pinpointApp:$TSAny):Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointApp.Id,
  };
  spinner.start(`Retrieving channel information for ${channelName}.`);
  return context.exeInfo.pinpointClient
    .getSmsChannel(params)
    .promise()
    .then((data:$TSAny) => {
      spinner.succeed(`Channel information retrieved for ${channelName}`);
      pinpointApp[channelName] = data.SMSChannelResponse;
      return data.SMSChannelResponse;
    })
    .catch((err:$TSAny) => {
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
