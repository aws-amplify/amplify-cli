'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.loadImportedAuthParameters = exports.loadResourceParameters = exports.doesConfigurationIncludeSMS = void 0;
const supported_services_1 = require('../../supported-services');
const doesConfigurationIncludeSMS = request => {
  var _a, _b;
  if (
    (request.mfaConfiguration === 'OPTIONAL' || request.mfaConfiguration === 'ON') &&
    ((_a = request.mfaTypes) === null || _a === void 0 ? void 0 : _a.includes('SMS Text Message'))
  ) {
    return true;
  }
  return (
    ((_b = request.usernameAttributes) === null || _b === void 0
      ? void 0
      : _b.some(str =>
          str === null || str === void 0
            ? void 0
            : str
                .split(',')
                .map(str => str.trim())
                .includes('phone_number'),
        )) || false
  );
};
exports.doesConfigurationIncludeSMS = doesConfigurationIncludeSMS;
const getProviderPlugin = context => {
  const serviceMetaData = supported_services_1.supportedServices.Cognito;
  const { provider } = serviceMetaData;
  return context.amplify.getPluginInstance(context, provider);
};
const loadResourceParameters = (context, resourceName) => {
  const providerPlugin = getProviderPlugin(context);
  return providerPlugin.loadResourceParameters(context, 'auth', resourceName);
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
