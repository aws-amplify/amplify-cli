const path = require('path');
const constants = require('../constants/plugin-constants');

function getBackendDirPath(context) {
    return context.amplify.pathManager.getBackendDirPath();
}

function getHostingDirPath(context) {
    return path.join(getBackendDirPath(context), constants.CATEGORY);
}

function getAmplifyHostingDirPath(context) {
    return path.join(getBackendDirPath(context), constants.CATEGORY, constants.CONSOLE_RESOURCE_NAME);
}

function getTemplatePath(context) {
    return path.join(getAmplifyHostingDirPath(context), constants.TEMPLATE_FILE_NAME);
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

module.exports = {
    getBackendDirPath,
    getHostingDirPath,
    getAmplifyHostingDirPath,
    getTemplatePath,
    getProviderInfoFilePath,
    getBackendConfigPath,
    getAmplifyMetaFilePath
}