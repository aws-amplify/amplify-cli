import { ApiKeyConfig } from '@aws-amplify/graphql-transformer-interfaces';
import { CloudformationProviderFacade } from 'amplify-cli-core';
import { hasApiKey } from '../../graphql-transformer/api-key-helpers';

jest.mock('amplify-cli-core');

const CloudformationProviderFacadeMock = CloudformationProviderFacade as jest.Mocked<typeof CloudformationProviderFacade>;
CloudformationProviderFacadeMock.getApiKeyConfig.mockResolvedValue({
  apiKeyExpirationDays: 2,
  apiKeyExpirationDate: new Date('2021-08-20T20:38:07.585Z'),
  description: '',
} as ApiKeyConfig);

describe('hasApiKey', () => {
  describe('if api key config is present', () => {
    it('returns true if api key is present', async () => {
      expect(await hasApiKey(expect.anything())).toBe(true);
    });
  });
});
