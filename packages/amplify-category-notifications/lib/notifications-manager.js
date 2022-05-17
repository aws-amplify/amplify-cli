/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable global-require */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const sequential = require('promise-sequential');
const constants = require('./constants');
const pintpointHelper = require('./pinpoint-helper');

const channelWorkers = {
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
function getAvailableChannels() {
  return Object.keys(channelWorkers);
}

/**
 * Get all the channels which are in use
 */
function getEnabledChannels(context) {
  const result = [];
  const { amplifyMeta } = context.exeInfo;
  const availableChannels = getAvailableChannels(context);
  const categoryMeta = amplifyMeta[constants.CategoryName];
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id) {
        availableChannels.forEach(channel => {
          if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
            result.push(channel);
          }
        });
        break;
      }
    }
  }
  return result;
}

/**
 * Get all notification channels which are not in use
 */
function getDisabledChannels(context) {
  const result = [];
  const availableChannels = getAvailableChannels(context);
  const enabledChannels = getEnabledChannels(context);
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
async function enableChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.enable(context);
  }
}

/**
 * Disable the notification channels in use.
 */
async function disableChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.disable(context);
  }
}

/**
 * Configure the Pinpoint resources,
 * Also create the required IAM policy to allow Pinpoint to trigger notifications
 */
async function configureChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');

    if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
      context.print.error('No resources to update.');
      return false;
    }

    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.configure(context);

    return true;
  }
}

/**
 * Fetch all the configured channels from pinpoint
 */
async function pullAllChannels(context, pinpointApp) {
  const pullTasks = [];
  context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
  Object.keys(channelWorkers).forEach(channelName => {
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    pullTasks.push(() => channelWorker.pull(context, pinpointApp));
  });
  await sequential(pullTasks);
}

module.exports = {
  getAvailableChannels,
  getEnabledChannels,
  getDisabledChannels,
  enableChannel,
  disableChannel,
  configureChannel,
  pullAllChannels,
};
