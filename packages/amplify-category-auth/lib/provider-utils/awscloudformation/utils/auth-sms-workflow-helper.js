"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadImportedAuthParameters = exports.loadResourceParameters = exports.doesConfigurationIncludeSMS = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const supported_services_1 = require("../../supported-services");
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const doesConfigurationIncludeSMS = (request) => {
    var _a, _b;
    if ((request.mfaConfiguration === 'OPTIONAL' || request.mfaConfiguration === 'ON') && ((_a = request.mfaTypes) === null || _a === void 0 ? void 0 : _a.includes('SMS Text Message'))) {
        return true;
    }
    return (((_b = request.usernameAttributes) === null || _b === void 0 ? void 0 : _b.some((str) => str === null || str === void 0 ? void 0 : str.split(',').map((str) => str.trim()).includes('phone_number'))) || false);
};
exports.doesConfigurationIncludeSMS = doesConfigurationIncludeSMS;
const getProviderPlugin = (context) => {
    const serviceMetaData = (0, supported_services_1.getSupportedServices)().Cognito;
    const { provider } = serviceMetaData;
    return context.amplify.getPluginInstance(context, provider);
};
async function loadResourceParametersLegacyCode(authResourceName) {
    const legacyParameters = await amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
    const userPoolMessageConfig = {
        mfaConfiguration: legacyParameters.mfaConfiguration,
        mfaTypes: legacyParameters.mfaTypes,
        usernameAttributes: legacyParameters.usernameAttributes,
    };
    return userPoolMessageConfig;
}
const loadResourceParameters = async (context, authResourceName) => {
    const cliState = new auth_input_state_1.AuthInputState(context, authResourceName);
    let userPoolMessageConfig;
    try {
        userPoolMessageConfig = (await cliState.loadResourceParameters(context, cliState.getCLIInputPayload()));
    }
    catch (error) {
        userPoolMessageConfig = await loadResourceParametersLegacyCode(authResourceName);
    }
    return userPoolMessageConfig;
};
exports.loadResourceParameters = loadResourceParameters;
const loadImportedAuthParameters = async (context, userPoolName) => {
    const providerPlugin = getProviderPlugin(context);
    const cognitoUserPoolService = await providerPlugin.createCognitoUserPoolService(context);
    const userPoolDetails = await cognitoUserPoolService.getUserPoolDetails(userPoolName);
    const mfaConfig = await cognitoUserPoolService.getUserPoolMfaConfig(userPoolName);
    return {
        mfaConfiguration: mfaConfig.MfaConfiguration,
        usernameAttributes: userPoolDetails.UsernameAttributes,
        mfaTypes: mfaConfig.SmsMfaConfiguration ? ['SMS Text Message'] : [],
    };
};
exports.loadImportedAuthParameters = loadImportedAuthParameters;
//# sourceMappingURL=auth-sms-workflow-helper.js.map