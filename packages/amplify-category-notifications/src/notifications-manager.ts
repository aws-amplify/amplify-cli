import {
  $TSAny, $TSContext, AmplifyCategories, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import path from 'path';
import sequential from 'promise-sequential';
import { getPinpointClient } from './pinpoint-helper';

const channelWorkers = {
  APNS: './channel-APNS',
  FCM: './channel-FCM',
  Email: './channel-Email',
  SMS: './channel-SMS',
};

/**
 *  Channel workers keys
 */
export type ChannelWorkersKeys = keyof typeof channelWorkers;

/**
 * Returns the list of available channels
 */
export const getAvailableChannels = (): ChannelWorkersKeys[] => Object.keys(channelWorkers) as unknown as ChannelWorkersKeys[];

/**
 * Returns the list of enabled channels
 */
export const getEnabledChannels = (context: $TSContext): string[] => {
  const result: string[] = [];
  const { amplifyMeta } = context.exeInfo;
  const availableChannels = getAvailableChannels();
  const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id) {
        availableChannels.forEach(channel => {
          if (serviceMeta.output[channel]?.Enabled) {
            result.push(channel);
          }
        });
        break;
      }
    }
  }
  return result;
};

/**
 * Returns the list of disabled channels
 */
export const getDisabledChannels = (context: $TSContext): string[] => {
  const result: string[] = [];
  const availableChannels = getAvailableChannels();
  const enabledChannels = getEnabledChannels(context);
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
export const enableChannel = async (context: $TSContext, channelName: ChannelWorkersKeys): Promise<void> => {
  if (Object.keys(channelWorkers).includes(channelName)) {
    const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
    context.exeInfo.pinpointClient = await getPinpointClient(context, 'update', envName);
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.enable(context);
  }
};

/**
 * Disable the notification channels in use.
 */
export const disableChannel = async (context: $TSContext, channelName: ChannelWorkersKeys): Promise<void> => {
  if (Object.keys(channelWorkers).includes(channelName)) {
    const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
    context.exeInfo.pinpointClient = await getPinpointClient(context, 'update', envName);
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.disable(context);
  }
};

/**
 * Configure the notification channels in use.
 */
export const configureChannel = async (context: $TSContext, channelName: ChannelWorkersKeys): Promise<boolean> => {
  if (Object.keys(channelWorkers).includes(channelName)) {
    const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
    context.exeInfo.pinpointClient = await getPinpointClient(context, 'update', envName);

    if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
      printer.error('No resources to update.');
      return false;
    }

    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.configure(context);

    return true;
  }

  return false;
};

/**
 * Fetch all the configured channels from pinpoint
 */
export const pullAllChannels = async (context: $TSContext, pinpointApp: $TSAny): Promise<void> => {
  const pullTasks: $TSAny[] = [];
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  context.exeInfo.pinpointClient = await getPinpointClient(context, 'update', envName);
  Object.keys(channelWorkers).forEach(channelName => {
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName as ChannelWorkersKeys]));
    pullTasks.push(() => channelWorker.pull(context, pinpointApp));
  });
  await sequential(pullTasks);
};
