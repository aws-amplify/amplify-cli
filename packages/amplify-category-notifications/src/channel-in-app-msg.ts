/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny, $TSContext, AmplifyCategories, amplifyFaultWithTroubleshootingLink, AmplifySupportedService,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
  stateManager,
} from 'amplify-cli-core';

/* eslint-disable @typescript-eslint/no-var-requires */
import * as inquirer from 'inquirer';
import ora from 'ora';
import { printer } from 'amplify-prompts';
import { Notifications } from './notifications-api';
import {
  invokeAnalyticsResourceToggleNotificationChannel,
} from './plugin-client-api-analytics';
import { IChannelAPIResponse, ChannelAction, ChannelConfigDeploymentType } from './channel-types';
import { ChannelCfg } from './notifications-backend-cfg-channel-api';
import {
  buildPinpointChannelResponseError,
  buildPinpointChannelResponseSuccess,
  getPinpointAppStatusFromMeta, IPinpointAppStatus, IPinpointDeploymentStatus,
} from './pinpoint-helper';

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
    printer.info(`The ${channelViewName} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${channelViewName} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      return disable(context);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelViewName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      return enable(context);
    }
  }
  return NOOP_CFG_RESPONSE; //nothing to be done
};

/**
 * Inline enable for In-App-Messaging channel
 * @param __context amplify cli context
 * @param __pinpointAppStatus Pinpoint app status
 */
const invokeInlineEnableInAppMessagingChannel = (
  __context: $TSContext,
  __pinpointAppStatus: IPinpointAppStatus,
): IPluginCapabilityAPIResponse => {
  throw amplifyFaultWithTroubleshootingLink('ConfigurationFault', {
    message: 'Inline enable not supported for In-App Messaging channel.',
  });

  // create IAM role and apply on pinpoint app using sdk
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start(`Enabling ${ChannelCfg.getChannelViewName(channelName)} channel.`);

  try {
    //get the pinpoint resource state - if custom deploy - fallback to in-line deployment
    const envName = stateManager.getCurrentEnvName();
    const notificationsMeta = await Notifications.Meta.getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const pinpointAppStatus: IPinpointAppStatus = await getPinpointAppStatusFromMeta(context, notificationsMeta, envName);
    const enableInAppMsgAPIResponse = pinpointAppStatus.status === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM
      ? invokeInlineEnableInAppMessagingChannel(context, pinpointAppStatus)
      : await invokeAnalyticsResourceToggleNotificationChannel(context,
        AmplifySupportedService.PINPOINT,
        NotificationChannels.IN_APP_MSG,
        true);

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
  } catch (e) {
    spinner.fail(`Enable channel error: ${e.message}`);
    throw e;
  }
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
 * @param {*} __context amplify cli context
 * @returns Analytics API response
 */
export const pull = async (__context: $TSContext, pinpointApp: $TSAny): Promise<$TSAny> => {
  const currentAmplifyMeta = stateManager.getCurrentMeta();
  const currentBackendCfg = stateManager.getCurrentBackendConfig();
  spinner.start(`Retrieving channel information for ${ChannelCfg.getChannelViewName(channelName)}.`);
  const notificationsMeta = await Notifications.Meta.getNotificationsAppMeta(currentAmplifyMeta);
  let channelMeta = (notificationsMeta?.output?.channels) ? notificationsMeta.output.channels[channelName] : undefined;
  if (!channelMeta) {
    const backendConfig = await Notifications.Cfg.getNotificationsAppConfig(currentBackendCfg);
    if (backendConfig?.channels?.includes(channelName)) {
      channelMeta = {
        Enabled: true,
        ApplicationId: pinpointApp.Id,
        Name: pinpointApp.Name,
      };
    } else {
      spinner.fail(`Channel ${ChannelCfg.getChannelViewName(channelName)} not found.`);
      return buildPinpointChannelResponseError(ChannelAction.PULL, deploymentType,
        channelName, `${channelName} not found in the notifications metadata`);
    }
  }
  spinner.succeed(`Channel information retrieved for ${ChannelCfg.getChannelViewName(channelName)}`);
  pinpointApp[channelName] = channelMeta;
  return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, channelMeta);
};
