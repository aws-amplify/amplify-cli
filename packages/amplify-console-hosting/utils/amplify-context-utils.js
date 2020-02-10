const constants = require('../constants/plugin-constants');

function getAppIdForCurrEnv(context) {
    const currEnv = getCurrEnv(context);
    const teamProviderInfo = getTeamProviderInfo(context);
    return teamProviderInfo[currEnv][constants.PROVIDER][constants.APPID_KEY];
}

function getCurrEnv(context) {
    const { amplify } = context;
    return amplify.getEnvInfo().envName;
}

function getTeamProviderInfo(context) {
    const { amplify } = context;
    const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
    const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
    return teamProviderInfo;
}

function getProjectConfig(context) {
    return context.amplify.getProjectConfig();
}

function getLocalEnvInfo(context) {
    return context.amplify.getEnvInfo();
}

function getRegionForCurrEnv(context) {
    return context.amplify.getProjectMeta().providers.awscloudformation.Region;
}

module.exports = {
    getAppIdForCurrEnv,
    getTeamProviderInfo,
    getCurrEnv,
    getProjectConfig,
    getLocalEnvInfo,
    getRegionForCurrEnv
}


