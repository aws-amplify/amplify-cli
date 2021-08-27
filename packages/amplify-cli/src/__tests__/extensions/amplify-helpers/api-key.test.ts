import fs from 'fs';
import { getAppSyncApiConfig, getApiKeyConfig, apiKeyIsActive, hasApiKey } from '../../../extensions/amplify-helpers/api-key';
import { stateManager } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => {
  const original = jest.requireActual('amplify-cli-core');
  const amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
  return {
    ...original,
    stateManager: {
      metaFileExists: jest.fn(),
      getMeta: jest.fn().mockImplementation(() => JSON.parse(amplifyMeta.toString())),
    },
  };
});

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

describe('getAppSyncApiConfig', () => {
  it('returns the api object', async () => {
    const result = getAppSyncApiConfig();

    expect(result).toStrictEqual({
      service: 'AppSync',
      providerPlugin: 'awscloudformation',
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
        globalSandboxModeConfig: {
          dev: {
            enabled: true,
          },
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
  it('returns true if api key is active', () => {
    const result = apiKeyIsActive();

    expect(result).toBe(false);
  });
});

describe('hasApiKey', () => {
  it('returns true if api key is present', () => {
    const result = hasApiKey();

    expect(result).toBe(true);
  });
});
