import { $TSContext, $TSAny, stateManager } from 'amplify-cli-core';
import * as path from 'path';
import {
  IChannelAvailability, INotificationsConfigStatus, ChannelConfigDeploymentType, IChannelViewInfo,
} from './notifications-api-types';
// eslint-disable-next-line import/no-cycle
import { NotificationsDB } from './notifications-backend-cfg-api';
import { INotificationsResourceBackendConfig, INotificationsChannelBackendConfig } from './notifications-backend-config-types';
/**
 * API to update Notification Channel config state
 * All functions are idempotent (no side effects)
 */
export class ChannelAPI {
    /**
     * Channel names
     */
    public static ChannelType: Record<string, string> = {
      APNS: 'APNS',
      FCM: 'FCM',
      InAppMessaging: 'InAppMessaging',
      Email: 'Email',
      SMS: 'SMS',
    }

    /**
     * Get path to the channel handler from channel-type.
     * !! Its important that the channel handler's module path
     * is relative to the path of this file.
     */
    public static getChannelHandlerPath = (channelName: string): string => `${path.join(__dirname, ChannelAPI.channelViewInfo[channelName].module)}`

    /**
     * Map of channel-type to channel-info. This map will be extended when new notification
     * channels are enabled.
     * note:-
     * All channels with INLINE deployment type would eventually be converted to DEFERRED
     * once CustomLambda callout uses CloudFormation/CDK
     */
      public static channelViewInfo: Record<string, IChannelViewInfo> = {
        [ChannelAPI.ChannelType.APNS]: {
          channelName: ChannelAPI.ChannelType.APNS,
          viewName: 'APNS |  Apple Push Notifications   ',
          help: 'Send Apple push notifications to Pinpoint user segments',
          module: './channel-APNS',
          deploymentType: ChannelConfigDeploymentType.INLINE,
        },
        [ChannelAPI.ChannelType.FCM]: {
          channelName: ChannelAPI.ChannelType.FCM,
          viewName: 'FCM  | » Firebase Push Notifications ',
          // eslint-disable-next-line spellcheck/spell-checker
          help: 'Send Firebase Cloud Messaging push notifications to your Pinpoint user segments',
          module: './channel-FCM',
          deploymentType: ChannelConfigDeploymentType.INLINE,
        },
        [ChannelAPI.ChannelType.InAppMessaging]: {
          channelName: ChannelAPI.ChannelType.InAppMessaging,
          viewName: 'In-App Messaging',
          // eslint-disable-next-line spellcheck/spell-checker
          help: 'Allow application clients in Pinpoint user segment mobile devices to pull engagement messages from Pinpoint',
          module: './channel-InAppMessaging',
          deploymentType: ChannelConfigDeploymentType.DEFERRED,
        },
        [ChannelAPI.ChannelType.Email]: {
          channelName: ChannelAPI.ChannelType.Email,
          viewName: 'Email',
          // eslint-disable-next-line spellcheck/spell-checker
          help: 'Send Email messages to your Pinpoint user segments',
          module: './channel-Email',
          deploymentType: ChannelConfigDeploymentType.INLINE,
        },
        [ChannelAPI.ChannelType.SMS]: {
          channelName: ChannelAPI.ChannelType.SMS,
          viewName: 'SMS',
          // eslint-disable-next-line spellcheck/spell-checker
          help: 'Send SMS messages to your Pinpoint user segments',
          module: './channel-SMS',
          deploymentType: ChannelConfigDeploymentType.INLINE,
        },
      };

      public static isValidChannel = (channelName: string| undefined): boolean => (channelName !== undefined
                                      && channelName in ChannelAPI.ChannelType);

      public static getChannelViewInfo = (channelName: string): IChannelViewInfo => (ChannelAPI.channelViewInfo[channelName]);

