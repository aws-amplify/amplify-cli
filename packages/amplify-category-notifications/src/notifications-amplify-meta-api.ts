/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
import {
  $TSAny, stateManager, AmplifySupportedService, AmplifyCategories, $TSMeta, $TSContext, INotificationsResourceMeta, pathManager,
} from 'amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { invokeGetLastPushTimeStamp } from './plugin-client-api-analytics';
import { ChannelCfg } from './notifications-backend-cfg-channel-api';

/**
 * Persistent state management class for Notifications.
 * Updates amplify-meta.json, backend-config.json
 * TBD: updates to amplify-exports.js, cli-inputs.json
 */
export class NotificationsMeta {
  /**
   * Set NotificationsMeta.output.channel.Enabled to true/false
   * @param channelName channelName which needs to be enabled/disabled
   * @param isEnabled true if channel is enabled
   * @param amplifyMeta In-memory CLI amplifyMeta
   * @param appName Pinpoint appName
   * @returns updated amplify meta (with the given channel enabled/disabled)
   */
  public static toggleNotificationsChannelAppMeta = async (channelName:string, isEnabled:boolean,
    amplifyMeta?:$TSMeta, appName?:string): Promise<$TSMeta> => {
    const tmpAmplifyMeta:$TSMeta = amplifyMeta;
    const notificationsAppMeta = await NotificationsMeta.getNotificationsAppMeta(tmpAmplifyMeta, appName);
    if (notificationsAppMeta) {
      const channelOutput = (notificationsAppMeta.output) || {};
      const channelValue = (channelOutput[channelName]) || {};
      notificationsAppMeta.output = (notificationsAppMeta.output) || {};
      notificationsAppMeta.output[channelName] = {
        ...channelValue,
        Enabled: isEnabled,
        ApplicationId: channelOutput.Id,
      };

      // To mark notifications as UPDATED, we need a timestamp in the past.
      // Any update to Notifications will result in updating the Analytics resource.
      // syncing the timestamp from analytics.
      if (!notificationsAppMeta.lastPushTimeStamp) {
        const analyticsLastPushTimeStamp = await invokeGetLastPushTimeStamp(tmpAmplifyMeta, notificationsAppMeta.ResourceName);
        if (analyticsLastPushTimeStamp) {
          notificationsAppMeta.lastPushTimeStamp = analyticsLastPushTimeStamp;
          notificationsAppMeta.lastPushDirHash = (notificationsAppMeta.lastPushDirHash)
        || NotificationsMeta.oneAtATimeJenkinsHash(JSON.stringify(notificationsAppMeta));
        }
      }

      tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][notificationsAppMeta.ResourceName] = notificationsAppMeta;
    }

    return tmpAmplifyMeta;
  }

  // Move this to library
  // https://en.wikipedia.org/wiki/Jenkins_hash_function
  protected static oneAtATimeJenkinsHash = (keyString: string):string => {
    let hash = 0;
    for (let charIndex = 0; charIndex < keyString.length; ++charIndex) {
      hash += keyString.charCodeAt(charIndex);
      hash += hash << 10;
      hash ^= hash >> 6;
    }
    hash += hash << 3;
    hash ^= hash >> 11;
    // 4,294,967,295 is FFFFFFFF, the maximum 32 bit unsigned integer value, used here as a mask.
    return (((hash + (hash << 15)) & 4294967295) >>> 0).toString(16);
  };

  protected static PINPOINT_PROVIDER_NAME = 'awscloudformation';

  /**
   * Get Notifications App from 'notifications' category  of amplify-meta.json
   * @param amplifyMeta optionally provide amplify meta
   * @returns Notifications meta partially defined in INotificationsResourceMeta
   */
  public static getNotificationsAppMeta = async (amplifyMeta?:$TSMeta, appName?:string): Promise<INotificationsResourceMeta|undefined> => {
    const notificationResourceList = await NotificationsMeta.getNotificationsAppListMeta(amplifyMeta, appName);
    return (notificationResourceList.length > 0) ? notificationResourceList[0] : undefined;
  }

  /**
   * Remove the Notifications category from AmplifyMeta
   * @param context amplify meta
   * @returns amplify cli context (with no Notifications category in AmplifyMeta)
   */
  public static removeNotificationsAppMeta = async (context: $TSContext) : Promise<$TSContext> => {
    const amplifyMeta = (context.exeInfo.amplifyMeta) || stateManager.getMeta();
    if (AmplifyCategories.NOTIFICATIONS in amplifyMeta) {
      delete amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    }
    context.exeInfo.amplifyMeta = amplifyMeta;
    return context;
  }

   /**
    * Check if Notifications is migrated from AWS Mobile Hub
    * @param amplifyMeta optionally provide amplifyMeta
    * @returns true if Notifications is migrated from AWS Mobile Hub
    */
   public static checkMigratedFromMobileHub = async (amplifyMeta?:$TSMeta): Promise<boolean> => {
     const notificationAppMeta: INotificationsResourceMeta|undefined = await NotificationsMeta.getNotificationsAppMeta(amplifyMeta);
     return !!(notificationAppMeta?.mobileHubMigrated);
   }

   /**
    * This is the legacy logic to check AWS Mobile Hub.
    * note: This needs to be re-enabled if any older file-types are discovered to be supported.
    * @param amplifyMeta optionally provide amplifyMeta
    * @returns true if Notifications is migrated from AWS Mobile Hub
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
  :boolean => notificationsResourceMeta.output
              && channelName in notificationsResourceMeta.output
              && notificationsResourceMeta.output[channelName].Enabled

/**
 * Get the enabled channels from the notifications table of amplify-meta.json
 * @returns array of enabled notification channels from amplify-meta.json
 */
