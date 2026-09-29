import { $TSContext, stateManager, AmplifyCategories, AmplifySupportedService, AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { IChannelAvailability, ChannelConfigDeploymentType, IChannelViewInfo } from './channel-types';
import { getNotificationsAppConfig } from './notifications-backend-cfg-api';
import { INotificationsResourceBackendConfig, INotificationsChannelBackendConfig } from './notifications-backend-cfg-types';

/**
 * API to update Notification Channel config state
 * All functions are idempotent (no side effects)
 */

/**
 * Channel names
 */
export const ChannelType: Record<string, string> = {
  APNS: 'APNS',
  FCM: 'FCM',
  InAppMessaging: 'InAppMessaging',
  Email: 'Email',
  SMS: 'SMS',
};

/**
 * Get path to the channel handler from channel-type.
 * !! Its important that the channel handler's module path is relative to the path of this file.
 */
export const getChannelHandlerPath = (channelName: string): string => `${path.join(__dirname, channelViewInfo[channelName].module)}`;

/**
 * Map of channel-type to channel-info. This map will be extended when new notification
 * channels are enabled.
 * note:-
 * All channels with INLINE deployment type would eventually be converted to DEFERRED
 * once CustomLambda callout uses CloudFormation/CDK
 */
const channelViewInfo: Record<string, IChannelViewInfo> = {
  [ChannelType.APNS]: {
    channelName: ChannelType.APNS,
    viewName: 'APNS |  Apple Push Notifications   ',
    help: 'Send Apple push notifications to Pinpoint user segments',
    module: './channel-apns',
    deploymentType: ChannelConfigDeploymentType.INLINE,
  },
  [ChannelType.FCM]: {
    channelName: ChannelType.FCM,
    viewName: 'FCM  | » Firebase Push Notifications ',
    // eslint-disable-next-line spellcheck/spell-checker
    help: 'Send Firebase Cloud Messaging push notifications to your Pinpoint user segments',
    module: './channel-fcm',
    deploymentType: ChannelConfigDeploymentType.INLINE,
  },
  [ChannelType.InAppMessaging]: {
    channelName: ChannelType.InAppMessaging,
    viewName: 'In-App Messaging',
    // eslint-disable-next-line spellcheck/spell-checker
    help: 'Allow application clients in Pinpoint user segment mobile devices to pull engagement messages from Pinpoint',
    module: './channel-in-app-msg',
    deploymentType: ChannelConfigDeploymentType.DEFERRED,
  },
  [ChannelType.Email]: {
    channelName: ChannelType.Email,
    viewName: 'Email',
    // eslint-disable-next-line spellcheck/spell-checker
    help: 'Send Email messages to your Pinpoint user segments',
    module: './channel-email',
    deploymentType: ChannelConfigDeploymentType.INLINE,
  },
  [ChannelType.SMS]: {
    channelName: ChannelType.SMS,
    viewName: 'SMS',
    // eslint-disable-next-line spellcheck/spell-checker
    help: 'Send SMS messages to your Pinpoint user segments',
    module: './channel-sms',
    deploymentType: ChannelConfigDeploymentType.INLINE,
  },
};

/**
 * checks if it's a valid channel type
 */
export const isValidChannel = (channelName: string | undefined): boolean => channelName !== undefined && channelName in ChannelType;

/**
 * Get the channel view info for the given channel
 */
export const getChannelViewInfo = (channelName: string): IChannelViewInfo => channelViewInfo[channelName];

/**
 * Given a channelName display the help string for it.
 * @param channelName  notifications channel for which help needs to be displayed
 * @returns help string for the channel name
 */
export const getChannelViewHelp = (channelName: string): string => channelViewInfo[channelName].help;

/**
 * Given a channelName return the user friendly channel name to be displayed
 * @param channelName  notifications channel for which user friendly string needs to be returned.
 */
export const getChannelViewName = (channelName: string): string => channelViewInfo[channelName].viewName;

/**
 * Given a user friendly channel name, return the channelName which it maps to.
 * @param channelViewString user friendly channel name e.g (Apple Push Notifications)
 * @returns channel name (e.g APN)
 */
export const getChannelNameFromView = (channelViewString: string): string => {
  for (const channelName of Object.keys(ChannelType)) {
    if (channelViewInfo[channelName].viewName === channelViewString) {
      return channelName;
    }
  }
  throw new AmplifyError('ConfigurationError', {
    message: `No channel name found for view: ${channelViewString}`,
  });
};

/**
 * For a given notifications resource get local and deployed channel availability
 * @param backendResourceConfig notifications resource info from the backend config
 * @returns enabled and disabled channels
 */
export const getChannelAvailability = async (backendResourceConfig: INotificationsResourceBackendConfig): Promise<IChannelAvailability> => {
  const availableChannels = getAvailableChannels();
  const enabledChannels = (await getEnabledChannelsFromBackendConfig(backendResourceConfig)) || [];
  const disabledChannels = (await getDisabledChannelsFromBackendConfig(availableChannels, enabledChannels)) || [];
  const backend: IChannelAvailability = {
    enabledChannels,
    disabledChannels,
  };
  return backend;
};

/**
 * Get all notifications channel which are not in use in the Backend Config
 * @returns array of channels which are not in use
 */
export const getDisabledChannelsFromBackendConfig = async (
  availableChannels?: Array<string>,
  enabledChannels?: Array<string>,
): Promise<Array<string>> => {
  let result: Array<string> = [];
  const tmpEnabledChannels = enabledChannels || (await getEnabledChannelsFromBackendConfig());
  const tmpAvailableChannels = availableChannels || getAvailableChannels();
  if (!tmpAvailableChannels) {
    return result;
  }
  result = tmpAvailableChannels.filter((channelName) => !tmpEnabledChannels.includes(channelName));
  return result;
};

/**
 * Returns true if resource is deployed only during amplify push
 * @param validChannelName - a valid channel name
 * @returns true if channel deployment is handled through amplify push
 */
export const isChannelDeploymentDeferred = (validChannelName: string): boolean =>
  getChannelDeploymentType(validChannelName) === ChannelConfigDeploymentType.DEFERRED;

/**
 * Returns true if resource is deployed during the amplify cli execution
 * @param validChannelName - a valid channel name
 * @returns true if channel deployment is handled at the time of amplify cli execution
 */
export const isChannelDeploymentInline = (validChannelName: string): boolean =>
  getChannelDeploymentType(validChannelName) === ChannelConfigDeploymentType.INLINE;

/**
 * Check if notification channel has been added to the backend-config
 * @param resourceBackendConfig - Backend config for the given pinpoint resource from backend-config.json
 * @param channel - Notification channel to be checked for.
 * @returns true if channel is enabled in backend-config
 */
export const isNotificationChannelEnabledInBackendConfig = (
  resourceBackendConfig: INotificationsResourceBackendConfig,
  channel: string,
): boolean => resourceBackendConfig.channels?.includes(channel);

/**
 * Query BackendConfig to check if notification channel has be been updated.
 * note: - amplify-meta.json will be updated after deployment
 * @param channelName  Name of the notification channel SMS/InAppMessaging etc.
 */
export const isChannelEnabledNotificationsBackendConfig = async (channelName: string): Promise<boolean> => {
  const backendConfig = stateManager.getBackendConfig();
  const notificationResources = backendConfig[AmplifyCategories.NOTIFICATIONS];
  if (!notificationResources) {
    return false;
  }
  for (const resourceName of Object.keys(notificationResources)) {
    if (notificationResources[resourceName].service === AmplifySupportedService.PINPOINT) {
      return notificationResources[resourceName].channels?.includes(channelName);
    }
  }
  return false;
};

/**
 * Get all available notification channels
 */
export const getAvailableChannels = (): Array<string> => Object.keys(ChannelType);

/**
 * Get user friendly names for all available notification channels
 * @returns user friendly channel names
 */
export const getAvailableChannelViewNames = (): Array<string> => Object.keys(ChannelType).map(getChannelViewName);

/**
 * Get user friendly channel names
 * @param notificationConfig from the BackendConfig
 * @returns array of user friendly channel names
 */
export const getEnabledChannelViewNames = async (notificationConfig: INotificationsResourceBackendConfig): Promise<string[]> => {
  const enabledChannels = await getEnabledChannelsFromBackendConfig(notificationConfig);
  return enabledChannels.map(getChannelViewName);
};

/**
 * Get all notifications channels enabled in the backend-config
 * @param context amplify cli context
 * @returns array of enabledChannels
 */
export const getEnabledChannels = async (context: $TSContext): Promise<Array<string>> => {
  const notificationConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
  return (await getEnabledChannelsFromBackendConfig(notificationConfig)) || [];
};

/**
 * Get all enabled channels in backend config
 * This is required for Pinpoint resources updated in Analytics CFN but not yet pushed
 */
export const getEnabledChannelsFromBackendConfig = async (
  notificationsConfig?: INotificationsResourceBackendConfig,
): Promise<Array<string>> => {
  const tmpNotificationsCfg = notificationsConfig || (await getNotificationsAppConfig());
  if (tmpNotificationsCfg) {
    return tmpNotificationsCfg.channels;
  }
  return [];
};

/**
 * checks if the channel is deferred or inline
 */
export const getChannelDeploymentType = (channelName: string): ChannelConfigDeploymentType =>
  channelName === ChannelType.InAppMessaging ? ChannelConfigDeploymentType.DEFERRED : ChannelConfigDeploymentType.INLINE;

/**
 * enables notification channel config in the backend-config
 */
export const enableNotificationsChannel = (
  notificationsConfig: INotificationsResourceBackendConfig,
  validChannelName: string,
  channelConfig?: INotificationsChannelBackendConfig,
): INotificationsResourceBackendConfig => {
  const enabledNotificationsConfig = notificationsConfig;
  if (enabledNotificationsConfig.channels && !enabledNotificationsConfig.channels.includes(validChannelName)) {
    enabledNotificationsConfig.channels.push(validChannelName);
    if (channelConfig) {
      enabledNotificationsConfig.channelConfig[validChannelName] = channelConfig;
    }
    return enabledNotificationsConfig;
  }
  throw new AmplifyError('ConfigurationError', {
    message: `Failed to enable notification channel: ${validChannelName}`,
    details: `Invalid notificationsConfig: ${JSON.stringify(enabledNotificationsConfig, null, 2)}`,
    resolution: `Provide valid notification channel config`,
  });
};

/**
 * disables notification channel config in the backend-config
 */
export const disableNotificationsChannel = (
  notificationsConfig: INotificationsResourceBackendConfig,
  validChannelName: string,
): INotificationsResourceBackendConfig => {
  const disabledNotificationsConfig = notificationsConfig;
  if (notificationsConfig.channels?.includes(validChannelName)) {
    disabledNotificationsConfig.channels = notificationsConfig.channels.filter((channelName) => channelName !== validChannelName);
    if (notificationsConfig.channelConfig && validChannelName in disabledNotificationsConfig.channelConfig) {
      delete disabledNotificationsConfig.channelConfig[validChannelName];
    }
    return disabledNotificationsConfig;
  }
  throw new AmplifyError('ConfigurationError', {
    message: `Failed to disable notification channel: ${validChannelName}`,
    details: `Invalid notificationsConfig: ${JSON.stringify(disabledNotificationsConfig, null, 2)}`,
    resolution: `Provide valid notification channel config`,
  });
};

/**
 * updates notification channel config in the backend-config
 */
export const updateNotificationsChannelConfig = (
  notificationsConfig: INotificationsResourceBackendConfig,
  validChannelName: string,
  channelConfig: INotificationsChannelBackendConfig,
): INotificationsResourceBackendConfig => {
  const updatedNotificationsConfig = notificationsConfig;
  if (updatedNotificationsConfig.channels && !updatedNotificationsConfig.channels.includes(validChannelName)) {
    updatedNotificationsConfig.channels = updatedNotificationsConfig.channels.filter((channelName) => channelName !== validChannelName);
    if (notificationsConfig.channelConfig) {
      updatedNotificationsConfig.channelConfig[validChannelName] = channelConfig;
    }
    return notificationsConfig;
  }

  throw new AmplifyError('ConfigurationError', {
    message: `Failed to update notification channel config`,
    details: `Invalid notificationsConfig: ${JSON.stringify(notificationsConfig, null, 2)}`,
    resolution: `Provide valid notification channel config`,
  });
};
