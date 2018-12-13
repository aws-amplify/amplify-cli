const opn = require('opn');
const ora = require('ora');
const inquirer = require('inquirer');

const constants = require('./constants');
const authHelper = require('./auth-helper');

const providerName = 'awscloudformation';
const spinner = ora('');

function getPinpointApp(context) {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
  }
  return pinpointApp;
}

async function ensurePinpointApp(context) {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
    if (pinpointApp) {
      if (!pinpointApp.Name) {
        pinpointApp = await getApp(context, pinpointApp.Id);
      }
      amplifyMeta[constants.CategoryName] = {};
      amplifyMeta[constants.CategoryName][pinpointApp.Name] = {
        service: constants.PinpointName,
        output: {
          Name: pinpointApp.Name,
          Id: pinpointApp.Id,
          Region: pinpointApp.Region,
        },
      };
    } else {
      context.print.info('');
      pinpointApp = await createPinpointApp(context);
    }
  }
  context.exeInfo.pinpointApp = pinpointApp;
  context.exeInfo.serviceMeta =
    context.exeInfo.amplifyMeta[constants.CategoryName][pinpointApp.Name];
}

async function createPinpointApp(context) {
  const { projectConfig, amplifyMeta } = context.exeInfo;

  context.print.info('An Amazon Pinpoint project will be created for notifications.');
  const answer = await inquirer.prompt({
    name: 'pinpointProjectName',
    type: 'input',
    message: 'Pinpoint project name',
    default: `${projectConfig.projectName}${context.amplify.makeId(5)}`,
    validate: (name) => {
      let result = false;
      let message = '';
      if (name && name.length > 0) {
        result = true;
      } else {
        message = 'Project name can not be empty.';
      }
      return result || message;
    },
  });

  const pinpointApp = await createApp(context, answer.pinpointProjectName);
  amplifyMeta[constants.CategoryName] = {};
  amplifyMeta[constants.CategoryName][pinpointApp.Name] = {
    service: constants.PinpointName,
    output: {
      Name: pinpointApp.Name,
      Id: pinpointApp.Id,
      Region: pinpointApp.Region,
    },
    lastPushTimeStamp: new Date(),
  };

  context.exeInfo.pinpointApp = pinpointApp;
  context.print.info('');
  await authHelper.ensureAuth(context);
  context.print.info('');

  return pinpointApp;
}

async function deletePinpointApp(context) {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
  }
  if (pinpointApp) {
    pinpointApp = await deleteApp(context, pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName], pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName], pinpointApp.Id);
  }
}

function scanCategoryMetaForPinpoint(categoryMeta) {
  let result;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === 'Pinpoint' &&
        serviceMeta.output &&
        serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
        };
        if (serviceMeta.output.Name) {
          result.Name = serviceMeta.output.Name;
        } else if (serviceMeta.output.appName) {
          result.Name = serviceMeta.output.appName;
        }

        if (serviceMeta.output.Region) {
          result.Region = serviceMeta.output.Region;
        }

        break;
      }
    }
  }
  return result;
}

function removeCategoryMetaForPinpoint(categoryMeta, pinpointAppId) {
  let result;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === 'Pinpoint' &&
        serviceMeta.output &&
        serviceMeta.output.Id === pinpointAppId) {
        delete categoryMeta[services[i]];
      }
    }
  }
  return result;
}

async function createApp(context, pinpointAppName) {
  const params = {
    CreateApplicationRequest: {
      Name: pinpointAppName,
    },
  };
  const pinpointClient = await getPinpointClient(context, 'create');
  spinner.start('Creating Pinpoint app.');
  return new Promise((resolve, reject) => {
    pinpointClient.createApp(params, (err, data) => {
      if (err) {
        spinner.fail('Pinpoint project creation error');
        reject(err);
      } else {
        spinner.succeed(`Successfully created Pinpoint project: ${data.ApplicationResponse.Name}`);
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
}

async function getApp(context, pinpointAppId) {
  const params = {
    ApplicationId: pinpointAppId,
  };
  spinner.start('Retrieving Pinpoint app information.');
  const pinpointClient = await getPinpointClient(context, 'get');
  return new Promise((resolve, reject) => {
    pinpointClient.getApp(params, (err, data) => {
      if (err) {
        spinner.fail('Pinpoint project retrieval error');
        reject(err);
      } else {
        spinner.succeed(`Successfully retrieved Pinpoint project: ${data.ApplicationResponse.Name}`);
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
}

async function deleteApp(context, pinpointAppId) {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const pinpointClient = await getPinpointClient(context, 'delete');
  spinner.start('Deleting Pinpoint app.');
  return new Promise((resolve, reject) => {
    pinpointClient.deleteApp(params, (err, data) => {
      if (err) {
        spinner.fail('Pinpoint project deletion error');
        reject(err);
      } else {
        spinner.succeed(`Successfully deleted Pinpoint project: ${data.ApplicationResponse.Name}`);
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
}

function console(context) {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
  }
  if (pinpointApp) {
    const { Id, Region } = pinpointApp;
    const consoleUrl =
          `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/manage/channels`;
    opn(consoleUrl, { wait: false });
  } else {
    context.print.error('Neither notifications nor analytics is anabled in the cloud.');
  }
}

async function getPinpointClient(context, action) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  return provider.getConfiguredPinpointClient(context, constants.CategoryName, action);
}

function isAnalyticsAdded(context) {
  const { amplifyMeta } = context.exeInfo;
  let result = false;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
  if (pinpointApp) {
    result = true;
  }
  return result;
}

module.exports = {
  getPinpointApp,
  ensurePinpointApp,
  deletePinpointApp,
  getPinpointClient,
  isAnalyticsAdded,
  console,
};
