/* eslint-disable spellcheck/spell-checker */
/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
import {
  $TSAny, stateManager, AmplifySupportedService, AmplifyCategories, $TSMeta, $TSContext, INotificationsResourceMeta,
} from 'amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { NotificationsDB } from './notifications-backend-cfg-api';

/**
 * Persistent state management class for Notifications.
 * Updates amplify-meta.json, backend-config.json
 * TBD: updates to amplify-exports.js, cli-inputs.json
 */
export class NotificationsMeta {
  /**
   * Get Notifications App from 'notifications' category  of amplify-meta.json
   * @param amplifyMeta optionally provide amplify meta
   * @returns Notifications meta partially defined in INotificationsResourceMeta
   */
  public static getNotificationsAppMeta = async (amplifyMeta?:$TSMeta, appName?:string): Promise<INotificationsResourceMeta|undefined> => {
    const notificationResourceList = await NotificationsMeta.getNotificationsAppListMeta(amplifyMeta, appName);
    console.log('SACPCDEBUG:getNotificationsAppMeta : ', JSON.stringify(notificationResourceList, null, 2));
    if (notificationResourceList.length > 0) {
      const notificationsApp:INotificationsResourceMeta = {
        ResourceName: notificationResourceList[0].ResourceName,
        ...notificationResourceList[0].output,
      };
      return notificationsApp;
    }
    return undefined;
  }

   /**
    * Check if Notifications is migrated from mobile-hub
    * @param amplifyMeta optionally provide amplifyMeta
    * @returns true if Notifications is migrated from Mobilehub
    */
   public static checkMigratedFromMobileHub = async (amplifyMeta?:$TSMeta): Promise<boolean> => {
     const notificationAppMeta: INotificationsResourceMeta|undefined = await NotificationsMeta.getNotificationsAppMeta(amplifyMeta);
     return !!(notificationAppMeta?.mobileHubMigrated);
   }

   /**
    * This is the legacy logic to check mobile-hub ( re-enable if any older file-types are discovered to be supported )
    * @param amplifyMeta optionally provide amplifyMeta
    * @returns true if Notifications is migrated from Mobilehub
    */
   public static checkMigratedFromMobileHubLegacy = async (amplifyMeta?:$TSMeta): Promise<boolean> => {
     const tmpMeta = (amplifyMeta) || await stateManager.getMeta();
     const categoryMeta = tmpMeta[AmplifyCategories.NOTIFICATIONS];
     if (categoryMeta) {
       const services = Object.keys(categoryMeta);
       for (let i = 0; i < services.length; i++) {
         const serviceMeta = categoryMeta[services[i]];
         if (serviceMeta.mobileHubMigrated === true) {
           return true;
         }
       }
     }
     return false;
   }

   /**
   * Returns true if given channel has 'Enabled' set as true
   * @param notificationsResourceMeta
   * @param channelName
   * @returns true if given channel has 'Enabled' set as true in amplify-meta.json
   */

  public static isNotificationChannelEnabled = (notificationsResourceMeta: INotificationsResourceMeta, channelName: string)
  :boolean => channelName in notificationsResourceMeta.output && notificationsResourceMeta.output[channelName].Enabled

/**
 * Get the enabled channels from the notifications table of amplify-meta.json
 * @returns array of enabled notification channels from amplify-meta.json
 */
public static getEnabledChannelsFromAppMeta = async (amplifyMeta?: $TSAny): Promise<Array<string>> => {
  let enabledChannelList :Array<string> = [];
  const tmpAmplifyMeta = (amplifyMeta) || stateManager.getMeta();
  const availableChannels = NotificationsDB.getAvailableChannels();
  const notificationsMeta = await NotificationsMeta.getNotificationsAppMeta(tmpAmplifyMeta);

  enabledChannelList = (notificationsMeta)
    ? availableChannels.filter(channel => NotificationsMeta.isNotificationChannelEnabled(notificationsMeta, channel))
    : [];

  return enabledChannelList;
};

/**
 * Get all notification channels which are not in use
 */
 public static getDisabledChannelsFromAmplifyMeta = async (amplifyMeta?: $TSMeta): Promise<Array<string>> => {
   const result : Array<string> = [];
   const availableChannels = NotificationsDB.getAvailableChannels();
   const enabledChannels = await NotificationsMeta.getEnabledChannelsFromAppMeta(amplifyMeta);
   availableChannels.forEach(channel => {
     if (!enabledChannels.includes(channel)) {
       result.push(channel);
     }
   });
   return result;
 };

 /**
   * Create partial Notifications resource in Amplify Meta. The fields will be populated in post-push state
   * @param context
   * @param notificationResourceName
   * @returns
   */

 public static addPartialNotificationsAppMeta = async (context: $TSContext, notificationResourceName: string):Promise<$TSMeta> => {
   let updatedAmplifyMeta = await stateManager.getMeta();
   const pinpointRegion = NotificationsDB.getPinpointRegionMapping(context);
   // update amplify-meta with notifications metadata
   updatedAmplifyMeta = NotificationsMeta.constructPartialNotificationsAppMeta(updatedAmplifyMeta,
     notificationResourceName, pinpointRegion);
   return updatedAmplifyMeta;
 }

 /**
   * Save un-pushed notifications metadata in amplify-meta.json
   * @param amplifyMeta current amplify-meta.json
   * @param resourceName Name of the Pinpoint resource
   * @returns partialPinpointApp ( region + name but no ID)
   */
 public static constructPartialNotificationsAppMeta = (amplifyMeta: $TSMeta, resourceName: string,
   pinpointRegion: string|undefined):Partial<ICategoryMeta> => {
   let updatedAmplifyMeta:$TSMeta = amplifyMeta;
   const partialPinpointApp: Partial<ICategoryMeta> = {
     Id: undefined,
     Region: pinpointRegion,
     Name: resourceName,
   };
   // save partial results in Amplify-meta. Identify related values will be placed after amplify push
   updatedAmplifyMeta = NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, partialPinpointApp);
   return updatedAmplifyMeta;
 };

 /**
 * Create the Notifications resource meta
 * section in amplifyMeta
 * @param amplifyMeta amplify-meta.json's in-memory state
 * @param resourceName Pinpoint resource for notifications
 * @param pinpointApp Pinpoint resource metadata base class
 */
 public static constructResourceMeta = (amplifyMeta : $TSMeta, resourceName: string, pinpointApp: Partial<ICategoryMeta>):void => {
   const tmpAmplifyMeta = amplifyMeta;
   if (!tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
     tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS] = { [resourceName]: {} };
   }
   tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
     service: AmplifySupportedService.PINPOINT,
     output: pinpointApp,
     lastPushTimeStamp: new Date(),
     ...tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName],
   };
   return tmpAmplifyMeta;
 };

 /**
   * [Internal] Get the Notifications resources from amplify-meta.json
   * @returns List of notifications resources
   */
    protected static getNotificationsAppListMeta= async (amplifyMeta?:$TSMeta, appName?:string):Promise<Array<$TSAny>> => {
      const tmpMeta = (amplifyMeta) || await stateManager.getMeta();
      const notificationsMeta = tmpMeta[AmplifyCategories.NOTIFICATIONS];
      const notificationsResourceList: Array<$TSAny> = [];
      if (notificationsMeta) {
        for (const resourceName of Object.keys(notificationsMeta)) {
          if (!appName || appName === resourceName) {
            const notificationsResourceMeta :$TSAny = notificationsMeta[resourceName];
            notificationsResourceList.push({
              ResourceName: resourceName,
              ...notificationsResourceMeta,
            });
          }
        }
      }
      return notificationsResourceList;
    }
}
