/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
import {
  $TSAny, pathManager, stateManager, AmplifySupportedService, AmplifyCategories, $TSMeta, $TSContext,
} from 'amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { NotificationsResourceBackendConfig } from './notifications-backend-config-types';

const PROVIDER_NAME = 'awscloudformation';


/**
 * Create a new Pinpoint resource in backend-config for Notifications category.
 * @param pinpointResourceName Name of the pinpoint resource from Analytics
 * @returns backendConfig for reference
 */
export const addPartialNotificationsBackendConfig = (pinpointResourceName: string):$TSAny => {
  const projectPath = pathManager.findProjectRoot();
  const backendConfig = stateManager.getBackendConfig(projectPath);
  const resourceConfig : NotificationsResourceBackendConfig = {
    service: AmplifySupportedService.PINPOINT,
    channels: [],
    channelConfig: {},
  };

  if (!backendConfig[AmplifyCategories.NOTIFICATIONS] || !backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName]) {
    backendConfig[AmplifyCategories.NOTIFICATIONS] = {
      [pinpointResourceName]: resourceConfig,
    };
    stateManager.setBackendConfig(projectPath, backendConfig);
    console.log('SACPCDEBUG: Saved BackendConfig : ', JSON.stringify(backendConfig, null, 2));
  }
  return backendConfig;
};

/**
   * Save un-pushed notifications metadata in amplify-meta.json
   * @param amplifyMeta current amplify-meta.json
   * @param resourceName Name of the Pinpoint resource
   * @returns partialPinpointApp ( region + name but no ID)
   */
export const addPartialNotificationsAmplifyMeta = (amplifyMeta: $TSMeta, resourceName: string,
  pinpointRegion: string|undefined):Partial<ICategoryMeta> => {
  const partialPinpointApp: Partial<ICategoryMeta> = {
    Id: undefined,
    Region: pinpointRegion,
    Name: resourceName,
  };
  // save partial results in Amplify-meta. Identify related values will be placed after amplify push
  constructResourceMeta(amplifyMeta, resourceName, partialPinpointApp);
  return partialPinpointApp;
};

/**
 * Create the Notifications resource meta section in amplifyMeta
 * @param amplifyMeta amplify-meta.json's in-memory state
 * @param resourceName Pinpoint resource for notifications
 * @param pinpointApp Pinpoint resource metadata base class
 */
export const constructResourceMeta = (amplifyMeta : $TSMeta, resourceName: string, pinpointApp: Partial<ICategoryMeta>):void => {
  if (!amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    amplifyMeta[AmplifyCategories.NOTIFICATIONS] = { [resourceName]: {} };
  }
  amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
    service: AmplifySupportedService.PINPOINT,
    output: pinpointApp,
    lastPushTimeStamp: new Date(),
    ...amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName],
  };
  return amplifyMeta;
};

/**
 * Given the application region, get the closest pinpoint region
 * @param context  application context
 * @returns pinpoint region
 */
export const getPinpointRegionMapping = (context: $TSContext): string|undefined => {
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
export const isChannelEnabledNotificationsBackendConfig = (channelName: string): boolean => {
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
