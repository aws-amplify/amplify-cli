import oauthValuesRetriever from '../../../../commands/gen2-migration/refactor/oauth-values-retriever';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const INVALID_OAUTH_METADATA_PARAM = 'Invalid Gen1 OAuth provider metadata';
const APP_ID = 'appId';
const ENV_NAME = 'envName';
const USER_POOL_ID = 'userPoolId';

// This test suite covers negative cases. Happy path cases are covered in its consumer (category-template-generator.test.ts)
describe('OAuthValuesRetriever', () => {
  it('should fail if the oauth param is not an array', async () => {
    await expect(
      oauthValuesRetriever({
        appId: APP_ID,
        environmentName: ENV_NAME,
        userPoolId: USER_POOL_ID,
        oAuthParameter: {
          ParameterKey: 'hostedUIProviderMeta',
          ParameterValue: JSON.stringify({}),
        },
        ssmClient: new SSMClient(),
        cognitoIdpClient: new CognitoIdentityProviderClient(),
      }),
    ).rejects.toThrowError(INVALID_OAUTH_METADATA_PARAM);
  });
  it('should fail if the oauth param does not have provider info', async () => {
    await expect(
      oauthValuesRetriever({
        appId: APP_ID,
        environmentName: ENV_NAME,
        userPoolId: USER_POOL_ID,
        oAuthParameter: {
          ParameterKey: 'hostedUIProviderMeta',
          ParameterValue: JSON.stringify([{}]),
        },
        ssmClient: new SSMClient(),
        cognitoIdpClient: new CognitoIdentityProviderClient(),
      }),
    ).rejects.toThrowError(INVALID_OAUTH_METADATA_PARAM);
  });
});
