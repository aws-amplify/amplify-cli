/* eslint-disable max-depth */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable global-require */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path';
import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';
import * as constants from './constants';
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
const getAvailableChannels = () => Object.keys(channelWorkers);

/**
 * Get all the channels which are in use
 */
const getEnabledChannelsFromAmplifyMeta = () => {
  const enabledChannelList :Array<string> = [];
  const amplifyMeta = stateManager.getMeta();
  const availableChannels = getAvailableChannels();
  const categoryMeta = amplifyMeta[constants.CategoryName];
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
// serviceMeta helpers for pinpoint state introspection
const isPinpointResourceCreated = (serviceMeta: $TSAny) => serviceMeta.service === AmplifySupportedService.PINPOINT
         && serviceMeta.output && serviceMeta.output.Id;

const isNotificationChannelEnabled = (serviceMeta: $TSAny, channel: string) => serviceMeta.output[channel]
&& serviceMeta.output[channel].Enabled;

/**
 * Get all notification channels which are not in use
 */
function getDisabledChannelsFromAmplifyMeta() {
  const result : Array<string> = [];
  const availableChannels = getAvailableChannels();
  const enabledChannels = getEnabledChannelsFromAmplifyMeta();
  availableChannels.forEach(channel => {
    if (!enabledChannels.includes(channel)) {
      result.push(channel);
    }
  });
  return result;
}

/**
 * Enable the selected notification channel
 */
async function enableChannel(context:$TSContext, channelName:string) {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (channelName in channelWorkers) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.enable(context);
  }
}

/**
 * Disable the notification channels in use.
 */
async function disableChannel(context : $TSContext, channelName: string) {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.disable(context);
  }
}

/**
 * Configure the Pinpoint resources,
 * Also create the required IAM policy to allow Pinpoint to trigger notifications
 */
async function configureChannel(context: $TSContext, channelName: string) {
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
}

/**
 * Fetch all the configured channels from pinpoint
 */
async function pullAllChannels(context: $TSContext, pinpointApp: string) {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pullTasks: Array<$TSAny> = [];
  context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
  Object.keys(channelWorkers).forEach(channelName => {
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    pullTasks.push(() => channelWorker.pull(context, pinpointApp));
  });
  await sequential(pullTasks);
}

module.exports = {
  getAvailableChannels,
  getEnabledChannels: getEnabledChannelsFromAmplifyMeta,
  getDisabledChannels: getDisabledChannelsFromAmplifyMeta,
  enableChannel,
  disableChannel,
  configureChannel,
  pullAllChannels,
};
