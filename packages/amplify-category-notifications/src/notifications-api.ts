import {
  $TSAny, $TSContext, AmplifyCategories, stateManager,
} from 'amplify-cli-core';
import { ChannelCfg } from './notifications-backend-cfg-channel-api';
import { NotificationsMeta } from './notifications-amplify-meta-api';
import { NotificationsCfg } from './notifications-backend-cfg-api';
import { IChannelAPIResponse, ChannelAction, INotificationsConfigStatus } from './channel-types';

/**
 * Notifications Persistent state management API.
 * Cfg = API to interact with configuration in BackendConfig,
 * ChannelCfg = API to interact specifically with Notifications Channel config data in BackendConfig.
 * Meta = API to interact with deployment metadata in AmplifyMeta
 */
export class Notifications {
    public static ChannelCfg = ChannelCfg;
    public static Cfg = NotificationsCfg;
    public static Meta = NotificationsMeta;
    public static updateChannelAPIResponse = async (context : $TSContext, channelAPIResponse: IChannelAPIResponse):Promise<$TSContext> => {
      let notificationConfig = await Notifications.Cfg.getNotificationsAppConfig(context.exeInfo.backendConfig);
      if (notificationConfig) {
        switch (channelAPIResponse.action) {
          case ChannelAction.ENABLE:
            if (notificationConfig.channels && !notificationConfig.channels.includes(channelAPIResponse.channel)) {
              notificationConfig = ChannelCfg.enableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
              context.exeInfo.amplifyMeta = await Notifications.Meta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, true,
                context.exeInfo.amplifyMeta);
            }
            break;
          case ChannelAction.DISABLE:
            if (notificationConfig.channels && notificationConfig.channels.includes(channelAPIResponse.channel)) {
              notificationConfig = ChannelCfg.disableNotificationsChannel(notificationConfig, channelAPIResponse.channel);
            }
            context.exeInfo.amplifyMeta = await Notifications.Meta.toggleNotificationsChannelAppMeta(channelAPIResponse.channel, false,
              context.exeInfo.amplifyMeta);
            break;
          case ChannelAction.CONFIGURE:
            // no-op - configure calls enable or disable
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
    };

    /**
    * Get notifications resource localBackend, deployedBackend and channel availability
    * most useful in displaying status.
    * @param context amplify cli context
    * @returns backendConfig and channel availability for notifications
    */
    public static getNotificationConfigStatus = async (context:$TSContext): Promise<INotificationsConfigStatus|undefined> => {
      const notificationConfig = await Notifications.Cfg.getNotificationsAppConfig(context.exeInfo.backendConfig);

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

      const deployedNotificationConfig = await NotificationsCfg.getCurrentNotificationsAppConfig(deployedBackendConfig);
      const emptyChannels = { enabledChannels: [], disabledChannels: [] };
      return {
        local: {
          config: notificationConfig,
          channels: (notificationConfig) ? await ChannelCfg.getChannelAvailability(notificationConfig) : emptyChannels,
        },
        deployed: {
          config: deployedNotificationConfig,
          channels: (deployedNotificationConfig) ? await ChannelCfg.getChannelAvailability(deployedNotificationConfig) : emptyChannels,
        },
        appInitialized,
      } as INotificationsConfigStatus;
    };
}
