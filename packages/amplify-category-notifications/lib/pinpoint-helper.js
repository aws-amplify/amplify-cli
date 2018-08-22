const opn = require('opn');
const constants = require('./constants');

const providerName = 'awscloudformation';

async function checkPinpointApp(context) {
  const { amplifyMeta, projectConfig } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.AnalyticsCategoryName]);
    if (pinpointApp) {
      if (!pinpointApp.Name) {
        pinpointApp = await getApp(context, pinpointApp.Id);
      }
    } else {
      pinpointApp = await createApp(context, projectConfig.projectName);
    }
    amplifyMeta[constants.CategoryName] = {};
    amplifyMeta[constants.CategoryName][pinpointApp.Name] = {
      service: constants.PinpointName,
      output: {
        Name: pinpointApp.Name,
        Id: pinpointApp.Id,
      },
    };
  }
  context.exeInfo.serviceMeta = amplifyMeta[constants.CategoryName][pinpointApp.Name];
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
  const pinpointClient = await getPinpointClient(context);
  return new Promise((resolve, reject) => {
    pinpointClient.createApp(params, (err, data) => {
      if (err) {
        context.print.error('Pinpoint app creation error');
        reject(err);
      } else {
        context.print.success(`Successfully created Pinpoint app: ${data.ApplicationResponse.Name}`);
        resolve(data.ApplicationResponse);
      }
    });
  });
}

async function getApp(context, pinpointAppId) {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const pinpointClient = await getPinpointClient(context);
  return new Promise((resolve, reject) => {
    pinpointClient.getApp(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.ApplicationResponse);
      }
    });
  });
}

async function deleteApp(context, pinpointAppId) {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const pinpointClient = await getPinpointClient(context);
  return new Promise((resolve, reject) => {
    pinpointClient.deleteApp(params, (err, data) => {
      if (err) {
        context.print.error('Pinpoint app deletion error');
        reject(err);
      } else {
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
    const { Id } = pinpointApp;
    const consoleUrl =
          `https://console.aws.amazon.com/pinpoint/home/?region=us-east-1#/apps/${Id}/manage/channels`;
    opn(consoleUrl, { wait: false });
  } else {
    context.print.error('Neither notifications nor analytics is anabled in the cloud.');
  }
}

async function getPinpointClient(context) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  const aws = await provider.getConfiguredAWSClient(context);
  return new aws.Pinpoint();
}

module.exports = {
  checkPinpointApp,
  deletePinpointApp,
  getPinpointClient,
  console,
};
