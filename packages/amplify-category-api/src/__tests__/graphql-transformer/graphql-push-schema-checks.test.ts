import { stateManager, getGraphQLTransformerOpenSearchProductionDocLink, ApiCategoryFacade } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { searchablePushChecks } from '../../graphql-transformer/api-utils';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

const printerMock = printer as jest.Mocked<typeof printer>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName: 'test' });
// eslint-disable-next-line max-len
const getTransformerVersionMock = ApiCategoryFacade.getTransformerVersion as jest.MockedFunction<typeof ApiCategoryFacade.getTransformerVersion>;
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

  let ensureEnvParamManager;
  let getEnvParamManager;

  beforeEach(async () => {
    ({ getEnvParamManager, ensureEnvParamManager } = await import('@aws-amplify/amplify-environment-parameters'));
    await ensureEnvParamManager('test');
    jest.clearAllMocks();
  });

  it('should warn users if they use not recommended open search instance without overrides', async () => {
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should warn users if they use not recommended open search instance with overrides', async () => {
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should warn users if they use not recommended elastic search instance with overrides', async () => {
    contextMock.amplify.getEnvInfo.mockReturnValue({ envName: 'test' });
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });

  it('should NOT warn users if they use recommended open search instance', async () => {
    getEnvParamManager('test').getResourceParamManager('api', 'test_api_name').setParam('OpenSearchInstanceType', 't2.medium.elasticsearch');

    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they use recommended elastic search instance', async () => {
    getEnvParamManager('test').getResourceParamManager('api', 'test_api_name').setParam('ElasticSearchInstanceType', 't2.medium.elasticsearch');
    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should NOT warn users if they do NOT use searchable', async () => {
    const map = { Post: ['model'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).not.toBeCalled();
  });

  it('should warn users if they implicitly use not recommended open search instance with overrides', async () => {
    getEnvParamManager('test').removeResourceParamManager('api', 'test_api_name');

    const map = { Post: ['model', 'searchable'] };
    await searchablePushChecks(contextMock, map, 'test_api_name');
    expect(printerMock.warn).lastCalledWith(
      'Your instance type for OpenSearch is t2.small.elasticsearch, you may experience performance issues or data loss. Consider reconfiguring with the instructions here mockDocsLink',
    );
  });
});
