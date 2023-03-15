import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyError,
  AmplifySupportedService,
  INotificationsResourceMeta,
  stateManager,
} from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { IChannelAPIResponse, ChannelAction, INotificationsConfigStatus } from './channel-types';
import { PinpointName } from './pinpoint-name';
import { disableNotificationsChannel, enableNotificationsChannel, getChannelAvailability } from './notifications-backend-cfg-channel-api';
import { toggleNotificationsChannelAppMeta } from './notifications-amplify-meta-api';
import { getCurrentNotificationsAppConfig, getNotificationsAppConfig } from './notifications-backend-cfg-api';

/**
 * Notifications Persistent state management API.
 * Cfg = API to interact with configuration in BackendConfig,
 * Meta = API to interact with deployment metadata in AmplifyMeta
 */

const buildPartialChannelMeta = (channelNames: Array<string>): Record<string, $TSAny> | undefined => {
  const partialOutput: Record<string, $TSAny> = {};
  for (const channelName of channelNames) {
    partialOutput[channelName] = { Enabled: true };
  }
  return Object.keys(partialOutput).length > 0 ? partialOutput : undefined;
};

/**
 * configures name, regulatedName (without env)
 * @param envName - Name of the environment to be used for the notifications.
 * @param cfg Pinpoint resource config in BackendConfig for the environment.
 * @returns Pinpoint resource meta to be stored in amplify-meta.
 */
export const generateMetaFromConfig = (envName: string, cfg: $TSAny): Partial<INotificationsResourceMeta> => {
  const outputRecords: Record<string, $TSAny> | undefined =
    cfg?.channels?.length && cfg.channels.length > 0 ? buildPartialChannelMeta(cfg.channels) : undefined;
  if (cfg.resourceName === undefined) {
    throw new AmplifyError('ConfigurationError', {
      message: 'Pinpoint resource name is missing in the backend config',
    });
  }
  const notificationsMeta: Partial<INotificationsResourceMeta> = {
    Name: PinpointName.generatePinpointAppName(cfg.resourceName, envName), // Env specific resource name
    ResourceName: cfg.resourceName, // Logical name of Notifications App.
    service: cfg.service || AmplifySupportedService.PINPOINT, // AWS Service e.g Pinpoint
  };
  if (outputRecords) {
    notificationsMeta.output = outputRecords;
  }
  return notificationsMeta;
};

/**
 * update channel api response
 */
export const updateChannelAPIResponse = async (context: $TSContext, channelAPIResponse: IChannelAPIResponse): Promise<$TSContext> => {
  let notificationConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
  if (notificationConfig) {
    switch (channelAPIResponse.action) {
      case ChannelAction.ENABLE:
        if (notificationConfig.channels && !notificationConfig.channels.includes(channelAPIResponse.channel)) {
          notificationConfig = enableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
          context.exeInfo.amplifyMeta = await toggleNotificationsChannelAppMeta(
            channelAPIResponse.channel,
            true,
            context.exeInfo.amplifyMeta,
          );
        }
        break;
      case ChannelAction.DISABLE:
        if (notificationConfig.channels?.includes(channelAPIResponse.channel)) {
          notificationConfig = disableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
        }
        context.exeInfo.amplifyMeta = await toggleNotificationsChannelAppMeta(
          channelAPIResponse.channel,
          false,
          context.exeInfo.amplifyMeta,
        );
        break;
      case ChannelAction.CONFIGURE:
        // no-op - configure calls enable or disable
        break;
      case ChannelAction.PULL:
      default:
        printer.error(`Error: Channel action ${channelAPIResponse.action} not supported`);
        break;
    }
    context.exeInfo.backendConfig[AmplifyCategories.NOTIFICATIONS][notificationConfig.serviceName] = notificationConfig;
  }
  return context;
};

/**
 * Get notifications resource localBackend, deployedBackend and channel availability
 * most useful in displaying status.
 * @param context amplify cli context
 * @returns backendConfig and channel availability for notifications
 */
export const getNotificationConfigStatus = async (context: $TSContext): Promise<INotificationsConfigStatus | undefined> => {
  const notificationConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);

  // no Notifications resource
  if (!notificationConfig) {
    return undefined;
  }
  let appInitialized = true;
  let deployedBackendConfig: $TSAny;
  try {
    deployedBackendConfig = stateManager.getCurrentBackendConfig() || undefined;
  } catch (e) {
    appInitialized = false;
    deployedBackendConfig = undefined;
  } // this will fail on iniEnv;

  const deployedNotificationConfig = await getCurrentNotificationsAppConfig(deployedBackendConfig);
  const emptyChannels = { enabledChannels: [], disabledChannels: [] };
  return {
    local: {
      config: notificationConfig,
      channels: await getChannelAvailability(notificationConfig),
    },
    deployed: {
      config: deployedNotificationConfig,
      channels: deployedNotificationConfig ? await getChannelAvailability(deployedNotificationConfig) : emptyChannels,
    },
    appInitialized,
  } as INotificationsConfigStatus;
};