      /**
       * Given a channelName display the help string for it.
       * @param channelName  notifications channel for which help needs to be displayed
       * @returns help string for the channel name
       */
      public static getChannelViewHelp = (channelName: string): string => (ChannelAPI.channelViewInfo[channelName].help);

      /**
       * Given a channelName return the user friendly channel name to be displayed
       * @param channelName  notifications channel for which user friendly string needs to be returned.
       */
      public static getChannelViewName = (channelName: string): string => ChannelAPI.channelViewInfo[channelName].viewName;

      /**
       * Given a user friendly channel name, return the channelName which it maps to.
       * @param channelViewString user friendly channel name e.g (Apple Push Notifications)
       * @returns channel name (e.g APN)
       */
      public static getChannelNameFromView = (channelViewString: string): string => {
        for (const channelName of Object.keys(ChannelAPI.ChannelType)) {
          if (ChannelAPI.channelViewInfo[channelName].viewName === channelViewString) {
            return channelName;
          }
        }
        throw new Error(`No channel name found for view ${channelViewString}`);
      };

      /**
       * For a given notifications resource get local and deployed channel availability
       * @param backendResourceConfig notifications resource info from the backend config
       * @returns enabled and disabled channels
       */
      public static getChannelAvailability = async (backendResourceConfig:INotificationsResourceBackendConfig)
      : Promise<IChannelAvailability> => {
        const availableChannels = ChannelAPI.getAvailableChannels();
        const enabledChannels = (await NotificationsDB.getEnabledChannelsFromBackendConfig(backendResourceConfig)) || [];
        const disabledChannels = (await NotificationsDB.getDisabledChannelsFromBackendConfig(availableChannels, enabledChannels)) || [];
        const backend : IChannelAvailability = {
          enabledChannels,
          disabledChannels,
        };
        return backend;
      };

      /**
       * Get notifications resource localBackend, deployedBackend and channel availability
       * most useful in displaying status.
       * @param context amplify cli context
       * @returns backendConfig and channel availability for notifications
       */
      public static getNotificationConfigStatus = async (context:$TSContext): Promise<INotificationsConfigStatus|undefined> => {
        const notificationConfig = await NotificationsDB.getNotificationsAppConfig(context.exeInfo.backendConfig);

        // no Notifications resource
        if (!notificationConfig) {
          return undefined;
        }
        let appInitialized = true;
        let deployedBackendConfig: $TSAny;
        try {
          deployedBackendConfig = (stateManager.getCurrentBackendConfig()) || undefined;
        } catch (e) {
          appInitialized = false;
          deployedBackendConfig = undefined;
        } // this will fail on iniEnv;

        const deployedNotificationConfig = await NotificationsDB.getCurrentNotificationsAppConfig(deployedBackendConfig);
        const emptyChannels = { enabledChannels: [], disabledChannels: [] };
        return {
          local: {
            config: notificationConfig,
            channels: (notificationConfig) ? await ChannelAPI.getChannelAvailability(notificationConfig) : emptyChannels,
          },
          deployed: {
            config: deployedNotificationConfig,
            channels: (deployedNotificationConfig) ? await ChannelAPI.getChannelAvailability(deployedNotificationConfig) : emptyChannels,
          },
          appInitialized,
        } as INotificationsConfigStatus;
      };

      /**
     * Returns true if resource is deployed only during amplify push
     * @param validChannelName - a valid channel name
     * @returns true if channel deployment is handled through amplify push
     */
      public static isChannelDeploymentDeferred = (validChannelName: string): boolean => (
        ChannelAPI.getChannelDeploymentType(validChannelName) === ChannelConfigDeploymentType.DEFERRED
      )

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
   * Get all available notification channels
   */
   public static getAvailableChannels = ():Array<string> => Object.keys(ChannelAPI.ChannelType);

   /**
    * Get user friendly names for all available notification channels
    * @returns user friendly channel names
    */
    public static getAvailableChannelViewNames = ():Array<string> => Object.keys(ChannelAPI.ChannelType).map(ChannelAPI.getChannelViewName);

