import { stateManager, getGraphQLTransformerOpenSearchProductionDocLink, getTransformerVersion } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { searchablePushChecks } from '../../graphql-transformer/api-utils';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

const printerMock = printer as jest.Mocked<typeof printer>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const getTransformerVersionMock = getTransformerVersion as jest.MockedFunction<typeof getTransformerVersion>
const getGraphQLTransformerOpenSearchProductionDocLinkMock = getGraphQLTransformerOpenSearchProductionDocLink as jest.MockedFunction<
  typeof getGraphQLTransformerOpenSearchProductionDocLink
>;
printerMock.warn.mockImplementation(jest.fn());
getGraphQLTransformerOpenSearchProductionDocLinkMock.mockReturnValue('mockDocsLink');
// use transformer v2 for tests
getTransformerVersionMock.mockReturnValue(new Promise(resolve => resolve(2)));

describe('graphql schema checks', () => {
  const contextMock = {
    amplify: {
      getEnvInfo: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should warn users if they use not recommended open search instance without overrides', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({});
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should warn users if they use not recommended open search instance with overrides', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      test: {
        categories: {
          api: {
            test_api_name: {
              OpenSearchInstanceType: 't2.small.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should warn users if they use not recommended elastic search instance with overrides', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      test: {
        categories: {
          api: {
            test_api_name: {
              ElasticSearchInstanceType: 't2.small.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should NOT warn users if they use recommended open search instance', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      test: {
        categories: {
          api: {
            test_api_name: {
              OpenSearchInstanceType: 't2.medium.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they use recommended elastic search instance', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      test: {
        categories: {
          api: {
            test_api_name: {
              ElasticSearchInstanceType: 't2.medium.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they use recommended open search instance on the environment', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      dev: {
        categories: {
          api: {
            test_api_name: {
              OpenSearchInstanceType: 't2.small.elasticsearch',
            },
          },
        },
      },
      prod: {
        categories: {
          api: {
            test_api_name: {
              OpenSearchInstanceType: 't2.medium.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'prod' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they use recommended elastic search instance on the environment', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      dev: {
        categories: {
          api: {
            test_api_name: {
              ElasticSearchInstanceType: 't2.small.elasticsearch',
            },
          },
        },
      },
      prod: {
        categories: {
          api: {
            test_api_name: {
              ElasticSearchInstanceType: 't2.medium.elasticsearch',
            },
          },
        },
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'prod' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they do NOT use searchable', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({});
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should warn users if they use not recommended open search instance with overrides', async () => {
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      test: {
        categories: {},
      },
    });
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });
});
