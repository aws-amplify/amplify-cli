import { $TSContext } from 'amplify-cli-core';
import { ProviderUtils } from '../import/types';
import { getSupportedServices } from '../../supported-services';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';

export type UserPoolMessageConfiguration = {
  mfaConfiguration?: string;
  mfaTypes?: string[];
  usernameAttributes?: string[];
};

export const doesConfigurationIncludeSMS = (request: CognitoConfiguration | ServiceQuestionHeadlessResult): boolean => {
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
  const serviceMetaData = getSupportedServices().Cognito;
  const { provider } = serviceMetaData;

  return context.amplify.getPluginInstance(context, provider);
};
export const loadResourceParameters = async (context: $TSContext, resourceName: string): Promise<UserPoolMessageConfiguration> => {
  const cliState = new AuthInputState(resourceName);
  const userPoolMessageConfig = (await cliState.loadResourceParameters(
    context,
    cliState.getCLIInputPayload(),
  )) as UserPoolMessageConfiguration;
  return userPoolMessageConfig;
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
