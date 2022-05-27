/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
import {
  $TSAny, pathManager, stateManager, AmplifySupportedService, AmplifyCategories, $TSContext, INotificationsResourceMeta,
} from 'amplify-cli-core';
import { ChannelAction, IChannelAPIResponse } from './notifications-api-types';
import { INotificationsResourceBackendConfig, INotificationsResourceBackendConfigValue } from './notifications-backend-config-types';
import { NotificationsMeta } from './notifications-meta-api';

const PROVIDER_NAME = 'awscloudformation';

/**
 * Persistent state management class for Notifications.
 * Updates amplify-meta.json, backend-config.json
 * TBD: updates to amplify-exports.js, cli-inputs.json
 */
export class NotificationsDB {
  /**
   * Map of channel-type to channel-code
   */
  public static channelWorkers: Record<string, string> = {
    APNS: './channel-APNS',
    FCM: './channel-FCM',
    Email: './channel-Email',
    SMS: './channel-SMS',
    InAppMsg: './channel-in-app-msg',
    PushNotification: './channel-push-notification',
  };

  public static updateChannelAPIResponse = async (context : $TSContext, channelAPIResponse: IChannelAPIResponse):Promise<$TSContext> => {
    const notificationConfig = await NotificationsDB.getNotificationsAppConfig(context.exeInfo.backendConfig);
    console.log('SACPCDEBUG: UpdateChannelAPIResponse : ', JSON.stringify(channelAPIResponse, null, 2));
    if (notificationConfig) {
      switch (channelAPIResponse.action) {
        case ChannelAction.ENABLE:
          if (notificationConfig.channels && !notificationConfig.channels.includes(channelAPIResponse.channel)) {
            notificationConfig.channels.push(channelAPIResponse.channel);
            context.exeInfo.amplifyMeta = await NotificationsMeta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, true,
              context.exeInfo.amplifyMeta);
          }
          break;
        case ChannelAction.DISABLE:
          if (notificationConfig.channels && notificationConfig.channels.includes(channelAPIResponse.channel)) {
            notificationConfig.channels = notificationConfig.channels.filter(channelName => channelName !== channelAPIResponse.channel);
            context.exeInfo.amplifyMeta = await NotificationsMeta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, false,
              context.exeInfo.amplifyMeta);
          }
          break;
        case ChannelAction.CONFIGURE:
          break;
        case ChannelAction.PULL:
          break;
        default:
          console.log(`Error: Channel action ${channelAPIResponse.action} not supported`);
          break;
      }
      context.exeInfo.backendConfig[AmplifyCategories.NOTIFICATIONS][notificationConfig?.serviceName] = notificationConfig;
    }
    console.log('SACPCDEBUG: UpdateChannelAPIResponse : context.exeInfo.backendConfig : ',
      JSON.stringify(context.exeInfo.backendConfig, null, 2));
    console.log('SACPCDEBUG: UpdateChannelAPIResponse : context.exeInfo.amplifyMeta : ',
      JSON.stringify(context.exeInfo.amplifyMeta, null, 2));
    return context;
  }

  /**
 * Get all available notification channels
 */
 public static getAvailableChannels = ():Array<string> => Object.keys(NotificationsDB.channelWorkers);

 /**
   * Get Notifications App from 'notifications' category  of backend-config.json
   * @param backendConfig optionally provide backendConfig object read from the file.
   * @returns Notifications meta partially defined in INotificationsResourceMeta
   */
   public static getNotificationsAppConfig= async (backendConfig?:$TSAny): Promise<INotificationsResourceBackendConfig|undefined> => {
     const notificationConfigList = await NotificationsDB.getNotificationsAppConfigList(backendConfig);
     if (notificationConfigList) {
       const notificationsConfig:INotificationsResourceBackendConfig = notificationConfigList[0];
       return notificationsConfig;
     }
     return undefined;
   }

   /**
 * Check if notification channel has been added to the backend-config
 * @param resourceBackendConfig - Backend config for the given pinpoint resource from backend-config.json
 * @param channel - Notification channel to be checked for.
 * @returns true if channel is enabled in backend-config
 */
  public static isNotificationChannelEnabledInBackendConfig = (resourceBackendConfig: INotificationsResourceBackendConfig,
    channel: string):boolean => resourceBackendConfig.channels && resourceBackendConfig.channels.includes(channel);

  public static getNotificationChannelEnabledInBackendConfig = (resourceBackendConfig: INotificationsResourceBackendConfig)
  :Array<string> => resourceBackendConfig.channels

  /**
  * Get all enabled channels in backend config
  * This is required for Pinpoint resources updated in Analytics CFN but not yet pushed
  */
  public static getEnabledChannelsFromBackendConfig = async (): Promise<Array<string>> => {
    const tmpNotificationsCfg = await NotificationsDB.getNotificationsAppConfig();
    let enabledChannels: Array<string> = [];
    if (tmpNotificationsCfg) {
      enabledChannels = NotificationsDB.getNotificationChannelEnabledInBackendConfig(tmpNotificationsCfg);
    }
    return enabledChannels;
  };

