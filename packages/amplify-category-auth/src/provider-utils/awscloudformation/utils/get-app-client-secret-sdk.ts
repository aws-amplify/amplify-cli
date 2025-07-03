import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';

export const getAppClientSecret = async (context: $TSContext, userpoolId: string, clientId: string): Promise<string | undefined> => {
  try {
    const identity = await getCognitoIdentityProviderClient(context);
    const params = {
      ClientId: clientId,
      UserPoolId: userpoolId,
    };
    const command = new DescribeUserPoolClientCommand(params);
    const result = await identity.send(command);
    return result.UserPoolClient?.ClientSecret;
  } catch (error) {
    throw new AmplifyFault(
      'ServiceCallFault',
      {
        message: error.message,
      },
      error,
    );
  }
};

const getCognitoIdentityProviderClient = async (context: $TSContext): Promise<CognitoIdentityProviderClient> => {
  const { client } = await context.amplify.invokePluginMethod<{ client: CognitoIdentityProviderClient }>(
    context,
    'awscloudformation',
    undefined,
    'getConfiguredCognitoIdentityProviderClient',
    [context],
  );
  return client;
};
