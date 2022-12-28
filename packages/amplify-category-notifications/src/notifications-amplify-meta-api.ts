/* eslint-disable no-bitwise */
/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
import {
  $TSAny,
  stateManager,
  AmplifySupportedService,
  AmplifyCategories,
  $TSMeta,
  $TSContext,
  INotificationsResourceMeta,
  pathManager,
  AmplifyError,
} from 'amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { invokeGetLastPushTimeStamp } from './plugin-client-api-analytics';
import { getAvailableChannels } from './notifications-backend-cfg-channel-api';

/**
 * Set output.channel.Enabled to true/false
 * @param channelName channelName which needs to be enabled/disabled
 * @param isEnabled true if channel is enabled
 * @param amplifyMeta In-memory CLI amplifyMeta
 * @param appName Pinpoint appName
 * @returns updated amplify meta (with the given channel enabled/disabled)
 */
export const toggleNotificationsChannelAppMeta = async (
  channelName: string,
  isEnabled: boolean,
  amplifyMeta?: $TSMeta,
  appName?: string,
): Promise<$TSMeta> => {
  const tmpAmplifyMeta = amplifyMeta;
  const notificationsAppMeta = await getNotificationsAppMeta(tmpAmplifyMeta, appName);
  if (!notificationsAppMeta) {
    return tmpAmplifyMeta;
  }

  const channelOutput = (notificationsAppMeta.output) || {};
  const channelValue = (channelOutput[channelName]) || {};
  notificationsAppMeta.output = (notificationsAppMeta.output) || {};
  notificationsAppMeta.output[channelName] = {
    ...channelValue,
    Enabled: isEnabled,
    ApplicationId: channelOutput.Id,
    Name: channelOutput.Name,
  };

  // To mark notifications as UPDATED, we need a timestamp in the past.
  // Any update to Notifications will result in updating the Analytics resource.
  // syncing the timestamp from analytics.
  if (!notificationsAppMeta.lastPushTimeStamp) {
    const analyticsLastPushTimeStamp = await invokeGetLastPushTimeStamp(tmpAmplifyMeta, notificationsAppMeta.ResourceName);
    if (analyticsLastPushTimeStamp) {
      notificationsAppMeta.lastPushTimeStamp = analyticsLastPushTimeStamp;
      notificationsAppMeta.lastPushDirHash = (notificationsAppMeta.lastPushDirHash)
      || oneAtATimeJenkinsHash(JSON.stringify(notificationsAppMeta));
    }
  }

  tmpAmplifyMeta[AmplifyCategories.NOTIFICATIONS][notificationsAppMeta.ResourceName] = notificationsAppMeta;

  return tmpAmplifyMeta;
};

