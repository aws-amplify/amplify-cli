import { $TSContext } from 'amplify-cli-core';
import { CognitoIdentityProvider, IdentityPool } from 'aws-sdk/clients/cognitoidentity';
import { ICognitoUserPoolService, IIdentityPoolService } from 'amplify-util-import';
import { ProviderUtils } from '../import/types';

import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { supportedServices } from '../../supported-services';

export type UserPoolMessageConfiguration = {
  mfaConfiguration?: string;
  mfaTypes?: string[];
  usernameAttributes?: string[];
};

export const doesConfigurationIncludeSMS = (request: UserPoolMessageConfiguration): boolean => {
  if ((request.mfaConfiguration === 'OPTIONAL' || request.mfaConfiguration === 'ON') && request.mfaTypes?.includes('SMS Text Message')) {
    return true;
  }

  if (request.usernameAttributes?.includes('phone_number')) {
    return true;
  }

  return false;
};

const getProviderPlugin = (context: $TSContext): ProviderUtils => {
  const serviceMetaData = supportedServices.Cognito;
  const { provider } = serviceMetaData;

  return context.amplify.getPluginInstance(context, provider);
};
export const loadResourceParameters = (context: $TSContext, resourceName: string): UserPoolMessageConfiguration => {
  const providerPlugin = getProviderPlugin(context);
  return providerPlugin.loadResourceParameters(context, 'auth', resourceName) as ServiceQuestionsResult;
};

export const loadImportedAuthParameters = async (context: $TSContext, userPoolName: string): Promise<UserPoolMessageConfiguration> => {
  const providerPlugin = getProviderPlugin(context);
  const cognitoUserPoolService = await providerPlugin.createCognitoUserPoolService(context);
  const cupDetails = await cognitoUserPoolService.getUserPoolDetails(userPoolName);
  const mfaConfig = await cognitoUserPoolService.getUserPoolMfaConfig(userPoolName);
  return {
    mfaConfiguration: mfaConfig.MfaConfiguration,
    usernameAttributes: cupDetails.UsernameAttributes,
    mfaTypes: mfaConfig.SmsMfaConfiguration ? ['SMS TextMessage'] : [],
  };
};
