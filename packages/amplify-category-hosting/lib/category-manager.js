const fs = require('fs-extra');
const path = require('path');
const constants = require('./constants');
const supportedServices = require('./supported-services');

function getAvailableServices(context) {
  const availableServices = [];
  const projectConfig = context.amplify.getProjectConfig();
  Object.keys(supportedServices).forEach((service) => {
    if (Object.keys(projectConfig.providers).includes(supportedServices[service].provider)) {
      availableServices.push(service);
    }
  });
  return availableServices;
}

function getCategoryStatus(context) {
  const enabledServices = [];
  const disabledServices = [];

  const availableServices = getAvailableServices(context);
  if (availableServices.length > 0) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const categoryDirPath = path.join(projectBackendDirPath, constants.CategoryName);
    if (fs.existsSync(categoryDirPath)) {
      const serviceDirnames = fs.readdirSync(categoryDirPath);
      for (let i = 0; i < serviceDirnames.length; i++) {
        const serviceDirPath = path.join(categoryDirPath, serviceDirnames[i]);
        const stat = fs.lstatSync(serviceDirPath);
        if (stat.isDirectory()) {
          if (availableServices.includes(serviceDirnames[i])) {
            enabledServices.push(serviceDirnames[i]);
          }
        }
      }
    }
    availableServices.forEach((service) => {
      if (!enabledServices.includes(service)) {
        disabledServices.push(service);
      }
    });
  }

  return {
    availableServices,
    enabledServices,
    disabledServices,
  };
}

function runServiceAction(context, service, action, args) {
  const serviceModule = require(path.join(__dirname, `${service}/index.js`));
  return serviceModule[action](context, args);
}

module.exports = {
  getCategoryStatus,
  runServiceAction,
};
