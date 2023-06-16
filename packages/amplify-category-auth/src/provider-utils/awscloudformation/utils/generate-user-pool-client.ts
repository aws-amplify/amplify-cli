import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ICognitoUserPoolService } from '@aws-amplify/amplify-util-import';
import { getProviderPlugin } from './get-provider-plugin';

export const generateUserPoolClient = async (context: $TSContext): Promise<ICognitoUserPoolService> => {
  const providerPlugin = getProviderPlugin(context);
  const cognitoUserPoolService = await providerPlugin.createCognitoUserPoolService(context);

  return cognitoUserPoolService;
};
