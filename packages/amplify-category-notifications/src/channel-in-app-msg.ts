/* eslint-disable spaced-comment */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyFault,
  AmplifySupportedService,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
  stateManager,
} from '@aws-amplify/amplify-cli-core';
/* eslint-disable @typescript-eslint/no-var-requires */
import ora from 'ora';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import {
  invokeAnalyticsResourceToggleNotificationChannel,
  invokeAnalyticsPinpointHasInAppMessagingPolicy,
} from './plugin-client-api-analytics';
import { IChannelAPIResponse, ChannelAction, ChannelConfigDeploymentType } from './channel-types';

import { buildPinpointChannelResponseSuccess, getPinpointAppStatusFromMeta, IPinpointDeploymentStatus } from './pinpoint-helper';
import { ChannelType, getChannelViewName, isChannelEnabledNotificationsBackendConfig } from './notifications-backend-cfg-channel-api';
import { getNotificationsAppMeta } from './notifications-amplify-meta-api';
import { getNotificationsAppConfig } from './notifications-backend-cfg-api';

const channelName = 'InAppMessaging';
const channelViewName = getChannelViewName(channelName);
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
    subCapability: ChannelType.InAppMessaging,
  },
  deploymentType: ChannelConfigDeploymentType.DEFERRED,
};

/**
 * Configure Pinpoint with configs and IAM roles
 * @param {*} context amplify cli context
 */
export const configure = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  if (await isChannelEnabledNotificationsBackendConfig(channelName)) {
    printer.info(`The ${channelViewName} channel is currently enabled`);

    if (await prompter.yesOrNo(`Do you want to disable the ${channelViewName} channel`, false)) {
      return disable(context);
    }
  } else if (await prompter.yesOrNo(`Do you want to enable the ${channelViewName} channel`, true)) {
    return enable(context);
  }
  return NOOP_CFG_RESPONSE; // nothing to be done
};

/**
 * Inline enable for In-App-Messaging channel
 */
const invokeInlineEnableInAppMessagingChannel = (): IPluginCapabilityAPIResponse => {
  throw new AmplifyFault('ConfigurationFault', {
    message: 'Inline enable not supported for In-App Messaging channel.',
    details:
      'Adding In-App Messaging to a project with Analytics or Push Notification enabled is currently not supported. Please refer to this Github issue for updates: https://github.com/aws-amplify/amplify-cli/issues/11087',
  });

  // create IAM role and apply on pinpoint app using sdk
};

/**
 * Enable InAPPMessaging channel
 * @param {*} context amplify cli context
 * @returns Analytics API response
 */
export const enable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start(`Enabling ${getChannelViewName(channelName)} channel.`);

  try {
    //get the pinpoint resource state - if custom deploy - fallback to in-line deployment
    const envName = stateManager.getCurrentEnvName();
    const notificationsMeta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const pinpointAppStatus = await getPinpointAppStatusFromMeta(context, notificationsMeta, envName);
    const enableInAppMsgAPIResponse =
      pinpointAppStatus.status === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM ||
      !(await invokeAnalyticsPinpointHasInAppMessagingPolicy(context))
        ? invokeInlineEnableInAppMessagingChannel()
        : await invokeAnalyticsResourceToggleNotificationChannel(
            context,
            AmplifySupportedService.PINPOINT,
            NotificationChannels.IN_APP_MSG,
            true,
          );

    if (enableInAppMsgAPIResponse.status) {
      spinner.succeed(`The ${getChannelViewName(channelName)} channel has been successfully enabled.`);
    } else {
      spinner.fail(`Enable channel error: ${enableInAppMsgAPIResponse.reasonMsg as string}`);
    }

    const enableChannelInAppMsgResponse: IChannelAPIResponse = {
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
export const disable = async (context: $TSContext): Promise<IChannelAPIResponse> => {
  spinner.start('Disabling In-App Messaging channel.');
  const disableInAppMsgResponse = await invokeAnalyticsResourceToggleNotificationChannel(
    context,
    AmplifySupportedService.PINPOINT,
    NotificationChannels.IN_APP_MSG,
    false /*disable*/,
  );
  if (disableInAppMsgResponse.status) {
    spinner.succeed(`The ${getChannelViewName(channelName)} channel has been disabled.`);
  } else {
    spinner.fail('Disable channel error');
  }
  const disableChannelInAppMsgResponse: IChannelAPIResponse = {
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
  spinner.start(`Retrieving channel information for ${getChannelViewName(channelName)}.`);
  const notificationsMeta = await getNotificationsAppMeta(currentAmplifyMeta);
  let channelMeta = notificationsMeta?.output?.channels ? notificationsMeta.output.channels[channelName] : undefined;
  if (!channelMeta) {
    const backendConfig = await getNotificationsAppConfig(currentBackendCfg);
    if (backendConfig?.channels?.includes(channelName)) {
      channelMeta = {
        Enabled: true,
        ApplicationId: pinpointApp.Id,
        Name: pinpointApp.Name,
      };
    } else {
      spinner.stop();
      return undefined;
    }
  }
  spinner.succeed(`Channel information retrieved for ${getChannelViewName(channelName)}`);
  pinpointApp[channelName] = channelMeta;
  return buildPinpointChannelResponseSuccess(ChannelAction.PULL, deploymentType, channelName, channelMeta);
};
