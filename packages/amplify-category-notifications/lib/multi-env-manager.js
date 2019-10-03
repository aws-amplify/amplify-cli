const fs = require('fs-extra');
const sequential = require('promise-sequential');
const pinpointHelper = require('./pinpoint-helper');
const constants = require('./constants');
const notificationManager = require('./notifications-manager');

async function initEnv(context) {
  const pinpointNotificationsMeta = await constructPinpointNotificationsMeta(context);
  if (pinpointNotificationsMeta) {
    // remove this line after init and init-push are separated.
    await pushChanges(context, pinpointNotificationsMeta);
    await writeData(context);
  }
  return pinpointNotificationsMeta;
}

async function constructPinpointNotificationsMeta(context) {
  let pinpointApp;
  let serviceBackendConfig;
  let pinpointNotificationsMeta;

  const { teamProviderInfo, localEnvInfo, amplifyMeta } = context.exeInfo;

  const { envName } = localEnvInfo;

  if (teamProviderInfo &&
      teamProviderInfo[envName] &&
      teamProviderInfo[envName].categories &&
      teamProviderInfo[envName].categories[constants.CategoryName] &&
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName] &&
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName].Id) {
    pinpointApp =
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName];
  }

  if (!pinpointApp) {
    const analyticsMeta = amplifyMeta[constants.AnalyticsCategoryName];
    pinpointApp = pinpointHelper.scanCategoryMetaForPinpoint(analyticsMeta);
  }

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
  if (backendConfig[constants.CategoryName]) {
    const categoryConfig = backendConfig[constants.CategoryName];
    const resources = Object.keys(categoryConfig);
    for (let i = 0; i < resources.length; i++) {
      serviceBackendConfig = categoryConfig[resources[i]];
      if (serviceBackendConfig.service === constants.PinpointName) {
        serviceBackendConfig.resourceName = resources[i];
        break;
      }
    }
  }

  if (pinpointApp) {
    await notificationManager.pullAllChannels(context, pinpointApp);
    pinpointNotificationsMeta = {
      Name: pinpointApp.Name,
      service: constants.PinpointName,
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

async function deletePinpointAppForEnv(context, envName) {
  let pinpointApp;
  const teamProviderInfo = context.amplify.getEnvDetails();

  if (teamProviderInfo &&
      teamProviderInfo[envName] &&
      teamProviderInfo[envName].categories &&
      teamProviderInfo[envName].categories[constants.CategoryName] &&
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName]) {
    pinpointApp =
      teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName];
  }

  if (pinpointApp) {
    const params = {
      ApplicationId: pinpointApp.Id,
    };
    const pinpointClient = await pinpointHelper.getPinpointClient(context, 'delete');

    return pinpointClient.deleteApp(params).promise()
      .then(() => {
        context.print.success(`Successfully deleted Pinpoint project: ${pinpointApp.Id}`);
      })
      .catch((err) => {
        // awscloudformation might have already removed the pinpoint project
        if (err.code === 'NotFoundException') {
          context.print.warning(`${pinpointApp.Id}: not found`);
        } else {
          context.print.error(`Failed to delete Pinpoint project: ${pinpointApp.Id}`);
          throw err;
        }
      });
  }
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

  await pinpointHelper.ensurePinpointApp(context, pinpointNotificationsMeta.resourceName);

  const tasks = [];
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

async function writeData(context) {
  const categoryMeta = context.exeInfo.amplifyMeta[constants.CategoryName];
  let pinpointMeta;
  if (categoryMeta) {
    const availableChannels = notificationManager.getAvailableChannels();
    const enabledChannels = [];
    const resources = Object.keys(categoryMeta);
    for (let i = 0; i < resources.length; i++) {
      const serviceMeta = categoryMeta[resources[i]];
      if (serviceMeta.service === constants.PinpointName &&
                                  serviceMeta.output &&
                                  serviceMeta.output.Id) {
        availableChannels.forEach((channel) => {
          if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
            enabledChannels.push(channel);
          }
        });
        pinpointMeta = {
          serviceName: resources[i],
          service: serviceMeta.service,
          channels: enabledChannels,
          Name: serviceMeta.output.Name,
          Id: serviceMeta.output.Id,
          Region: serviceMeta.output.Region,
        };
        break;
      }
    }
  }
  // TODO: move writing to files logic to the cli core when those are ready
  writeTeamProviderInfo(pinpointMeta, context);
  writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getBackendConfigFilePath());
  writeBackendConfig(
    context,
    pinpointMeta,
    context.amplify.pathManager.getCurrentBackendConfigFilePath(),
  );
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
  writeAmplifyMeta(
    context,
    categoryMeta,
    context.amplify.pathManager.getCurentAmplifyMetaFilePath(),
  );
  await context.amplify.onCategoryOutputsChange(context);
}

