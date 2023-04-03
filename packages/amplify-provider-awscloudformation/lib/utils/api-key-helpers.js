"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyIsActive = exports.getApiKeyConfig = exports.getAppSyncApiConfig = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function getAppSyncApiConfig() {
    var _a;
    const apiConfig = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.api;
    let appSyncApi;
    Object.keys(apiConfig).forEach((k) => {
        if (apiConfig[k]['service'] === 'AppSync')
            appSyncApi = apiConfig[k];
    });
    return appSyncApi;
}
exports.getAppSyncApiConfig = getAppSyncApiConfig;
function getDefaultIfApiKey() {
    var _a, _b;
    const authConfig = (_b = (_a = getAppSyncApiConfig()) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.authConfig;
    const { defaultAuthentication } = authConfig;
    if (defaultAuthentication.authenticationType === 'API_KEY')
        return defaultAuthentication.apiKeyConfig;
    return undefined;
}
function getAdditionalApiKeyConfig() {
    var _a, _b;
    const authConfig = (_b = (_a = getAppSyncApiConfig()) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.authConfig;
    const { additionalAuthenticationProviders } = authConfig;
    let apiKeyConfig;
    additionalAuthenticationProviders.forEach((authProvider) => {
        if (authProvider.authenticationType === 'API_KEY')
            apiKeyConfig = authProvider.apiKeyConfig;
    });
    return apiKeyConfig;
}
function getApiKeyConfig() {
    const emptyConfig = {};
    return getDefaultIfApiKey() || getAdditionalApiKeyConfig() || emptyConfig;
}
exports.getApiKeyConfig = getApiKeyConfig;
function apiKeyIsActive() {
    const today = new Date();
    const { apiKeyExpirationDate } = getApiKeyConfig() || {};
    if (!apiKeyExpirationDate)
        return false;
    return new Date(apiKeyExpirationDate) > today;
}
exports.apiKeyIsActive = apiKeyIsActive;
//# sourceMappingURL=api-key-helpers.js.map