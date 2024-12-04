import assert from 'node:assert';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient, DescribeIdentityProviderCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Parameter } from '@aws-sdk/client-cloudformation';
import { HostedUIProviderMeta, OAuthClient } from './types';

const INVALID_OAUTH_GEN1_PROVIDER_METADATA_ERROR = 'Invalid Gen1 OAuth provider metadata';

const isHostedProviderMetadata = (parsedValue: unknown): parsedValue is HostedUIProviderMeta => {
  return typeof parsedValue === 'object' && parsedValue !== null && 'ProviderName' in parsedValue;
};

export const constructSignInWithApplePrivateKeyParamName = (appId: string, environment: string): string => {
  return `/amplify/${appId}/${environment}/AMPLIFY_SIWA_PRIVATE_KEY`;
};

type RetrieveOAuthValuesParameters = {
  ssmClient: SSMClient;
  cognitoIdpClient: CognitoIdentityProviderClient;
  oAuthParameter: Parameter;
  userPoolId: string;
  appId: string;
  environmentName: string;
};
/**
 * Retrieves OAuth values from Cognito and SSM
 * @param ssmClient
 * @param cognitoIdpClient
 * @param oAuthParameter
 * @param userPoolId
 * @param appId
 * @param environmentName
 * @returns RetrieveOAuthValuesParameters
 */
const retrieveOAuthValues = async ({
  ssmClient,
  cognitoIdpClient,
  oAuthParameter,
  userPoolId,
  appId,
  environmentName,
}: RetrieveOAuthValuesParameters) => {
  const value = oAuthParameter.ParameterValue;
  assert(value);
  const parsedValue = JSON.parse(value);
  if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
    throw new Error(INVALID_OAUTH_GEN1_PROVIDER_METADATA_ERROR);
  }

  const oAuthClientValues: OAuthClient[] = [];
  for (const provider of parsedValue) {
    if (!isHostedProviderMetadata(provider)) {
      throw new Error(INVALID_OAUTH_GEN1_PROVIDER_METADATA_ERROR);
    }

    const { ProviderName } = provider;
    const { IdentityProvider } = await cognitoIdpClient.send(
      new DescribeIdentityProviderCommand({
        UserPoolId: userPoolId,
        ProviderName,
      }),
    );
    const providerDetails = IdentityProvider?.ProviderDetails;
    assert(providerDetails);
    const { client_id, client_secret, team_id, key_id } = providerDetails;
    if (ProviderName === 'SignInWithApple') {
      // Retrieve private key
      const { Parameter: PrivateKeyParameter } = await ssmClient.send(
        new GetParameterCommand({
          Name: constructSignInWithApplePrivateKeyParamName(appId, environmentName),
          WithDecryption: true,
        }),
      );
      assert(PrivateKeyParameter);
      const privateKey = PrivateKeyParameter.Value;
      assert(privateKey);
      oAuthClientValues.push({
        ProviderName,
        client_id,
        client_secret,
        team_id,
        key_id,
        private_key: privateKey,
      });
    } else {
      oAuthClientValues.push({
        ProviderName,
        client_id,
        client_secret,
        team_id,
        key_id,
      });
    }
  }
  return oAuthClientValues;
};

export default retrieveOAuthValues;
