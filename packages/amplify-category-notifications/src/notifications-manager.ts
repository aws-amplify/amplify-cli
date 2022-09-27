import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, AmplifyError, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as pinpointHelper from './pinpoint-helper';
import {
  IChannelAPIResponse, NotificationsChannelAPIModule,
} from './channel-types';
import { Notifications } from './notifications-api';
import { getPinpointAppStatusFromMeta } from './pinpoint-helper';

/**
 * Enable the selected notification channel
 */
export const enableChannel = async (context: $TSContext, channelName: string): Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (!Notifications.ChannelCfg.isValidChannel(channelName)) {
    throw new AmplifyError('ConfigurationError', {
      message: `Enable channel failed: invalid notification channel ${channelName}`,
      resolution: `Select a valid notification channel from the list: ${Notifications.ChannelCfg.getAvailableChannels().join(', ')}`,
    });
  }
  context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
  const channelActionHandler:NotificationsChannelAPIModule = await import(Notifications.ChannelCfg.getChannelHandlerPath(channelName));
  return channelActionHandler.enable(context);
};

/**
 * Disable the notification channels in use.
 */
export const disableChannel = async (context : $TSContext, channelName: string): Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (Notifications.ChannelCfg.isValidChannel(channelName)) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelActionHandler:NotificationsChannelAPIModule = await import(Notifications.ChannelCfg.getChannelHandlerPath(channelName));
    return channelActionHandler.disable(context);
  }
  return undefined;
};

/**
 * Disable all notifications channels in use
 * @param context amplify-cli context
 * @returns Array of Channel API responses
 */
export const disableAllChannels = async (context: $TSContext): Promise<Array<IChannelAPIResponse>> => {
  const enabledChannels = await Notifications.ChannelCfg.getEnabledChannels(context);
  const responseArray = [];
  // sequentially disable each channel - since persistent context gets updated
  for (const channelName of enabledChannels) {
    const channelAPIResponse = await disableChannel(context, channelName);
    if (channelAPIResponse) {
      responseArray.push(channelAPIResponse);
    }
  }
  return responseArray;
};

/**
 * Call this to remove the notifications category only after all channels have been disabled.
 * @param context Amplify CLI context
 */
export const removeEmptyNotificationsApp = async (context: $TSContext): Promise<$TSContext> => {
  let updatedContext = context;
  const enabledChannels = await Notifications.ChannelCfg.getEnabledChannels(context);
  if (enabledChannels.length > 0) {
    throw new AmplifyError('RemoveNotificationAppError', {
      message: `Cannot remove notifications app`,
      resolution: `Remove all notification channels before removing the notifications app`,
    });
  }
  updatedContext = await Notifications.Meta.removeNotificationsAppMeta(updatedContext);
  return Notifications.Cfg.removeNotificationsAppConfig(updatedContext);
};

/**
 * Configure the Pinpoint resources,
 * Also create the required IAM policy to allow Pinpoint to trigger notifications
 */
export const configureChannel = async (context: $TSContext, channelName: string):Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const notificationsMeta = await Notifications.Meta.getNotificationsAppMeta(context.exeInfo.amplifyMeta);
  const pinpointAppStatus = await getPinpointAppStatusFromMeta(context, notificationsMeta, envName);

  if (channelName in Notifications.ChannelCfg.ChannelType) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
      printer.error('No resources to update.');
      return undefined;
    }

    const channelActionHandler:NotificationsChannelAPIModule = await import(Notifications.ChannelCfg.getChannelHandlerPath(channelName));
    return channelActionHandler.configure(context, pinpointAppStatus.status);
  }
  return undefined;
};

/**
 * Fetch all the configured channels from pinpoint
 */
export const pullAllChannels = async (context: $TSContext, pinpointApp: $TSAny):Promise<Array<IChannelAPIResponse>> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pullTasks: Array<$TSAny> = [];
  context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);

  for (const channelName of Object.keys(Notifications.ChannelCfg.ChannelType)) {
    const channelActionHandler:NotificationsChannelAPIModule = await import(Notifications.ChannelCfg.getChannelHandlerPath(channelName));
    pullTasks.push(() => channelActionHandler.pull(context, pinpointApp));
  }
  const pullChannelsResponseList : Array<IChannelAPIResponse> = await sequential(pullTasks);
  return pullChannelsResponseList;
};
