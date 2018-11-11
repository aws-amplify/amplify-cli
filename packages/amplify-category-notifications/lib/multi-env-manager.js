const fs = require('fs-extra');
const sequential = require('promise-sequential');
const pinpointHelper = require('./pinpoint-helper');
const constants = require('./constants');
const notificationManager = require('./notifications-manager');

async function initEnv(context) {
  checkExeInfo(context);
  await pullCurrentAmplifyMeta(context);
  await constructAmplifyMeta(context);
  await pushChanges(context); // remove this line after add and push are separated.
  writeData(context);
  return context;
}

function checkExeInfo(context) {
  const projectDetails = context.amplify.getProjectDetails();
  context.exeInfo = context.exeInfo || {};
  Object.assign(context.exeInfo, projectDetails);
}

async function initEnvPush(context) {
  await pushChanges(context);
}

async function pullCurrentAmplifyMeta(context) {
  let pinpointApp;

  const { envName } = context.exeInfo.localEnvInfo;

  const teamProviderInfoFilepath = context.amplify.pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilepath)) {
    const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilepath));
    if (teamProviderInfo[envName] &&
            teamProviderInfo[envName].categories &&
            teamProviderInfo[envName].categories[constants.CategoryName]) {
      pinpointApp = teamProviderInfo[envName].categories[constants.CategoryName];
    }
  }

  const currentMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
  const currentBackendAmplifyMeta = JSON.parse(fs.readFileSync(currentMetaFilePath));
  if (!pinpointApp) {
    const analyticsMeta = currentBackendAmplifyMeta[constants.AnalyticsCategoryName];
    pinpointApp = pinpointHelper.scanCategoryMetaForPinpoint(analyticsMeta);
  }

  if (pinpointApp) {
    await notificationManager.pullAllChannels(context, pinpointApp);
    currentBackendAmplifyMeta[constants.CategoryName] = {};
    currentBackendAmplifyMeta[constants.CategoryName][pinpointApp.Name] = {
      serivce: constants.PinpointName,
      output: pinpointApp,
    };

    const jsonString = JSON.stringify(currentBackendAmplifyMeta, null, 4);
    fs.writeFileSync(currentMetaFilePath, jsonString, 'utf8');
  }
}

async function constructAmplifyMeta(context) {
  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));
  if (backendConfig[constants.CategoryName]) {
    const metaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = JSON.parse(fs.readFileSync(metaFilePath));
    amplifyMeta[constants.CategoryName] = backendConfig[constants.CategoryName];
    const jsonString = JSON.stringify(amplifyMeta, null, 4);
    fs.writeFileSync(metaFilePath, jsonString, 'utf8');
  }
}

async function pushChanges(context) {
  const currentMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
  const currentBackendAmplifyMeta = JSON.parse(fs.readFileSync(currentMetaFilePath));

  const metaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(metaFilePath));

  const availableChannels = notificationManager.getAvailableChannels();

  const currentEnabledChannels = [];
  const newEnabledChannels = [];

  if (currentBackendAmplifyMeta && currentBackendAmplifyMeta[constants.CategoryName]) {
    const categoryMeta = currentBackendAmplifyMeta[constants.CategoryName];
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === constants.PinpointName &&
                                    serviceMeta.output &&
                                    serviceMeta.output.Id) {
        availableChannels.forEach((channel) => {
          if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
            currentEnabledChannels.push(channel);
          }
        });
        break;
      }
    }
  }

  if (amplifyMeta && amplifyMeta[constants.CategoryName]) {
    const categoryMeta = amplifyMeta[constants.CategoryName];
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === constants.PinpointName && serviceMeta.channels) {
        availableChannels.forEach((channel) => {
          if (serviceMeta.channels.includes(channel)) {
            newEnabledChannels.push(channel);
          }
        });
        break;
      }
    }
  }

  const channelsToEnable = [];
  const channelsToDisable = [];
  const channelsToUpdate = [];

  availableChannels.forEach((channel) => {
    const isCurrentlyEnabled = currentEnabledChannels.includes(channel);
    const needToBeEnabled = newEnabledChannels.includes(channel);

    if (isCurrentlyEnabled && needToBeEnabled) {
      channelsToUpdate.push(channel);
    }
    if (isCurrentlyEnabled && !needToBeEnabled) {
      channelsToDisable.push(channel);
    }
    if (!isCurrentlyEnabled && needToBeEnabled) {
      channelsToEnable.push(channel);
    }
  });

  const tasks = [];

  channelsToEnable.forEach((channel) => {
    tasks.push(() => {
      notificationManager.enableChannel(context, channel);
    });
  });


  channelsToDisable.forEach((channel) => {
    tasks.push(() => {
      notificationManager.disableChannel(context, channel);
    });
  });


  channelsToUpdate.forEach((channel) => {
    tasks.push(() => {
      notificationManager.configureChannel(context, channel);
    });
  });

  await sequential(tasks);
}

