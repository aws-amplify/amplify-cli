import { $TSObject, JSONUtilities, pathManager, Template } from '@aws-amplify/amplify-cli-core';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { getUserPoolId } from './get-user-pool-id';

const { readJson } = JSONUtilities;
const { getCurrentCfnTemplatePathFromBuild } = pathManager;

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

export const exportHostedUIProvidersFromCurrCloudRootStack = async (
  resourceName: string,
  providerMeta: $TSObject[],
  updatedUIProviderCreds: $TSObject[],
): Promise<$TSObject[]> => {
  const userPoolId = getUserPoolId(resourceName);

  const mapExistingProviderCreds = async (provider: $TSObject) => {
    const providerCreds = updatedUIProviderCreds?.find(({ ProviderName }) => ProviderName === provider.ProviderName) || {};
    const hasEmptyCreds = Object.keys(providerCreds).length === 0;
    const hasNotBeenUpdated = providerCreds && Object.keys(providerCreds).length === 1 && 'ProviderName' in providerCreds;

    if ((hasNotBeenUpdated || hasEmptyCreds) && userPoolId) {
      const thisCreds = (await getProviderCreds(userPoolId, provider.ProviderName)) || providerCreds;
      thisCreds.ProviderName = provider.ProviderName;
      return thisCreds;
    }

    return providerCreds;
  };

  return await Promise.all(providerMeta.map(mapExistingProviderCreds));
};

export const getProviderCreds = async (
  userPoolId: string,
  providerName: string,
): Promise<CognitoIdentityServiceProvider.ProviderDetailsType | undefined> => {
  const cognito = new CognitoIdentityServiceProvider();

  const provider: CognitoIdentityServiceProvider.DescribeIdentityProviderResponse = await cognito
    .describeIdentityProvider({ UserPoolId: userPoolId, ProviderName: providerName })
    .promise();

  return provider?.IdentityProvider?.ProviderDetails;
};
