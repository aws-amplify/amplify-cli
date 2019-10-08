const path = require('path');
const sequential = require('promise-sequential');
const constants = require('./constants');
const pintpointHelper = require('./pinpoint-helper');

const channelWorkers = {
  APNS: './channel-APNS',
  FCM: './channel-FCM',
  Email: './channel-Email',
  SMS: './channel-SMS',
};

function getAvailableChannels() {
  return Object.keys(channelWorkers);
}

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

async function enableChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.enable(context);
  }
}

async function disableChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.disable(context);
  }
}

async function configureChannel(context, channelName) {
  if (Object.keys(channelWorkers).indexOf(channelName) > -1) {
    context.exeInfo.pinpointClient = await pintpointHelper.getPinpointClient(context, 'update');
    const channelWorker = require(path.join(__dirname, channelWorkers[channelName]));
    await channelWorker.configure(context);
  }
}

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
