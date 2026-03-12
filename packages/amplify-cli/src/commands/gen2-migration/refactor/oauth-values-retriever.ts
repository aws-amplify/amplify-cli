import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient, DescribeIdentityProviderCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

type BaseOAuthClient = { readonly ProviderName: string; readonly client_id: string };
type OAuthClientWithSecret = BaseOAuthClient & { readonly client_secret: string };
type SignInWithAppleOAuthClient = BaseOAuthClient & { readonly team_id: string; readonly key_id: string; readonly private_key: string };
export type OAuthClient = OAuthClientWithSecret | SignInWithAppleOAuthClient;

type HostedUIProviderMeta = {
  readonly ProviderName: 'Amazon' | 'Facebook' | 'Google' | 'SignInWithApple';
};

const isHostedProviderMetadata = (value: unknown): value is HostedUIProviderMeta => {
  return typeof value === 'object' && value !== null && 'ProviderName' in value;
};

/**
 * Constructs the SSM parameter name for the Sign In With Apple private key.
 */
export function constructSignInWithApplePrivateKeyParamName(appId: string, environment: string): string {
  return `/amplify/${appId}/${environment}/AMPLIFY_SIWA_PRIVATE_KEY`;
}

interface RetrieveOAuthValuesParams {
  readonly ssmClient: SSMClient;
  readonly cognitoIdpClient: CognitoIdentityProviderClient;
  readonly oAuthParameter: Parameter;
  readonly userPoolId: string;
  readonly appId: string;
  readonly environmentName: string;
}

/**
 * Retrieves OAuth client credentials from Cognito identity providers and SSM.
 */
export async function retrieveOAuthValues({
  ssmClient,
  cognitoIdpClient,
  oAuthParameter,
  userPoolId,
  appId,
  environmentName,
}: RetrieveOAuthValuesParams): Promise<OAuthClient[]> {
  const value = oAuthParameter.ParameterValue;
  if (!value) {
    throw new AmplifyError('MissingExpectedParameterError', {
      message: "OAuth parameter 'hostedUIProviderMeta' has no value",
    });
  }

  const parsedValue = JSON.parse(value);
  if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
    throw new AmplifyError('InputValidationError', {
      message: "OAuth parameter 'hostedUIProviderMeta' must be a non-empty array of provider metadata",
    });
  }

  const oAuthClients: OAuthClient[] = [];
  for (const provider of parsedValue) {
    if (!isHostedProviderMetadata(provider)) {
      throw new AmplifyError('InputValidationError', {
        message: `Invalid OAuth provider metadata: ${JSON.stringify(provider)}`,
      });
    }

    const { ProviderName } = provider;
    const { IdentityProvider } = await cognitoIdpClient.send(new DescribeIdentityProviderCommand({ UserPoolId: userPoolId, ProviderName }));
    const providerDetails = IdentityProvider?.ProviderDetails;
    if (!providerDetails) {
      throw new AmplifyError('ResourceNotReadyError', {
        message: `OAuth provider '${ProviderName}' returned no provider details from Cognito`,
      });
    }

    const { client_id, client_secret, team_id, key_id } = providerDetails;
    if (!client_id) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: `OAuth provider '${ProviderName}' has no client_id in Cognito provider details`,
      });
    }

    if (ProviderName === 'SignInWithApple') {
      if (!team_id || !key_id) {
        throw new AmplifyError('MissingExpectedParameterError', {
          message: `SignInWithApple provider is missing team_id or key_id in Cognito provider details`,
        });
      }
      const { Parameter: privateKeyParam } = await ssmClient.send(
        new GetParameterCommand({
          Name: constructSignInWithApplePrivateKeyParamName(appId, environmentName),
          WithDecryption: true,
        }),
      );
      const privateKey = privateKeyParam?.Value;
      if (!privateKey) {
        throw new AmplifyError('ParameterNotFoundError', {
          message: `SignInWithApple private key not found in SSM at '${constructSignInWithApplePrivateKeyParamName(
            appId,
            environmentName,
          )}'`,
        });
      }
      oAuthClients.push({ ProviderName, client_id, team_id, key_id, private_key: privateKey });
    } else {
      if (!client_secret) {
        throw new AmplifyError('MissingExpectedParameterError', {
          message: `OAuth provider '${ProviderName}' has no client_secret in Cognito provider details`,
        });
      }
      oAuthClients.push({ ProviderName, client_id, client_secret });
    }
  }

  return oAuthClients;
}