    /**
     * Get user friendly channel names
     * @param notificationConfig from the BackendConfig
     * @returns array of user friendly channel names
     */
    public static getEnabledChannelViewNames = async (notificationConfig:INotificationsResourceBackendConfig):Promise<string[]> => {
      const enabledChannels = await NotificationsDB.getEnabledChannelsFromBackendConfig(notificationConfig);
      const enabledChannelViewNames = enabledChannels.map(ChannelAPI.getChannelViewName);
      return enabledChannelViewNames;
    }

    /**
    * Get all notifications channels enabled in the backend-config
    * @param context amplify cli context
    * @returns array of enabledChannels
    */
   public static getEnabledChannels = async (context: $TSContext): Promise<Array<string>> => {
     const notificationConfig = await NotificationsDB.getNotificationsAppConfig(context.exeInfo.backendConfig);
     const enabledChannels = (await NotificationsDB.getEnabledChannelsFromBackendConfig(notificationConfig)) || [];
     return enabledChannels;
   }

   public static getChannelDeploymentType =
   (channelName: string): ChannelConfigDeploymentType => ((channelName === ChannelAPI.ChannelType.InAppMessaging)
     ? ChannelConfigDeploymentType.DEFERRED
     : ChannelConfigDeploymentType.INLINE)

    public static enableNotificationsChannel = (notificationsConfig: INotificationsResourceBackendConfig,
      validChannelName: string, channelConfig?: INotificationsChannelBackendConfig):INotificationsResourceBackendConfig => {
      const enabledNotificationsConfig = notificationsConfig;
      if (enabledNotificationsConfig.channels && !enabledNotificationsConfig.channels.includes(validChannelName)) {
        enabledNotificationsConfig.channels.push(validChannelName);
        if (channelConfig) {
          enabledNotificationsConfig.channelConfig[validChannelName] = channelConfig;
        }
        return enabledNotificationsConfig;
      }
      throw new Error(`EnableNotificationsChannel Failed: Invalid notificationsConfig: ${JSON.stringify(enabledNotificationsConfig, null, 2)}`);
    }

    public static disableNotificationsChannel = (notificationsConfig: INotificationsResourceBackendConfig,
      validChannelName: string):INotificationsResourceBackendConfig => {
      const disabledNotificationsConfig = notificationsConfig;
      if (notificationsConfig.channels && notificationsConfig.channels.includes(validChannelName)) {
        disabledNotificationsConfig.channels = notificationsConfig.channels.filter(channelName => channelName !== validChannelName);
        if (notificationsConfig.channelConfig && validChannelName in disabledNotificationsConfig.channelConfig) {
          delete disabledNotificationsConfig.channelConfig[validChannelName];
        }
        return disabledNotificationsConfig;
      }
      throw new Error(`disableNotificationsChannel Failed: Invalid Channel ${validChannelName} notificationsConfig: ${JSON.stringify(disabledNotificationsConfig, null, 2)}`);
    }

    public static updateNotificationsChannelConfig = (notificationsConfig: INotificationsResourceBackendConfig,
      validChannelName: string, channelConfig: INotificationsChannelBackendConfig):INotificationsResourceBackendConfig => {
      const updatedNotificationsConfig = notificationsConfig;
      if (updatedNotificationsConfig.channels && !updatedNotificationsConfig.channels.includes(validChannelName)) {
        updatedNotificationsConfig.channels = updatedNotificationsConfig.channels.filter(channelName => channelName !== validChannelName);
        if (notificationsConfig.channelConfig) {
          updatedNotificationsConfig.channelConfig[validChannelName] = channelConfig;
        }
        return notificationsConfig;
      }
      throw new Error(`UpdateNotificationsChannelConfig Failed: Invalid notificationsConfig: ${JSON.stringify(updatedNotificationsConfig, null, 2)}`);
    }
}
