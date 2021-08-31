import { $TSContext } from 'amplify-cli-core';
import { ProviderUtils } from '../import/types';

import { CognitoCLIInputs } from '../service-walkthrough-types/cognito-user-input-types';
import { supportedServices } from '../../supported-services';

export type UserPoolMessageConfiguration = {
  mfaConfiguration?: string;
  mfaTypes?: string[];
  usernameAttributes?: string[];
};

export const doesConfigurationIncludeSMS = (request: CognitoCLIInputs): boolean => {
  if ((request.mfaConfiguration === 'OPTIONAL' || request.mfaConfiguration === 'ON') && request.mfaTypes?.includes('SMS Text Message')) {
    return true;
  }

  return (
    request.usernameAttributes?.some(str =>
      str
        ?.split(',')
        .map(str => str.trim())
        .includes('phone_number'),
    ) || false
  );
};

const getProviderPlugin = (context: $TSContext): ProviderUtils => {
  const serviceMetaData = supportedServices.Cognito;
  const { provider } = serviceMetaData;

  return context.amplify.getPluginInstance(context, provider);
};
export const loadResourceParameters = (context: $TSContext, resourceName: string): UserPoolMessageConfiguration => {
  const providerPlugin = getProviderPlugin(context);
  return providerPlugin.loadResourceParameters(context, 'auth', resourceName) as CognitoCLIInputs;
};

export const loadImportedAuthParameters = async (context: $TSContext, userPoolName: string): Promise<UserPoolMessageConfiguration> => {
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
