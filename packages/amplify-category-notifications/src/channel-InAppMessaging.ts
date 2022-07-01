/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
  stateManager,
} from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/no-var-requires */
import * as inquirer from 'inquirer';
import ora from 'ora';
import { Notifications } from './notifications-api';
import {
  invokeAnalyticsResourceToggleNotificationChannel,
} from './plugin-client-api-analytics';
import { IChannelAPIResponse, ChannelAction, ChannelConfigDeploymentType } from './channel-types';
import { ChannelCfg } from './notifications-backend-cfg-channel-api';
import {
  buildPinpointChannelResponseError,
  buildPinpointChannelResponseSuccess,
  ensurePinpointApp,
  getPinpointAppStatusFromMeta, IPinpointAppStatus, IPinpointDeploymentStatus,
} from './pinpoint-helper';
import { ICategoryMeta } from './notifications-amplify-meta-types';

const channelName = 'InAppMessaging';
const channelViewName = ChannelCfg.getChannelViewName(channelName);
const spinner = ora('');
const deploymentType = ChannelConfigDeploymentType.DEFERRED;

const NOOP_CFG_RESPONSE: IChannelAPIResponse = {
  action: ChannelAction.CONFIGURE, //since config has not transformed into enable/disable, user has decided not to take any action.
  channel: channelName,
  response: {
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status: true,
    capability: AmplifyCategories.NOTIFICATIONS,
    subCapability: ChannelCfg.ChannelType.InAppMessaging,
  },
  deploymentType: ChannelConfigDeploymentType.DEFERRED,
};

/**
 * Configure Pinpoint with configs and IAM roles
 * @param {*} context amplify cli context
 */
export const configure = async (context: $TSContext) : Promise<IChannelAPIResponse> => {
  if (await Notifications.ChannelCfg.isChannelEnabledNotificationsBackendConfig(channelName)) {
    context.print.info(`The ${channelViewName} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${channelViewName} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      const response = await disable(context);
      return response;
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelViewName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      const response = await enable(context);
      return response;
    }
  }
  return NOOP_CFG_RESPONSE; //nothing to be done
};

/**
 * Inline enable for In-App-Messaging channel
 * @param _context amplify cli context
 * @param pinpointAppStatus Pinpoint app status
 */
export const invokeInlineEnableInAppMessagingChannel = (_context: $TSContext, _pinpointAppStatus:IPinpointAppStatus)
: Promise<IPluginCapabilityAPIResponse> => {
  // console.log('Enabling In-App Messaging channel In-line');
  // const output : NotificationsChannelMeta = {
  //   ApplicationId: pinpointAppStatus.app?.id, // Pinpoint Physical ID
  //   CreationDate: new Date().toISOString(), // Date-Time
  //   Enabled: true,
  //   Id: pinpointAppStatus.app?.id,
  //   LastModifiedDate: new Date().toISOString(), // Timestamp of when was this channel last updated
  //   IsArchived: false,
  //   Platform: ChannelCfg.ChannelType.InAppMessaging, // Set to EMAIL/SMS - unused
  //   Version: 0, // Increments when channel is updated
  // };

  // const apiResponse : IChannelAPIResponse = buildPinpointChannelResponseSuccess(ChannelAction.ENABLE,
  //   ChannelConfigDeploymentType.INLINE, ChannelCfg.ChannelType.InAppMessaging, output);
  throw new Error('Inline enable not supported for In-App Messaging channel');

  //create IAM role and apply on pinpoint app using sdk
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start(`Enabling ${ChannelCfg.getChannelViewName(channelName)} channel.`);
  //get the pinpoint resource state - if custom deploy - fallback to in-line deployment
  const envName = stateManager.getCurrentEnvName();
  const notificationsMeta = await Notifications.Meta.getNotificationsAppMeta(context.exeInfo.amplifyMeta);
  const pinpointAppStatus: IPinpointAppStatus = await getPinpointAppStatusFromMeta(context, notificationsMeta, envName);
  let enableInAppMsgAPIResponse : IPluginCapabilityAPIResponse;

  if (pinpointAppStatus.status === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM) {
    enableInAppMsgAPIResponse = await invokeInlineEnableInAppMessagingChannel(context, pinpointAppStatus);
  } else {
    //TBD: add the PINPOINT resource id - right now its assumed to be a single resource
    enableInAppMsgAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
      AmplifySupportedService.PINPOINT,
      NotificationChannels.IN_APP_MSG,
      true);
  }

  if (enableInAppMsgAPIResponse.status) {
    spinner.succeed(`The ${ChannelCfg.getChannelViewName(channelName)} channel has been successfully enabled.`);
  } else {
    spinner.fail(`Enable channel error: ${enableInAppMsgAPIResponse.reasonMsg as string}`);
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
export const disable = async (context: $TSContext):Promise<IChannelAPIResponse> => {
  spinner.start('Disabling In-App messaging channel.');
  const disableInAppMsgResponse : IPluginCapabilityAPIResponse = await invokeAnalyticsResourceToggleNotificationChannel(context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    false /*disable*/);
  if (disableInAppMsgResponse.status) {
    spinner.succeed(`The ${ChannelCfg.getChannelViewName(channelName)} channel has been disabled.`);
  } else {
    spinner.fail('Disable channel error');
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
 * Pull currently deployed InAPPMessaging channel info from Pinpoint.
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const pull = async (context:$TSContext, pinpointApp:$TSAny):Promise<$TSAny> => {
  const currentAmplifyMeta = stateManager.getCurrentMeta();
  const currentBackendCfg = stateManager.getCurrentBackendConfig();
  spinner.start(`Retrieving channel information for ${ChannelCfg.getChannelViewName(channelName)}.`);
  const notificationsMeta = await Notifications.Meta.getNotificationsAppMeta(currentAmplifyMeta);
  let channelMeta = (notificationsMeta?.output?.channels) ? notificationsMeta.output.channels[channelName] : undefined;
  if (!channelMeta) {
    const backendConfig = await Notifications.Cfg.getNotificationsAppConfig(currentBackendCfg);
    if (backendConfig && backendConfig.channels && backendConfig.channels.includes(channelName)) {
      channelMeta = {
        Enabled: true,
        ApplicationId: pinpointApp.Id,
        Name: pinpointApp.Name,
      };
    } else {
      spinner.fail(`Channel ${ChannelCfg.getChannelViewName(channelName)} not found.`);
      const errResponse = buildPinpointChannelResponseError(ChannelAction.PULL, deploymentType,
        channelName, `${channelName} not found in the notifications metadata`);
      return errResponse;
    }
  }
  spinner.succeed(`Channel information retrieved for ${ChannelCfg.getChannelViewName(channelName)}`);
  pinpointApp[channelName] = channelMeta;
  const successResponse = buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, channelMeta);
  return successResponse;
};

module.exports = {
  configure,
  enable,
  disable,
  pull,
};
