import { getAppSyncApiConfig, getApiKeyConfig, apiKeyIsActive, hasApiKey } from '../../utils/api-key-helpers';

jest.mock('amplify-cli-core', () => {
  const original = jest.requireActual('amplify-cli-core');
  const amplifyMeta = {
    api: {
      myapp: {
        service: 'AppSync',
        output: {
          authConfig: {
            defaultAuthentication: {
              authenticationType: 'AWS_IAM',
            },
            additionalAuthenticationProviders: [
              {
                authenticationType: 'API_KEY',
                apiKeyConfig: {
                  apiKeyExpirationDays: 2,
                  apiKeyExpirationDate: '2021-08-20T20:38:07.585Z',
                  description: '',
                },
              },
            ],
          },
        },
      },
    },
  };

  return {
    ...original,
    stateManager: {
      getMeta: jest.fn().mockImplementation(() => amplifyMeta),
    },
  };
});

describe('getAppSyncApiConfig', () => {
  it('returns the api object', async () => {
    const result = getAppSyncApiConfig();

    expect(result).toStrictEqual({
      service: 'AppSync',
      output: {
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AWS_IAM',
          },
          additionalAuthenticationProviders: [
            {
              authenticationType: 'API_KEY',
              apiKeyConfig: {
                apiKeyExpirationDays: 2,
                apiKeyExpirationDate: '2021-08-20T20:38:07.585Z',
                description: '',
              },
            },
          ],
        },
      },
    });
  });
});

describe('getApiKeyConfig', () => {
  it('returns the api key config', () => {
    const result = getApiKeyConfig();

    expect(result).toStrictEqual({
      apiKeyExpirationDays: 2,
      apiKeyExpirationDate: '2021-08-20T20:38:07.585Z',
      description: '',
    });
  });
});

describe('apiKeyIsActive', () => {
  describe('with expired key', () => {
    it('returns false', () => {
      expect(apiKeyIsActive()).toBe(false);
    });
  });
});

describe('hasApiKey', () => {
  describe('if api key config is present', () => {
    it('returns true if api key is present', () => {
      expect(hasApiKey()).toBe(true);
    });
  });
});
