const open = require('open');
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

async function ensurePinpointApp(context, resourceName) {
  const { amplifyMeta, localEnvInfo } = context.exeInfo;
  const scanOptions = {
    isRegulatingResourceName: true,
    envName: localEnvInfo.envName,
  };
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName], scanOptions);
  if (pinpointApp) {
    resourceName = scanOptions.regulatedResourceName;
  } else {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
    if (pinpointApp) {
      resourceName = generateResourceName(pinpointApp.Name, localEnvInfo.envName);
      constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
    } else {
      context.print.info('');
      resourceName = await createPinpointApp(context, resourceName);
    }
  }
  context.exeInfo.serviceMeta =
    context.exeInfo.amplifyMeta[constants.CategoryName][resourceName];
  context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
}

// rerouce name is consistent cross environments
function generateResourceName(pinpointAppName, envName) {
  return pinpointAppName.replace(getEnvTagPattern(envName), '');
}

function generatePinpoinAppName(resourceName, envName) {
  return resourceName + getEnvTagPattern(envName);
}

function getEnvTagPattern(envName) {
  return envName === 'NONE' ? '' : `-${envName}`;
}

async function createPinpointApp(context, resourceName) {
  const { projectConfig, amplifyMeta, localEnvInfo } = context.exeInfo;

  context.print.info('An Amazon Pinpoint project will be created for notifications.');
  if (!resourceName) {
    resourceName = projectConfig.projectName + context.amplify.makeId(5);
    if (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes) {
      const answer = await inquirer.prompt({
        name: 'resourceNameInput',
        type: 'input',
        message: 'Provide your pinpoint resource name: ',
        default: resourceName,
        validate: (name) => {
          let result = false;
          let message = '';
          if (name && name.length > 0) {
            result = true;
          } else {
            message = 'Your pinpoint resource name can not be empty.';
          }
          return result || message;
        },
      });
      resourceName = answer.resourceNameInput;
    }
  }

  const pinpointAppName = generatePinpoinAppName(resourceName, localEnvInfo.envName);
  const pinpointApp = await createApp(context, pinpointAppName);
  constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
  context.exeInfo.pinpointApp = pinpointApp; // needed for authHelper.ensureAuth(context);

  context.print.info('');
  await authHelper.ensureAuth(context);
  context.print.info('');

  return resourceName;
}

function constructResourceMeta(amplifyMeta, resourceName, pinpointApp) {
  amplifyMeta[constants.CategoryName] = amplifyMeta[constants.CategoryName] || {};
  amplifyMeta[constants.CategoryName][resourceName] = {
    service: constants.PinpointName,
    output: {
      Name: pinpointApp.Name,
      Id: pinpointApp.Id,
      Region: pinpointApp.Region,
    },
    lastPushTimeStamp: new Date(),
  };
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

function scanCategoryMetaForPinpoint(categoryMeta, options) {
  let result;
  if (categoryMeta) {
    let resourceName;
    const resources = Object.keys(categoryMeta);
    for (let i = 0; i < resources.length; i++) {
      resourceName = resources[i];
      const serviceMeta = categoryMeta[resourceName];
      if (serviceMeta.service === constants.PinpointName &&
        serviceMeta.output &&
        serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
        };
        result.Name = serviceMeta.output.Name || serviceMeta.output.appName;
        result.Region = serviceMeta.output.Region;

        if (options && options.isRegulatingResourceName) {
          const regulatedResourceName = generateResourceName(result.Name, options.envName);
          options.regulatedResourceName = regulatedResourceName;
          if (resourceName !== regulatedResourceName) {
            categoryMeta[regulatedResourceName] = serviceMeta;
            delete categoryMeta[resourceName];
          }
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
          `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/settings`;
    open(consoleUrl, { wait: false });
  } else {
    context.print.error('Neither notifications nor analytics is enabled in the cloud.');
  }
}

async function getPinpointClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
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
  scanCategoryMetaForPinpoint,
  console,
};