function writeTeamProviderInfo(pinpointMeta, context) {
  const teamProviderInfoFilepath = context.amplify.pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilepath)) {
    const { envName } = context.exeInfo.localEnvInfo;
    const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoFilepath);
    teamProviderInfo[envName] = teamProviderInfo[envName] || {};
    teamProviderInfo[envName].categories = teamProviderInfo[envName].categories || {};
    teamProviderInfo[envName].categories[constants.CategoryName] =
              teamProviderInfo[envName].categories[constants.CategoryName] || {};
    teamProviderInfo[envName].categories[constants.CategoryName][constants.PinpointName] =
    pinpointMeta ? {
      Name: pinpointMeta.Name,
      Id: pinpointMeta.Id,
      Region: pinpointMeta.Region,
    } : undefined;
    const jsonString = JSON.stringify(teamProviderInfo, null, 4);
    fs.writeFileSync(teamProviderInfoFilepath, jsonString, 'utf8');
  }
}

function writeBackendConfig(context, pinpointMeta, backendConfigFilePath) {
  if (fs.existsSync(backendConfigFilePath)) {
    const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
    backendConfig[constants.CategoryName] = backendConfig[constants.CategoryName] || {};

    const resources = Object.keys(backendConfig[constants.CategoryName]);
    for (let i = 0; i < resources.length; i++) {
      const serviceMeta = backendConfig[constants.CategoryName][resources[i]];
      if (serviceMeta.service === constants.PinpointName) {
        delete backendConfig[constants.CategoryName][resources[i]];
      }
    }

    if (pinpointMeta) {
      backendConfig[constants.CategoryName][pinpointMeta.serviceName] = {
        service: pinpointMeta.service,
        channels: pinpointMeta.channels,
      };
    }

    const jsonString = JSON.stringify(backendConfig, null, 4);
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
}

function writeAmplifyMeta(context, categoryMeta, amplifyMetaFilePath) {
  if (fs.existsSync(amplifyMetaFilePath)) {
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    amplifyMeta[constants.CategoryName] = categoryMeta;
    const jsonString = JSON.stringify(amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  }
}

async function migrate(context) {
  const migrationInfo = extractMigrationInfo(context);
  fillBackendConfig(context, migrationInfo);
  fillTeamProviderInfo(context, migrationInfo);
}

function extractMigrationInfo(context) {
  let migrationInfo;
  const { amplifyMeta, localEnvInfo } = context.migrationInfo;
  if (amplifyMeta[constants.CategoryName]) {
    const categoryMeta = amplifyMeta[constants.CategoryName];
    const resources = Object.keys(categoryMeta);
    for (let i = 0; i < resources.length; i++) {
      const service = resources[i];
      const serviceMeta = amplifyMeta[constants.CategoryName][service];
      if (serviceMeta.service === constants.PinpointName) {
        migrationInfo = {};
        migrationInfo.envName = localEnvInfo.envName;
        migrationInfo.serviceName = service;
        migrationInfo.service = serviceMeta.service;
        migrationInfo.output = serviceMeta.output;
        break;
      }
    }
  }

  if (migrationInfo &&
    migrationInfo.output &&
    migrationInfo.output.Id) {
    migrationInfo.Id = migrationInfo.output.Id;
    migrationInfo.Name = migrationInfo.output.Name;
    migrationInfo.Region = migrationInfo.output.Region;
    migrationInfo.channels = [];
    const availableChannels = notificationManager.getAvailableChannels();
    availableChannels.forEach((channel) => {
      if (migrationInfo.output[channel] && migrationInfo.output[channel].Enabled) {
        migrationInfo.channels.push(channel);
      }
    });
  }

  return migrationInfo;
}

function fillBackendConfig(context, migrationInfo) {
  if (migrationInfo) {
    const backendConfig = {};
    backendConfig[migrationInfo.serviceName] = {
      service: migrationInfo.service,
      channels: migrationInfo.channels,
    };
    Object.assign(context.migrationInfo.backendConfig[constants.CategoryName], backendConfig);
  }
}

function fillTeamProviderInfo(context, migrationInfo) {
  if (migrationInfo && migrationInfo.Id) {
    const categoryTeamInfo = {};
    categoryTeamInfo[constants.CategoryName] = {};
    categoryTeamInfo[constants.CategoryName][constants.PinpointName] = {
      Name: migrationInfo.Name,
      Id: migrationInfo.Id,
      Region: migrationInfo.Region,
    };

    const { teamProviderInfo } = context.migrationInfo;
    teamProviderInfo[migrationInfo.envName] =
      teamProviderInfo[migrationInfo.envName] || {};

    teamProviderInfo[migrationInfo.envName].categories =
      teamProviderInfo[migrationInfo.envName].categories || {};

    Object.assign(teamProviderInfo[migrationInfo.envName].categories, categoryTeamInfo);
  }
}

module.exports = {
  initEnv,
  deletePinpointAppForEnv,
  writeData,
  migrate,
};

