import { retrieveOAuthValues } from '../../../../commands/gen2-migration/refactor-new/oauth-values-retriever';
import { mockClient } from 'aws-sdk-client-mock';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient, DescribeIdentityProviderCommand } from '@aws-sdk/client-cognito-identity-provider';

describe('retrieveOAuthValues', () => {
  let ssmMock: ReturnType<typeof mockClient>;
  let cognitoMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    ssmMock = mockClient(SSMClient);
    cognitoMock = mockClient(CognitoIdentityProviderClient);
  });
  afterEach(() => {
    ssmMock.restore();
    cognitoMock.restore();
  });

  it('retrieves standard provider credentials from Cognito', async () => {
    cognitoMock.on(DescribeIdentityProviderCommand).resolves({
      IdentityProvider: { ProviderDetails: { client_id: 'google-id', client_secret: 'google-secret' } },
    });

    const result = await retrieveOAuthValues({
      ssmClient: new SSMClient({}),
      cognitoIdpClient: new CognitoIdentityProviderClient({}),
      oAuthParameter: { ParameterKey: 'hostedUIProviderMeta', ParameterValue: JSON.stringify([{ ProviderName: 'Google' }]) },
      userPoolId: 'us-east-1_ABC',
      appId: 'app1',
      environmentName: 'main',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ ProviderName: 'Google', client_id: 'google-id', client_secret: 'google-secret' });
  });

  it('retrieves SignInWithApple credentials from Cognito + SSM private key', async () => {
    cognitoMock.on(DescribeIdentityProviderCommand).resolves({
      IdentityProvider: { ProviderDetails: { client_id: 'apple-id', team_id: 'TEAM1', key_id: 'KEY1' } },
    });
    ssmMock.on(GetParameterCommand).resolves({ Parameter: { Value: 'private-key-pem' } });

    const result = await retrieveOAuthValues({
      ssmClient: new SSMClient({}),
      cognitoIdpClient: new CognitoIdentityProviderClient({}),
      oAuthParameter: { ParameterKey: 'hostedUIProviderMeta', ParameterValue: JSON.stringify([{ ProviderName: 'SignInWithApple' }]) },
      userPoolId: 'us-east-1_ABC',
      appId: 'app1',
      environmentName: 'main',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ProviderName: 'SignInWithApple',
      client_id: 'apple-id',
      team_id: 'TEAM1',
      key_id: 'KEY1',
      private_key: 'private-key-pem',
    });
  });

  it('throws when provider details are missing from Cognito', async () => {
    cognitoMock.on(DescribeIdentityProviderCommand).resolves({ IdentityProvider: {} });

    await expect(
      retrieveOAuthValues({
        ssmClient: new SSMClient({}),
        cognitoIdpClient: new CognitoIdentityProviderClient({}),
        oAuthParameter: { ParameterKey: 'hostedUIProviderMeta', ParameterValue: JSON.stringify([{ ProviderName: 'Google' }]) },
        userPoolId: 'us-east-1_ABC',
        appId: 'app1',
        environmentName: 'main',
      }),
    ).rejects.toThrow('no provider details');
  });
});
