import { JSONUtilities, pathManager, Template } from '@aws-amplify/amplify-cli-core';
import { CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import { ProviderCreds } from '../auth-stack-builder/types';

const { readJson } = JSONUtilities;
const { getCurrentCfnTemplatePathFromBuild, getCurrentCloudRootStackCfnTemplatePath, findProjectRoot } = pathManager;

export const migrateResourcesToCfn = (props: CognitoStackOptions): boolean => {
  const authCfnTemplatePath = getCurrentCfnTemplatePathFromBuild(findProjectRoot() || '', 'auth', props.resourceName);
  const authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });
  const lambdaCalloutCreatedInCloud = authCfnTemplate?.Resources?.HostedUIProvidersCustomResource?.Type === 'AWS::Lambda::Function';
  const providerCreatedInCloud = authCfnTemplate?.Resources?.HostedUIProviderResource?.Type === 'AWS::Cognito::UserPoolIdentityProvider';

  return lambdaCalloutCreatedInCloud && !providerCreatedInCloud;
};

export const exportHostedUIProvidersFromCurrCloudRootStack = (
  resourceName: string,
  updatedUIProviderCreds: ProviderCreds[],
): ProviderCreds[] => {
  const rootCfnTemplatePath = getCurrentCloudRootStackCfnTemplatePath(findProjectRoot() || '');
  const rootCfnTemplate: Template | undefined = readJson(rootCfnTemplatePath, { throwIfNotExist: false });
  const resource = (rootCfnTemplate?.Resources || {})[`auth${resourceName}`];
  const currProviderCreds = JSON.parse(resource?.Properties?.Parameters?.hostedUIProviderCreds || '[]');

  const mapExistingProviderCreds = (provider: ProviderCreds) => {
    const hasNotBeenUpdated = Object.keys(provider).length === 1 && 'ProviderName' in provider;

    if (hasNotBeenUpdated) {
      return currProviderCreds.find(({ ProviderName }: ProviderCreds) => ProviderName === provider.ProviderName);
    }

    return provider;
  };

  return updatedUIProviderCreds.map(mapExistingProviderCreds);
};
