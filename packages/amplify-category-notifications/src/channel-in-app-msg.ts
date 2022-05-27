/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny, $TSContext, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/no-var-requires */
import * as inquirer from 'inquirer';
import ora from 'ora';
import { NotificationsDB } from './notifications-backend-cfg-api';
import {
  AnalyticsCapabilityAPIResponse, invokeAnalyticsResourceToggleNotificationChannel, NotificationChannels,
} from './analytics-resource-api';
import { disableChannelBackendConfig } from './multi-env-manager';
import { IChannelAPIResponse, ChannelAction } from './notifications-api-types';

const channelName = 'InAppMessaging';
const spinner = ora('');

/**
 * Configure Pinpoint with configs and IAM roles
 * @param {*} context amplify cli context
 */
export const configure = async (context: $TSContext) : Promise<$TSContext> => {
  console.log(`SACPCDEBUG: channel-in-app-msg: config : ${JSON.stringify(context.exeInfo.serviceMeta, null, 2)}`);
  if (await NotificationsDB.isChannelEnabledNotificationsBackendConfig(channelName)) {
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
    console.log('SACPCDEBUG: Enable: Validating BackendConfig:multi-env-manager ', JSON.stringify(stateManager.getBackendConfig(), null, 2));
  }
  return context;
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start('Updating In-App messaging channel.');
  //TBD: add the PINPOINT resource id - right now its assumed to be a single resource
  const enableInAppMsgAPIResponse : AnalyticsCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    true);
  if (enableInAppMsgAPIResponse.status) {
    spinner.succeed(`The ${channelName} channel has been successfully enabled.`);
    // context.exeInfo.serviceMeta.output[channelName] = analyticsAPIResponse.response.channelName;
    // TBD: Analytics API should respond with a resourceID ( pinpointResourceName+shortID)
  } else {
    spinner.fail(`update channel error: ${enableInAppMsgAPIResponse.reasonMsg as string}`);
  }
  const enableChannelInAppMsgResponse : IChannelAPIResponse = {
    action: ChannelAction.ENABLE,
    channel: channelName,
    response: enableInAppMsgAPIResponse,
  };
  return enableChannelInAppMsgResponse;
};

/**
 * Disable walkthrough for InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const disable = async (context: $TSContext):Promise<$TSAny> => {
  spinner.start('Updating In-App messaging channel.');
  const disableInAppMsgResponse : AnalyticsCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    false /*disable*/);
  if (disableInAppMsgResponse.status) {
    spinner.succeed(`The ${channelName} channel has been disabled.`);
  } else {
    spinner.fail('update channel error');
  }
  const disableChannelInAppMsgResponse : IChannelAPIResponse = {
    action: ChannelAction.DISABLE,
    channel: channelName,
    response: disableInAppMsgResponse,
  };
  return disableChannelInAppMsgResponse;
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
