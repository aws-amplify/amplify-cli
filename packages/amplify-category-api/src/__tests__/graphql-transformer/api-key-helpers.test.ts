import { ApiKeyConfig } from '@aws-amplify/graphql-transformer-interfaces';
import { hasApiKey } from '../../graphql-transformer/api-key-helpers';

jest.mock('amplify-cli-core', () => {
  const original = jest.requireActual('amplify-cli-core');
  return {
    ...original,
    ApiCategoryFacade: {
      getApiKeyConfig: jest.fn(() => ({
        apiKeyExpirationDays: 2,
        apiKeyExpirationDate: new Date('2021-08-20T20:38:07.585Z'),
        description: '',
      } as ApiKeyConfig)),
    },
  };
});

describe('hasApiKey', () => {
  describe('if api key config is present', () => {
    it('returns true if api key is present', () => {
      expect(hasApiKey(expect.anything())).toBeTruthy();
    });
  });
});
