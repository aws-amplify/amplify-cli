import _ from "lodash";

export function isAuthModeUpdated(options): boolean {
  const { authConfig, previousAuthConfig } = getAuthConfigForCompare(options);
  return authConfig && previousAuthConfig && !_.isEqual(authConfig, previousAuthConfig);
}

function getAuthConfigForCompare(options) {
  if (!(options.authConfig && options.previousAuthConfig)) {
    return {};
  }

  // Deep copy the authConfig for comparision
  let authConfig = _.cloneDeep(options.authConfig);
  let previousAuthConfig = _.cloneDeep(options.previousAuthConfig);

  // Remove apiKeyExpirationDate key for comparision as this may change even if there are no auth mode changes
  if (authConfig) {
    authConfig.defaultAuthentication = removeApiKeyExpirationDate(authConfig.defaultAuthentication);
    authConfig.additionalAuthenticationProviders = authConfig.additionalAuthenticationProviders?.map(mode => removeApiKeyExpirationDate(mode));
  }
  if (previousAuthConfig) {
    previousAuthConfig.defaultAuthentication = removeApiKeyExpirationDate(previousAuthConfig.defaultAuthentication);
    previousAuthConfig.additionalAuthenticationProviders = previousAuthConfig.additionalAuthenticationProviders?.map(mode => removeApiKeyExpirationDate(mode));
  }

  return {
    authConfig,
    previousAuthConfig,
  };
}

function removeApiKeyExpirationDate(mode) {
  if (mode?.apiKeyConfig) {
    delete mode.apiKeyConfig.apiKeyExpirationDate;
  }
  return mode;
}