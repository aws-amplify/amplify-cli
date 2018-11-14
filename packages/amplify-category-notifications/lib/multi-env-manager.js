const fs = require('fs-extra');
const sequential = require('promise-sequential');
const pinpointHelper = require('./pinpoint-helper');
const constants = require('./constants');
const notificationManager = require('./notifications-manager');

async function initEnv(context) {
  checkExeInfo(context);
  const pinpointNotificationsMeta = await constructPinpointNotificationsMeta(context);
  if (pinpointNotificationsMeta) {
    // remove this line after init and init-push are separated.
    await pushChanges(context, pinpointNotificationsMeta);
    writeData(context);
  }
  return pinpointNotificationsMeta;
}

function checkExeInfo(context) {
  const projectDetails = context.amplify.getProjectDetails();
  context.exeInfo = context.exeInfo || {};
  Object.assign(context.exeInfo, projectDetails);
}

// this function will be called after init and init-push are separated.
async function initEnvPush(context, pinpointNotificationsMeta) {//eslint-disable-line
  // await pushChanges(context, pinpointNotificationsMeta);//eslint-disable-line
}

async function constructPinpointNotificationsMeta(context) {
  let pinpointApp;
  let serviceBackendConfig;
  let pinpointNotificationsMeta;

  const { envName } = context.exeInfo.localEnvInfo;

  const teamProviderInfoFilepath = context.amplify.pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilepath)) {
    const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilepath));
    if (teamProviderInfo[envName] &&
        teamProviderInfo[envName].categories &&
        teamProviderInfo[envName].categories[constants.CategoryName] &&
        teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName]) {
      pinpointApp =
        teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName];
    }
  }

  if (!pinpointApp) {
    const metaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = JSON.parse(fs.readFileSync(metaFilePath));
    const analyticsMeta = amplifyMeta[constants.AnalyticsCategoryName];
    pinpointApp = pinpointHelper.scanCategoryMetaForPinpoint(analyticsMeta);
  }

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));
  if (backendConfig[constants.CategoryName]) {
    const categoryConfig = backendConfig[constants.CategoryName];
    const services = Object.keys(categoryConfig);
    for (let i = 0; i < services.length; i++) {
      serviceBackendConfig = categoryConfig[services[i]];
      if (serviceBackendConfig.service === constants.PinpointName) {
        serviceBackendConfig.Name = services[i];
        break;
      }
    }
  }

  if (pinpointApp) {
    await notificationManager.pullAllChannels(context, pinpointApp);
    pinpointNotificationsMeta = {
      Name: pinpointApp.Name,
      serivce: constants.PinpointName,
      output: pinpointApp,
    };
  }

  if (serviceBackendConfig) {
    if (pinpointNotificationsMeta) {
      pinpointNotificationsMeta.channels = serviceBackendConfig.channels;
    } else {
      pinpointNotificationsMeta = serviceBackendConfig;
    }
  }

  return pinpointNotificationsMeta;
}

async function pushChanges(context, pinpointNotificationsMeta) {
  const availableChannels = notificationManager.getAvailableChannels();
  let pinpointInputParams;
  if (context.exeInfo &&
    context.exeInfo.inputParams &&
    context.exeInfo.inputParams.categories &&
    context.exeInfo.inputParams.categories[constants.CategoryName] &&
    context.exeInfo.inputParams.categories[constants.CategoryName][constants.PinpointName]) {
    pinpointInputParams =
        context.exeInfo.inputParams.categories[constants.CategoryName][constants.PinpointName];
    context.exeInfo.pinpointInputParams = pinpointInputParams;
  }
  const channelsToEnable = [];
  const channelsToDisable = [];
  // const channelsToUpdate = [];

  availableChannels.forEach((channel) => {
    let isCurrentlyEnabled = false;
    let needToBeEnabled = false;
    if (pinpointNotificationsMeta.output && pinpointNotificationsMeta.output.Id) {
      if (pinpointNotificationsMeta.output[channel] &&
        pinpointNotificationsMeta.output[channel].Enabled) {
        isCurrentlyEnabled = true;
      }
    }

    if (pinpointNotificationsMeta.channels &&
      pinpointNotificationsMeta.channels.includes(channel)) {
      needToBeEnabled = true;
    }
    if (pinpointInputParams && pinpointInputParams[channel] &&
      Object.prototype.hasOwnProperty.call(pinpointInputParams[channel], 'Enabled')) {
      needToBeEnabled = pinpointInputParams[channel].Enabled;
    }


    // if (isCurrentlyEnabled && needToBeEnabled) {
    //   channelsToUpdate.push(channel);
    // }
    if (isCurrentlyEnabled && !needToBeEnabled) {
      channelsToDisable.push(channel);
    } else if (!isCurrentlyEnabled && needToBeEnabled) {
      channelsToEnable.push(channel);
    }
  });

  const { amplifyMeta } = context.exeInfo;
  amplifyMeta[constants.CategoryName] = {};
  amplifyMeta[constants.CategoryName][pinpointNotificationsMeta.Name] = pinpointNotificationsMeta;

  delete pinpointNotificationsMeta.channels;
  delete pinpointNotificationsMeta.Name;

  const tasks = [];
  tasks.push(() => pinpointHelper.ensurePinpointApp(context));
  channelsToEnable.forEach((channel) => {
    tasks.push(() => notificationManager.enableChannel(context, channel));
  });
  channelsToDisable.forEach((channel) => {
    tasks.push(() => notificationManager.disableChannel(context, channel));
  });
  // channelsToUpdate.forEach((channel) => {
  //   tasks.push(() => notificationManager.configureChannel(context, channel));
  // });

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