function writeData(context) {
  writeAmplifyMeta(context);
  writeMultienvData(context);
}

function writeMultienvData(context) {
  const categoryMeta = context.exeInfo.amplifyMeta[constants.CategoryName];
  if (!categoryMeta) {
    return;
  }

  const { envName } = context.exeInfo.localEnvInfo;

  const availableChannels = notificationManager.getAvailableChannels();
  let pinpointMeta;
  const enabledChannels = [];
  const services = Object.keys(categoryMeta);
  for (let i = 0; i < services.length; i++) {
    const serviceMeta = categoryMeta[services[i]];
    if (serviceMeta.service === constants.PinpointName &&
                                serviceMeta.output &&
                                serviceMeta.output.Id) {
      availableChannels.forEach((channel) => {
        if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
          enabledChannels.push(channel);
        }
      });
      pinpointMeta = {
        serviceName: services[i],
        service: serviceMeta.service,
        channels: enabledChannels,
        Name: serviceMeta.output.Name,
        Id: serviceMeta.output.Id,
        Region: serviceMeta.output.Region,
      };
      break;
    }
  }

  if (pinpointMeta) {
    const teamProviderInfoFilepath = context.amplify.pathManager.getProviderInfoFilePath();
    if (fs.existsSync(teamProviderInfoFilepath)) {
      const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilepath));
      teamProviderInfo[envName] = teamProviderInfo[envName] || {};
      teamProviderInfo[envName].categories = teamProviderInfo[envName].categories || {};
      teamProviderInfo[envName].categories[constants.CategoryName] =
                teamProviderInfo[envName].categories[constants.CategoryName] || {};
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName] = {
        Name: pinpointMeta.Name,
        Id: pinpointMeta.Id,
        Region: pinpointMeta.Region,
      };
      const jsonString = JSON.stringify(teamProviderInfo, null, 4);
      fs.writeFileSync(teamProviderInfoFilepath, jsonString, 'utf8');
    }

    const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
    if (fs.existsSync(backendConfigFilePath)) {
      const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));
      backendConfig[constants.CategoryName] = backendConfig[constants.CategoryName] || {};
      backendConfig[constants.CategoryName][pinpointMeta.serviceName] = {
        service: pinpointMeta.service,
        channels: pinpointMeta.channels,
      };
      const jsonString = JSON.stringify(backendConfig, null, 4);
      fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
    }
  }
}

function writeAmplifyMeta(context) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  let jsonString = JSON.stringify(context.exeInfo.amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
  const currentAmplifyMeta = JSON.parse(fs.readFileSync(currentAmplifyMetaFilePath));
  currentAmplifyMeta[constants.CategoryName] = context.exeInfo.amplifyMeta[constants.CategoryName];
  jsonString = JSON.stringify(currentAmplifyMeta, null, '\t');
  fs.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');

  context.amplify.onCategoryOutputsChange(context);
}

module.exports = {
  initEnv,
  initEnvPush,
  writeData,
};

