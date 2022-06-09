/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny, $TSContext, AmplifySupportedService,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
} from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/no-var-requires */
import * as inquirer from 'inquirer';
import ora from 'ora';
import { NotificationsDB } from './notifications-backend-cfg-api';
import {
  invokeAnalyticsResourceToggleNotificationChannel,
} from './analytics-resource-api';
import { IChannelAPIResponse, ChannelAction, ChannelConfigDeploymentType } from './notifications-api-types';
import { ChannelAPI } from './notifications-backend-cfg-channel-api';

const channelName = 'InAppMessaging';
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.DEFERRED;

/**
 * Configure Pinpoint with configs and IAM roles
 * @param {*} context amplify cli context
 */
export const configure = async (context: $TSContext) : Promise<$TSContext> => {
  if (await NotificationsDB.isChannelEnabledNotificationsBackendConfig(channelName)) {
    context.print.info(`The ${ChannelAPI.getChannelViewName(channelName)} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${ChannelAPI.getChannelViewName(channelName)} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      await disable(context);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${ChannelAPI.getChannelViewName(channelName)} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await enable(context);
    }
  }
  return context;
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start(`Updating ${ChannelAPI.getChannelViewName(channelName)} channel.`);
  //TBD: add the PINPOINT resource id - right now its assumed to be a single resource
  const enableInAppMsgAPIResponse : IPluginCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    true);
  if (enableInAppMsgAPIResponse.status) {
    spinner.succeed(`The ${ChannelAPI.getChannelViewName(channelName)} channel has been successfully enabled.`);
    // context.exeInfo.serviceMeta.output[channelName] = analyticsAPIResponse.response.channelName;
    // TBD: Analytics API should respond with a resourceID ( pinpointResourceName+shortID)
  } else {
    spinner.fail(`update channel error: ${enableInAppMsgAPIResponse.reasonMsg as string}`);
  }
  const enableChannelInAppMsgResponse : IChannelAPIResponse = {
    action: ChannelAction.ENABLE,
    deploymentType,
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
  const disableInAppMsgResponse : IPluginCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    false /*disable*/);
  if (disableInAppMsgResponse.status) {
    spinner.succeed(`The ${ChannelAPI.getChannelViewName(channelName)} channel has been disabled.`);
  } else {
    spinner.fail('update channel error');
  }
  const disableChannelInAppMsgResponse : IChannelAPIResponse = {
    action: ChannelAction.DISABLE,
    deploymentType,
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
  spinner.start(`Retrieving channel information for ${ChannelAPI.getChannelViewName(channelName)}.`);
  return context.exeInfo.pinpointClient
    .getSmsChannel(params)
    .promise()
    .then((data:$TSAny) => {
      spinner.succeed(`Channel information retrieved for ${ChannelAPI.getChannelViewName(channelName)}`);
      pinpointApp[channelName] = data.SMSChannelResponse;
      return data.SMSChannelResponse;
    })
    .catch((err:$TSAny) => {
      if (err.code === 'NotFoundException') {
        spinner.succeed(`Channel is not setup for ${ChannelAPI.getChannelViewName(channelName)} `);
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
