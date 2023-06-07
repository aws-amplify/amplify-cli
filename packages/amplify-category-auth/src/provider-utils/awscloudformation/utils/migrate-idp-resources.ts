import { $TSObject, JSONUtilities, pathManager, Template } from '@aws-amplify/amplify-cli-core';

const { readJson } = JSONUtilities;
const { getCurrentCfnTemplatePathFromBuild, getCurrentCloudRootStackCfnTemplatePath } = pathManager;

export const migrateResourcesToCfn = (resourceName: string): boolean => {
  const authCfnTemplatePath = getCurrentCfnTemplatePathFromBuild('auth', resourceName);
  const authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });
  const lambdaCalloutCreatedInCloud = authCfnTemplate?.Resources?.HostedUIProvidersCustomResource?.Type === 'AWS::Lambda::Function';
  const providerCreatedInCloud = hasHostedProviderResources(authCfnTemplate);

  return lambdaCalloutCreatedInCloud && !providerCreatedInCloud;
};

const hasHostedProviderResources = (authCfnTemplate: Template | undefined): boolean => {
  return (
    authCfnTemplate?.Resources?.HostedUIFacebookProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider' ||
    authCfnTemplate?.Resources?.HostedUIGoogleProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider' ||
    authCfnTemplate?.Resources?.HostedUILoginWithAmazonProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider' ||
    authCfnTemplate?.Resources?.HostedUISignInWithAppleProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider'
  );
};

export const exportHostedUIProvidersFromCurrCloudRootStack = (resourceName: string, updatedUIProviderCreds: $TSObject[]): $TSObject[] => {
  const rootCfnTemplatePath = getCurrentCloudRootStackCfnTemplatePath();
  const rootCfnTemplate: Template | undefined = readJson(rootCfnTemplatePath, { throwIfNotExist: false });
  const resource = (rootCfnTemplate?.Resources || {})[`auth${resourceName}`];
  const currProviderCreds = JSON.parse(resource?.Properties?.Parameters?.hostedUIProviderCreds || '[]');

  const mapExistingProviderCreds = (provider: $TSObject) => {
    const hasNotBeenUpdated = Object.keys(provider).length === 1 && 'ProviderName' in provider;

    if (hasNotBeenUpdated) {
      return currProviderCreds.find(({ ProviderName }: $TSObject) => ProviderName === provider.ProviderName) || provider;
    }

    return provider;
  };

  return updatedUIProviderCreds.map(mapExistingProviderCreds);
};