/**
 * Get all notifications channel which are not in use in the Backend Config
 * @returns array of channels which are not in use
 */
public static getDisabledChannelsFromBackendConfig = async (availableChannels?: Array<string>): Promise<Array<string>> => {
  const result : Array<string> = [];
  const enabledChannels = await NotificationsDB.getEnabledChannelsFromBackendConfig();
  const tmpAvailableChannels = (availableChannels) ? NotificationsDB.getAvailableChannels() : availableChannels;
  if (!tmpAvailableChannels) {
    return result;
  }
  tmpAvailableChannels.forEach(channel => {
    if (!enabledChannels.includes(channel)) {
      result.push(channel);
    }
  });
  return result;
};

  /**
   * Check if notification resource has been created in backend-config
   * @param resourceBackendConfig - Backend config for the given pinpoint resource from backend-config.json
   * @returns true if Pinpoint resource has been created in backend-config
   */
  public static isNotificationsResourceCreatedInBackendConfig = (resourceBackendConfig: INotificationsResourceBackendConfig)
  :boolean => resourceBackendConfig.service === AmplifySupportedService.PINPOINT;

 /**
 * Create a new Pinpoint resource in backend-config for Notifications category.
 * @param pinpointResourceName Name of the pinpoint resource from Analytics
 * @returns backendConfig for reference
 */
 public static addPartialNotificationsBackendConfig = async (pinpointResourceName: string):Promise<$TSAny> => {
   const projectPath = pathManager.findProjectRoot();
   const backendConfig = stateManager.getBackendConfig(projectPath);
   const resourceConfig : INotificationsResourceBackendConfigValue = {
     service: AmplifySupportedService.PINPOINT,
     channels: [],
     channelConfig: {},
   };

   if (!backendConfig[AmplifyCategories.NOTIFICATIONS]
       || !backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName]) {
     backendConfig[AmplifyCategories.NOTIFICATIONS] = {
       [pinpointResourceName]: resourceConfig,
     };
     // TBD: Remove this - state is saved at the end
     //  stateManager.setBackendConfig(projectPath, backendConfig);
     console.log('SACPCDEBUG:[InMemory] Saved BackendConfig : ', JSON.stringify(backendConfig, null, 2));
   }
   return backendConfig;
 };

 /**
 * Given the application region, get the closest pinpoint region
 * @param context  application context
 * @returns pinpoint region
 */
  public static getPinpointRegionMapping = (context: $TSContext): string|undefined => {
    const projectPath = pathManager.findProjectRoot();
    const applicationRegion = stateManager.getCurrentRegion(projectPath);
    if (!applicationRegion) {
      throw Error(`Invalid Region for project at ${projectPath}`);
    }
    const providerPlugin = require(context.amplify.getProviderPlugins(context)[PROVIDER_NAME]);
    const regionMapping: Record<string, string> = providerPlugin.getPinpointRegionMapping();
    return (applicationRegion in regionMapping) ? regionMapping[applicationRegion] : undefined;
  };

  /**
 * Query BackendConfig to check if notification channel has be been updated.
 * note: - amplify-meta.json will be updated after deployment
 * @param channelName  Name of the notification channel SMS/InAppMsg etc.
 */
   public static isChannelEnabledNotificationsBackendConfig = async (channelName: string): Promise<boolean> => {
     const backendConfig = stateManager.getBackendConfig();
     const notificationResources = backendConfig[AmplifyCategories.NOTIFICATIONS];
     if (!notificationResources) {
       return false;
     }
     for (const resourceName of Object.keys(notificationResources)) {
       if (notificationResources[resourceName].service === AmplifySupportedService.PINPOINT) {
         return notificationResources[resourceName].channels && notificationResources[resourceName].channels.includes(channelName);
       }
     }
     return false;
   };

    /**
   * [Internal] Get the Notifications resources from backend-config.json
   * @returns List of Backend configs
   */
    protected static getNotificationsAppConfigList = async (backendConfig?: $TSAny, appName?: string)
    : Promise<INotificationsResourceBackendConfig[]> => {
      const tmpBackendConfig = (backendConfig) || stateManager.getBackendConfig();
      const notificationsConfig = tmpBackendConfig[AmplifyCategories.NOTIFICATIONS];
      const notificationsConfigList: Array<INotificationsResourceBackendConfig> = [];
      for (const resourceName of Object.keys(notificationsConfig)) {
        if (!appName || appName === resourceName) {
          notificationsConfigList.push(
            {
              serviceName: resourceName,
              ...(notificationsConfig[resourceName] as INotificationsResourceBackendConfigValue),
            },
          );
        }
      }
      return notificationsConfigList;
    }
}
