import fs from 'fs';
import { getAppSyncApiConfig, getApiKeyConfig, apiKeyIsActive, hasApiKey } from '../../../extensions/amplify-helpers/get-api-key-config';
import { stateManager } from 'amplify-cli-core';

let amplifyMeta;

jest.mock('amplify-cli-core', () => {
  const original = jest.requireActual('amplify-cli-core');
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
  beforeAll(() => {
    amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
  });

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
  beforeAll(() => {
    amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
  });

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
    beforeAll(() => {
      amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
    });

    it('returns false', () => {
      expect(apiKeyIsActive()).toBe(false);
    });
  });

  describe('with no api key config', () => {
    beforeAll(() => {
      amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta-3.json`);
    });

    it('returns false', () => {
      expect(apiKeyIsActive()).toBe(false);
    });
  });
});

describe('hasApiKey', () => {
  describe('if api key config is present', () => {
    beforeAll(() => {
      amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
    });

    it('returns true if api key is present', () => {
      expect(hasApiKey()).toBe(true);
    });
  });
});
