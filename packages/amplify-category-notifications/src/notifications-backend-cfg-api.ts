/* eslint-disable max-classes-per-file */
/* eslint-disable import/no-cycle */
/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
import {
  $TSAny, pathManager, stateManager, AmplifySupportedService, AmplifyCategories, $TSContext,
} from 'amplify-cli-core';
import {
  ChannelAction, IChannelAPIResponse,
} from './notifications-api-types';
import { ChannelAPI } from './notifications-backend-cfg-channel-api';
import { INotificationsResourceBackendConfig, INotificationsResourceBackendConfigValue } from './notifications-backend-config-types';
import { NotificationsMeta } from './notifications-meta-api';

const PROVIDER_NAME = 'awscloudformation';

/**
 * Persistent state management class for Notifications.
 * Updates amplify-meta.json, backend-config.json
 * TBD: updates to amplify-exports.js, cli-inputs.json
 */
export class NotificationsDB {
  public static ChannelAPI = ChannelAPI;

  public static updateChannelAPIResponse = async (context : $TSContext, channelAPIResponse: IChannelAPIResponse):Promise<$TSContext> => {
    let notificationConfig = await NotificationsDB.getNotificationsAppConfig(context.exeInfo.backendConfig);
    if (notificationConfig) {
      switch (channelAPIResponse.action) {
        case ChannelAction.ENABLE:
          if (notificationConfig.channels && !notificationConfig.channels.includes(channelAPIResponse.channel)) {
            notificationConfig = ChannelAPI.enableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
            context.exeInfo.amplifyMeta = await NotificationsMeta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, true,
              context.exeInfo.amplifyMeta);
          }
          break;
        case ChannelAction.DISABLE:
          if (notificationConfig.channels && notificationConfig.channels.includes(channelAPIResponse.channel)) {
            notificationConfig = ChannelAPI.disableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
          }
          context.exeInfo.amplifyMeta = await NotificationsMeta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, false,
            context.exeInfo.amplifyMeta);
          break;
        case ChannelAction.CONFIGURE:
          console.log(`Error: Channel action ${channelAPIResponse.action} not supported`);
          break;
        case ChannelAction.PULL:
          console.log(`Error: Channel action ${channelAPIResponse.action} not supported`);
          break;
        default:
          console.log(`Error: Channel action ${channelAPIResponse.action} not supported`);
          break;
      }
      context.exeInfo.backendConfig[AmplifyCategories.NOTIFICATIONS][notificationConfig.serviceName] = notificationConfig;
    }
    // console.log('SACPCDEBUG: UpdateChannelAPIResponse : context.exeInfo.backendConfig : ',
    //  JSON.stringify(context.exeInfo.backendConfig[AmplifyCategories.NOTIFICATIONS], null, 2));
    // console.log('SACPCDEBUG: UpdateChannelAPIResponse : context.exeInfo.amplifyMeta.notifications : ',
    //  JSON.stringify(context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS], null, 2));
    return context;
  }

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
  * Get all enabled channels in backend config
  * This is required for Pinpoint resources updated in Analytics CFN but not yet pushed
  */
  public static getEnabledChannelsFromBackendConfig = async (notificationsConfig?: INotificationsResourceBackendConfig)
  :Promise<Array<string>> => {
    const tmpNotificationsCfg = (notificationsConfig) || await NotificationsDB.getNotificationsAppConfig();
    let enabledChannels: Array<string> = [];
    if (tmpNotificationsCfg) {
      enabledChannels = ChannelAPI.getNotificationChannelEnabledInBackendConfig(tmpNotificationsCfg);
    }
    return enabledChannels;
  };

/**
 * Get all notifications channel which are not in use in the Backend Config
 * @returns array of channels which are not in use
 */
public static getDisabledChannelsFromBackendConfig = async (availableChannels?: Array<string>,
  enabledChannels?: Array<string>): Promise<Array<string>> => {
  let result : Array<string> = [];
  const tmpEnabledChannels = (enabledChannels) || await NotificationsDB.getEnabledChannelsFromBackendConfig();
  const tmpAvailableChannels = (availableChannels) || ChannelAPI.getAvailableChannels();
  if (!tmpAvailableChannels) {
    return result;
  }
  result = tmpAvailableChannels.filter(channelName => !tmpEnabledChannels.includes(channelName));
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
 public static addPartialNotificationsBackendConfig = async (pinpointResourceName: string, backendConfig? : $TSAny):Promise<$TSAny> => {
   const projectPath = pathManager.findProjectRoot();
   const tmpBackendConfig = backendConfig || stateManager.getBackendConfig(projectPath);
   const emptyResourceConfig : INotificationsResourceBackendConfigValue = {
     service: AmplifySupportedService.PINPOINT,
     channels: [],
     channelConfig: {},
   };
   let notificationsConfig = tmpBackendConfig[AmplifyCategories.NOTIFICATIONS];

   notificationsConfig = (notificationsConfig) || {
     [pinpointResourceName]: emptyResourceConfig,
   };
   notificationsConfig[pinpointResourceName] = (notificationsConfig[pinpointResourceName]) || emptyResourceConfig;

   tmpBackendConfig[AmplifyCategories.NOTIFICATIONS] = notificationsConfig;
   return tmpBackendConfig;
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
 * @param channelName  Name of the notification channel SMS/InAppMessaging etc.
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
              ...(notificationsConfig[resourceName] as INotificationsResourceBackendConfigValue),
              serviceName: resourceName,
            },
          );
        }
      }
      return notificationsConfigList;
    }
}
