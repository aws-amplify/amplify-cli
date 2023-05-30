import { $TSObject, JSONUtilities, pathManager, Template } from '@aws-amplify/amplify-cli-core';

const { readJson } = JSONUtilities;
const { getCurrentCfnTemplatePathFromBuild, getCurrentCloudRootStackCfnTemplatePath, findProjectRoot } = pathManager;

export const migrateResourcesToCfn = (resourceName: string): boolean => {
  const authCfnTemplatePath = getCurrentCfnTemplatePathFromBuild(findProjectRoot() || '', 'auth', resourceName);
  const authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });
  const lambdaCalloutCreatedInCloud = authCfnTemplate?.Resources?.HostedUIProvidersCustomResource?.Type === 'AWS::Lambda::Function';
  const providerCreatedInCloud = authCfnTemplate?.Resources?.HostedUIProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider';

  return lambdaCalloutCreatedInCloud && !providerCreatedInCloud;
};

export const exportHostedUIProvidersFromCurrCloudRootStack = (resourceName: string, updatedUIProviderCreds: $TSObject[]): $TSObject[] => {
  const rootCfnTemplatePath = getCurrentCloudRootStackCfnTemplatePath(findProjectRoot() || '');
  const rootCfnTemplate: Template | undefined = readJson(rootCfnTemplatePath, { throwIfNotExist: false });
  const resource = (rootCfnTemplate?.Resources || {})[`auth${resourceName}`];
  const currProviderCreds = JSON.parse(resource?.Properties?.Parameters?.hostedUIProviderCreds || '[]');

  const mapExistingProviderCreds = (provider: $TSObject) => {
    const hasNotBeenUpdated = Object.keys(provider).length === 1 && 'ProviderName' in provider;

    if (hasNotBeenUpdated) {
      return currProviderCreds.find(({ ProviderName }: $TSObject) => ProviderName === provider.ProviderName);
    }

    return provider;
  };

  return updatedUIProviderCreds.map(mapExistingProviderCreds);
};
