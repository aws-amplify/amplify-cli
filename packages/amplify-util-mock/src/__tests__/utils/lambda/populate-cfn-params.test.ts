import { stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { populateCfnParams } from '../../../utils/lambda/populate-cfn-params';

jest.mock('amplify-cli-core');
jest.mock('../../../api/api', () => ({
  GRAPHQL_API_ENDPOINT_OUTPUT: 'GraphQLAPIEndpointOutput',
  GRAPHQL_API_KEY_OUTPUT: 'GraphQLAPIKeyOutput',
  MOCK_API_KEY: 'da2-fakeApiId123456',
  MOCK_API_PORT: '666',
}));

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

stateManager_mock.getLocalEnvInfo.mockReturnValue({
  envName: 'test',
});

const teamProviderParam = {
  anotherCfnParam: 'testValue',
};
stateManager_mock.getTeamProviderInfo.mockReturnValue({
  test: {
    awscloudformation: {
      Region: 'test-region',
      StackId: 'arn:aws:cloudformation:us-test-1:1234:stack/my-test-stack',
      StackName: 'test-stack-name',
    },
    categories: {
      function: {
        func1: teamProviderParam,
      },
    },
  },
});

const meta_stub = {
  function: {
    func1: {
      dependsOn: [
        {
          category: 'storage',
          resourceName: 'mytable',
          attributes: ['tableName', 'tableArn'],
        },
        {
          category: 'api',
          resourceName: 'myApi',
          attributes: ['apiName'],
        },
      ],
    },
  },
  storage: {
    mytable: {
      output: {
        tableName: 'testTableName',
        tableArn: 'testTableArn',
      },
    },
  },
  api: {
    myApi: {
      output: {
        apiName: 'testApiName',
        apiEndpoint: 'testApiEndpoint',
      },
    },
  },
};

describe('populate cfn params', () => {
  it('includes CFN pseudo parameters', () => {
    expect(populateCfnParams({} as any, undefined)).toMatchObject({
      env: 'test',
      'AWS::Region': 'test-region',
      'AWS::AccountId': '1234',
      'AWS::StackId': 'arn:aws:cloudformation:us-test-1:1234:stack/my-test-stack',
      'AWS::StackName': 'test-stack-name',
      'AWS::URLSuffix': 'amazonaws.com',
    });
  });

  it('falls back to default pseudo params when not in team provider', () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({
      test: {
        awscloudformation: {},
      },
    });

    expect(populateCfnParams({} as any, undefined)).toMatchObject({
      env: 'test',
      'AWS::Region': 'us-test-1',
      'AWS::AccountId': '12345678910',
      'AWS::StackId': 'fake-stack-id',
      'AWS::StackName': 'local-testing',
      'AWS::URLSuffix': 'amazonaws.com',
    });
  });

  it('gets dependsOn params from amplify-meta', () => {
    stateManager_mock.getMeta.mockReturnValueOnce(meta_stub);
    expect(populateCfnParams({} as any, 'func1')).toMatchObject({
      apimyApiapiName: 'testApiName',
      storagemytabletableName: 'testTableName',
      storagemytabletableArn: 'testTableArn',
    });
  });

  it('overwrites api endpoint url when specified', () => {
    const meta_stub_copy = _.cloneDeep(meta_stub);
    meta_stub_copy.function.func1.dependsOn[1].attributes.push('GraphQLAPIEndpointOutput');
    stateManager_mock.getMeta.mockReturnValueOnce(meta_stub_copy);
    expect(populateCfnParams({ warning: jest.fn() } as any, 'func1', true)).toMatchObject({
      apimyApiGraphQLAPIEndpointOutput: `http://localhost:666/graphql`,
    });
  });

  it('overwrites api key when specified', () => {
    const meta_stub_copy = _.cloneDeep(meta_stub);
    meta_stub_copy.function.func1.dependsOn[1].attributes.push('GraphQLAPIKeyOutput');
    stateManager_mock.getMeta.mockReturnValueOnce(meta_stub_copy);
    expect(populateCfnParams({ warning: jest.fn() } as any, 'func1', true)).toMatchObject({
      apimyApiGraphQLAPIKeyOutput: 'da2-fakeApiId123456',
    });
  });

  it('prints warning when no value found', () => {
    const meta_stub_copy = _.cloneDeep(meta_stub);
    meta_stub_copy.function.func1.dependsOn[1].attributes.push('GraphQLAPIEndpointOutput');
    stateManager_mock.getMeta.mockReturnValueOnce(meta_stub_copy);
    const warningMock = jest.fn();
    const result = populateCfnParams({ warning: warningMock } as any, 'func1');
    expect(typeof result).toBe('object');
    expect(result.apimyApiGraphQLAPIEndpointOutput).toBeUndefined();
    expect(warningMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "No output found for attribute 'GraphQLAPIEndpointOutput' on resource 'myApi' in category 'api'",
        ],
        Array [
          "This attribute will be undefined in the mock environment until you run \`amplify push\`",
        ],
      ]
    `);
  });

  it('includes params from parameters.json', () => {
    const expectedMap = {
      someOtherParam: 'this is the value',
    };
    stateManager_mock.getResourceParametersJson.mockReturnValueOnce(expectedMap);
    expect(populateCfnParams({} as any, 'func1')).toMatchObject(expectedMap);
  });

  it('includes params from team-provider-info.json', () => {
    expect(populateCfnParams({} as any, 'func1')).toMatchObject(teamProviderParam);
  });
});
