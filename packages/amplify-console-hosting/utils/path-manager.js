const path = require('path');
const constants = require('../constants/plugin-constants');

function getBackendDirPath(context) {
  return context.amplify.pathManager.getBackendDirPath();
}

function getHostingDirPath(context) {
  return path.join(getBackendDirPath(context), constants.CATEGORY);
}

function getAmplifyHostingDirPath(context) {
  return path.join(
    getBackendDirPath(context),
    constants.CATEGORY,
    constants.CONSOLE_RESOURCE_NAME,
  );
}

function getTemplatePath(context) {
  return path.join(
    getAmplifyHostingDirPath(context),
    constants.TEMPLATE_FILE_NAME,
  );
}

function getProviderInfoFilePath(context) {
  return context.amplify.pathManager.getProviderInfoFilePath();
}

function getBackendConfigPath(context) {
  return context.amplify.pathManager.getBackendConfigFilePath();
}

function getAmplifyMetaFilePath(context) {
  return context.amplify.pathManager.getAmplifyMetaFilePath();
}

function getCurrentAmplifyMetaFilePath(context) {
  return context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
}

function getCurrentCloudBackendDirPath(context) {
  return context.amplify.pathManager.getCurrentCloudBackendDirPath();
}

function getCurrCloudBackendHostingDirPath(context) {
  return path.join(getCurrentCloudBackendDirPath(context), constants.CATEGORY);
}

function getCurrBackendConfigFilePath(context) {
  return context.amplify.pathManager.getCurrentBackendConfigFilePath();
}

function getCurrCloudBackendAmplifyHostingDirPath(context) {
  return path.join(
    getCurrCloudBackendHostingDirPath(context),
    constants.CONSOLE_RESOURCE_NAME,
  );
}

module.exports = {
  getBackendDirPath,
  getHostingDirPath,
  getAmplifyHostingDirPath,
  getTemplatePath,
  getProviderInfoFilePath,
  getBackendConfigPath,
  getAmplifyMetaFilePath,
  getCurrentAmplifyMetaFilePath,
  getCurrentCloudBackendDirPath,
  getCurrCloudBackendHostingDirPath,
  getCurrCloudBackendAmplifyHostingDirPath,
  getCurrBackendConfigFilePath,
};
