const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const { stateManager } = require('@aws-amplify/amplify-cli-core');
function getAppIdForCurrEnv() {
    var _a, _b, _c;
    return (_c = (_b = (_a = stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation) === null || _c === void 0 ? void 0 : _c[constants.APPID_KEY];
}
function getCurrEnv(context) {
    const { amplify } = context;
    return amplify.getEnvInfo().envName;
}
function getMetaInfo(context) {
    const { amplify } = context;
    const metaInfoPath = pathManager.getAmplifyMetaFilePath(context);
    return amplify.readJsonFile(metaInfoPath);
}
function getBackendInfoConfig(context) {
    const { amplify } = context;
    const backendConfigFilePath = pathManager.getBackendConfigPath(context);
    const backendConfig = fs.existsSync(backendConfigFilePath) ? amplify.readJsonFile(backendConfigFilePath) : undefined;
    return backendConfig;
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
    getBackendInfoConfig,
    getCurrEnv,
    getProjectConfig,
    getLocalEnvInfo,
    getRegionForCurrEnv,
    getMetaInfo,
};
//# sourceMappingURL=amplify-context-utils.js.map