import { authConfigHasApiKey } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-utils';

describe('auth config has api key', () => {
  it('returns true when default auth is api key', () => {
    const authConfig = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
    };

    expect(authConfigHasApiKey(authConfig)).toBe(true);
  });

  it('returns true when addtl auth contains api key', () => {
    const authConfig = {
      additionalAuthenticationProviders: [
        {
          authenticationType: 'AWS_IAM',
        },
        {
          authenticationType: 'API_KEY',
        },
      ],
    };
    expect(authConfigHasApiKey(authConfig)).toBe(true);
  });

  it('returns false when no auth type is api key', () => {
    const authConfig = {
      defaultAuthentication: {
        authenticationType: 'AWS_IAM',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'OTHER',
        },
        {
          authenticationType: 'OPENID',
        },
      ],
    };

    expect(authConfigHasApiKey(authConfig)).toBe(false);
  });
});