// Move this to library
// https://en.wikipedia.org/wiki/Jenkins_hash_function
const oneAtATimeJenkinsHash = (keyString: string):string => {
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

const PINPOINT_PROVIDER_NAME = 'awscloudformation';

/**
 * Get Notifications App from 'notifications' category  of amplify-meta.json
 * @param amplifyMeta optionally provide amplify meta
 * @returns Notifications meta partially defined in INotificationsResourceMeta
 */
export const getNotificationsAppMeta = async (amplifyMeta?:$TSMeta, appName?:string): Promise<INotificationsResourceMeta|undefined> => {
  const notificationResourceList = await getNotificationsAppListMeta(amplifyMeta, appName);
  return (notificationResourceList.length > 0) ? notificationResourceList[0] : undefined;
};

/**
 * Remove the Notifications category from AmplifyMeta
 * @param context amplify meta
 * @returns amplify cli context (with no Notifications category in AmplifyMeta)
 */
export const removeNotificationsAppMeta = async (context: $TSContext) : Promise<$TSContext> => {
  const amplifyMeta = (context.exeInfo.amplifyMeta) || stateManager.getMeta();
  if (AmplifyCategories.NOTIFICATIONS in amplifyMeta) {
    delete amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  }
  context.exeInfo.amplifyMeta = amplifyMeta;
  return context;
};

/**
 * Check if Notifications is migrated from AWS Mobile Hub
 * @param amplifyMeta optionally provide amplifyMeta
 * @returns true if Notifications is migrated from AWS Mobile Hub
 */
export const checkMigratedFromMobileHub = async (amplifyMeta?:$TSMeta): Promise<boolean> => {
  const notificationAppMeta: INotificationsResourceMeta|undefined = await getNotificationsAppMeta(amplifyMeta);
  return !!(notificationAppMeta?.mobileHubMigrated);
};

/**
 * This is the legacy logic to check AWS Mobile Hub.
 * note: This needs to be re-enabled if any older file-types are discovered to be supported.
 * @param amplifyMeta optionally provide amplifyMeta
 * @returns true if Notifications is migrated from AWS Mobile Hub
 */
export const checkMigratedFromMobileHubLegacy = async (amplifyMeta?:$TSMeta): Promise<boolean> => {
  const tmpMeta = (amplifyMeta) || await stateManager.getMeta();
  const categoryMeta = tmpMeta[AmplifyCategories.NOTIFICATIONS];
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.mobileHubMigrated === true) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Returns true if given channel has 'Enabled' set as true
 * @param notificationsResourceMeta
 * @param channelName
 * @returns true if given channel has 'Enabled' set as true in amplify-meta.json
 */

/**
 * checks if notifications channel is enabled
 */
export const isNotificationChannelEnabled = (
  notificationsResourceMeta: INotificationsResourceMeta,
  channelName: string,
): boolean => notificationsResourceMeta.output
            && channelName in notificationsResourceMeta.output
            && notificationsResourceMeta.output[channelName].Enabled;

/**
 * Get the enabled channels from the notifications table of amplify-meta.json
 * @returns array of enabled notification channels from amplify-meta.json
 */
export const getEnabledChannelsFromAppMeta = async (amplifyMeta?: $TSAny): Promise<Array<string>> => {
  const tmpAmplifyMeta = (amplifyMeta) || stateManager.getMeta();
  const availableChannels = getAvailableChannels();
  const notificationsMeta = await getNotificationsAppMeta(tmpAmplifyMeta);
  return (notificationsMeta)
    ? availableChannels.filter(channel => isNotificationChannelEnabled(notificationsMeta, channel))
    : [];
};

/**
 * Get all notification channels which are not in use
 */
export const getDisabledChannelsFromAmplifyMeta = async (amplifyMeta?: $TSMeta): Promise<Array<string>> => {
  const disabledChannelList : Array<string> = [];
  const availableChannels = getAvailableChannels();
  const enabledChannels = await getEnabledChannelsFromAppMeta(amplifyMeta);
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
export const getPinpointRegionMapping = async (context: $TSContext): Promise<string|undefined> => {
  const projectPath = pathManager.findProjectRoot();
  const applicationRegion = stateManager.getCurrentRegion(projectPath);
  if (!applicationRegion) {
    throw new AmplifyError('ConfigurationError', {
      message: `Invalid Region for project at ${projectPath}`,
    });
  }
  const providerPlugin = await import(context.amplify.getProviderPlugins(context)[PINPOINT_PROVIDER_NAME]);
  const regionMapping: Record<string, string> = providerPlugin.getPinpointRegionMapping();
  return (applicationRegion in regionMapping) ? regionMapping[applicationRegion] : undefined;
};

/**
 * Create partial Notifications resource in Amplify Meta. The fields will be populated in post-push state
 * @param context
 * @param notificationResourceName
 * @returns
 */

/**
 * add partial notification app meta data
 */
export const addPartialNotificationsAppMeta = async (context: $TSContext, notificationResourceName: string): Promise<$TSMeta> => {
  const updatedAmplifyMeta = await stateManager.getMeta();
  const pinpointRegion = await getPinpointRegionMapping(context);
  // update amplify-meta with notifications metadata
  return constructPartialNotificationsAppMeta(updatedAmplifyMeta, notificationResourceName, pinpointRegion);
};

/**
 * Save un-pushed notifications metadata in amplify-meta.json
 * @param amplifyMeta current amplify-meta.json
 * @param resourceName Name of the Pinpoint resource
 * @returns partialPinpointApp ( region + name but no ID)
 */
export const constructPartialNotificationsAppMeta = (
  amplifyMeta: $TSMeta,
  resourceName: string,
  pinpointRegion: string|undefined,
): Partial<ICategoryMeta> => {
  const envName: string = stateManager.getCurrentEnvName() as string;
  const partialPinpointOutput: Partial<ICategoryMeta> = {
    Id: undefined,
    Region: pinpointRegion,
    Name: `${resourceName}-${envName}`,
  };
  // save partial results in Amplify-meta. Identify related values will be placed after amplify push
  return constructResourceMeta(amplifyMeta, resourceName, partialPinpointOutput);
};

/**
 * Create the Notifications resource meta
 * section in amplifyMeta
 * @param amplifyMeta amplify-meta.json's in-memory state
 * @param resourceName Pinpoint resource for notifications
 * @param pinpointOutput Pinpoint resource metadata base class
 */
export const constructResourceMeta = (amplifyMeta : $TSMeta,
  resourceName: string, pinpointOutput:
  Partial<ICategoryMeta>): Partial<ICategoryMeta> => {
  if (!amplifyMeta[AmplifyCategories.NOTIFICATIONS] || Object.keys(amplifyMeta[AmplifyCategories.NOTIFICATIONS]).length === 0) {
    // eslint-disable-next-line no-param-reassign
    amplifyMeta[AmplifyCategories.NOTIFICATIONS] = { [resourceName]: { output: {} } };
  }
  // eslint-disable-next-line no-param-reassign
  amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
    ...amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName],
    service: AmplifySupportedService.PINPOINT,
    output: {
      ...amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName].output,
      ...pinpointOutput,
    },
    lastPushTimeStamp: new Date(),
  };
  return amplifyMeta;
};

/**
 * [Internal] Get the Notifications resources from amplify-meta.json
 * @returns List of notifications resources
 */
const getNotificationsAppListMeta = async (
  amplifyMeta?: $TSMeta,
  appName?: string,
): Promise<Array<INotificationsResourceMeta>> => {
  const tmpMeta = (amplifyMeta) || await stateManager.getMeta();
  const notificationsMeta = tmpMeta[AmplifyCategories.NOTIFICATIONS];
  const notificationsResourceList = [];
  if (notificationsMeta) {
    for (const resourceName of Object.keys(notificationsMeta)) {
      if ((!appName || appName === resourceName)) {
        const notificationsResourceMeta = notificationsMeta[resourceName];
        notificationsResourceList.push({
          Id: notificationsResourceMeta.output.Id,
          ResourceName: resourceName,
          Name: notificationsResourceMeta.output.Name, // {ResourceName}-{env}
          service: (notificationsResourceMeta.service) || AmplifySupportedService.PINPOINT,
          Region: notificationsResourceMeta.output.Region, // Region in which Notifications resource is deployed.
          output: notificationsResourceMeta.output,
          ...notificationsResourceMeta,
        } as INotificationsResourceMeta);
      }
    }
  }
  return notificationsResourceList;
};