public static getEnabledChannelsFromAppMeta = async (amplifyMeta?: $TSAny): Promise<Array<string>> => {
  let enabledChannelList :Array<string> = [];
  const tmpAmplifyMeta = (amplifyMeta) || stateManager.getMeta();
  const availableChannels = ChannelCfg.getAvailableChannels();
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
   const disabledChannelList : Array<string> = [];
   const availableChannels = ChannelCfg.getAvailableChannels();
   const enabledChannels = await NotificationsMeta.getEnabledChannelsFromAppMeta(amplifyMeta);
   availableChannels.forEach(channel => {
     if (!enabledChannels.includes(channel)) {
       disabledChannelList.push(channel);
     }
   });
   return disabledChannelList;
 };

 /**
 * Given the application region, get the closest pinpoint region
 * @param context  application context
 * @returns pinpoint region
 */
public static getPinpointRegionMapping = async (context: $TSContext): Promise<string|undefined> => {
  const projectPath = pathManager.findProjectRoot();
  const applicationRegion = stateManager.getCurrentRegion(projectPath);
  if (!applicationRegion) {
    throw Error(`Invalid Region for project at ${projectPath}`);
  }
  const providerPlugin = await import(context.amplify.getProviderPlugins(context)[NotificationsMeta.PINPOINT_PROVIDER_NAME]);
  const regionMapping: Record<string, string> = providerPlugin.getPinpointRegionMapping();
  return (applicationRegion in regionMapping) ? regionMapping[applicationRegion] : undefined;
};

/**
   * Create partial Notifications resource in Amplify Meta. The fields will be populated in post-push state
   * @param context
   * @param notificationResourceName
   * @returns
   */

 public static addPartialNotificationsAppMeta = async (context: $TSContext, notificationResourceName: string):Promise<$TSMeta> => {
   let updatedAmplifyMeta = await stateManager.getMeta();
   const pinpointRegion = await NotificationsMeta.getPinpointRegionMapping(context);
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
   const envName: string = stateManager.getCurrentEnvName() as string;
   let updatedAmplifyMeta:$TSMeta = amplifyMeta;
   const partialPinpointOutput: Partial<ICategoryMeta> = {
     Id: undefined,
     Region: pinpointRegion,
     Name: `${resourceName}-${envName}`,
   };
   // save partial results in Amplify-meta. Identify related values will be placed after amplify push
   updatedAmplifyMeta = NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, partialPinpointOutput);
   return updatedAmplifyMeta;
 };

 /**
 * Create the Notifications resource meta
 * section in amplifyMeta
 * @param amplifyMeta amplify-meta.json's in-memory state
 * @param resourceName Pinpoint resource for notifications
 * @param pinpointOutput Pinpoint resource metadata base class
 */
 public static constructResourceMeta = (amplifyMeta : $TSMeta, resourceName: string, pinpointOutput: Partial<ICategoryMeta>):void => {
   const tmpAmplifyMeta = amplifyMeta;
   if (!tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
     tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS] = { [resourceName]: { output: {} } };
   }
   tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
     ...tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName],
     service: AmplifySupportedService.PINPOINT,
     output: {
       ...tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName].output,
       ...pinpointOutput,
     },
     lastPushTimeStamp: new Date(),
   };
   return tmpAmplifyMeta;
 };

 /**
   * [Internal] Get the Notifications resources from amplify-meta.json
   * @returns List of notifications resources
   */
    protected static getNotificationsAppListMeta= async (amplifyMeta?:$TSMeta, appName?:string)
    :Promise<Array<INotificationsResourceMeta>> => {
      const tmpMeta = (amplifyMeta) || await stateManager.getMeta();
      const notificationsMeta = tmpMeta[AmplifyCategories.NOTIFICATIONS];
      const notificationsResourceList: Array<INotificationsResourceMeta> = [];
      if (notificationsMeta) {
        for (const resourceName of Object.keys(notificationsMeta)) {
          if ((!appName || appName === resourceName)) {
            const notificationsResourceMeta :$TSAny = notificationsMeta[resourceName];
            notificationsResourceList.push({
              Id: notificationsResourceMeta.output.Id,
              ResourceName: resourceName,
              Name: notificationsResourceMeta.output.Name, // {ResourceName}-{env}
              service: (notificationsResourceMeta.service) || AmplifySupportedService.PINPOINT,
              Region: notificationsResourceMeta.output.Region, // Region in which Notifications resource is deployed.
              output: notificationsResourceMeta.output, // TBD: validate output
              ...notificationsResourceMeta, // TBD: remove if not needed
            } as INotificationsResourceMeta);
          }
        }
      }
      return notificationsResourceList;
    }
}
