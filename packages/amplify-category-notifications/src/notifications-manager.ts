/* eslint-disable max-depth */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path';
import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';
import * as pinpointHelper from './pinpoint-helper';

const channelWorkers: Record<string, string> = {
  APNS: './channel-APNS',
  FCM: './channel-FCM',
  Email: './channel-Email',
  SMS: './channel-SMS',
  InAppMsg: './channel-in-app-msg',
  PushNotification: './channel-push-notification',
};

/**
 * Get all available notification channels
 */
export const getAvailableChannels = ():Array<string> => Object.keys(channelWorkers);

/**
 * Get all the channels which are in use
 */
export const getEnabledChannelsFromAmplifyMeta = ():Array<string> => {
  const enabledChannelList :Array<string> = [];
  const amplifyMeta = stateManager.getMeta();
  const availableChannels = getAvailableChannels();
  const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const serviceName of services) {
      const serviceMeta = categoryMeta[serviceName];
      if (isPinpointResourceCreated(serviceMeta)) {
        for (const channel of availableChannels) {
          if (isNotificationChannelEnabled(serviceMeta, channel)) {
            enabledChannelList.push(channel);
          }
        }
        break;
      }
    }
  }
  return enabledChannelList;
};

/**
 * Get all enabled channels in backend config
 * This is required for Pinpoint resources updated in Analytics CFN but not yet pushed
 */
export const getEnabledChannelsFromBackendConfig = ():Array<string> => {
  const enabledChannelList :Array<string> = [];
  const backendConfig = stateManager.getBackendConfig();
  const availableChannels = getAvailableChannels();
  const categoryBackendConfig = backendConfig[AmplifyCategories.NOTIFICATIONS];
  if (categoryBackendConfig) {
    const notificationResources = Object.keys(categoryBackendConfig);
    for (const resourceName of notificationResources) {
      const resourceBackendConfig = categoryBackendConfig[resourceName];
      if (isPinpointResourceCreatedInBackendConfig(resourceBackendConfig)) {
        for (const channel of availableChannels) {
          if (isNotificationChannelEnabledInBackendConfig(resourceBackendConfig, channel)) {
            enabledChannelList.push(channel);
          }
        }
        break;
      }
    }
  }
  return enabledChannelList;
};

// serviceMeta helpers for pinpoint state introspection
const isPinpointResourceCreated = (serviceMeta: $TSAny):boolean => serviceMeta.service === AmplifySupportedService.PINPOINT
         && serviceMeta.output && serviceMeta.output.Id;

// backendConfig helpers for pinpoint state introspection
const isPinpointResourceCreatedInBackendConfig = (serviceMeta: $TSAny):boolean => serviceMeta.service === AmplifySupportedService.PINPOINT;

const isNotificationChannelEnabled = (serviceMeta: $TSAny, channel: string):boolean => serviceMeta.output[channel]
&& serviceMeta.output[channel].Enabled;

const isNotificationChannelEnabledInBackendConfig = (resourceBackendConfig: $TSAny, channel: string):boolean =>
  // eslint-disable-next-line implicit-arrow-linebreak
  resourceBackendConfig.channels && resourceBackendConfig.channels.includes(channel);

/**
 * Get all notification channels which are not in use
 */
export const getDisabledChannelsFromAmplifyMeta = ():Array<string> => {
  const result : Array<string> = [];
  const availableChannels = getAvailableChannels();
  const enabledChannels = getEnabledChannelsFromAmplifyMeta();
  availableChannels.forEach(channel => {
    if (!enabledChannels.includes(channel)) {
      result.push(channel);
    }
  });
  return result;
};
/**
 * Get all notifications channel which are not in use in the Backend Config
 * @returns array of channels which are not in use
 */
export const getDisabledChannelsFromBackendConfig = ():Array<string> => {
  const result : Array<string> = [];
  const availableChannels = getAvailableChannels();
  const enabledChannels = getEnabledChannelsFromBackendConfig();
  availableChannels.forEach(channel => {
    if (!enabledChannels.includes(channel)) {
      result.push(channel);
    }
  });
  return result;
};

/**
 * Enable the selected notification channel
 */
export const enableChannel = async (context:$TSContext, channelName:string): Promise<void> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (channelName in channelWorkers) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.enable(context);
  }
};

/**
 * Disable the notification channels in use.
 */
export const disableChannel = async (context : $TSContext, channelName: string): Promise<void> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.disable(context);
  }
};

/**
 * Configure the Pinpoint resources,
 * Also create the required IAM policy to allow Pinpoint to trigger notifications
 */
export const configureChannel = async (context: $TSContext, channelName: string):Promise<boolean> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured

  if (channelName in channelWorkers) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
      context.print.error('No resources to update.');
      return false;
    }

    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.configure(context);
    return true;
  }
  return false;
};

/**
 * Fetch all the configured channels from pinpoint
 */
export const pullAllChannels = async (context: $TSContext, pinpointApp: string):Promise<$TSAny> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pullTasks: Array<$TSAny> = [];
  context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
  Object.keys(channelWorkers).forEach(channelName => {
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    pullTasks.push(() => channelWorker.pull(context, pinpointApp));
  });
  await sequential(pullTasks);
};
