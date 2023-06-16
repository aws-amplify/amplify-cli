import { $TSContext, JSONUtilities, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import { findModelLambdaTriggers, findSearchableLambdaTriggers } from '../../utils/lambda/find-lambda-triggers';
import * as path from 'path';

const mockProjectRoot = 'mock-app';
const mockContext = {
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
  },
} as unknown as $TSContext;

describe('Find DDB Lambda Triggers for API Models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (stateManager.getMeta = jest.fn().mockReturnValue({
      function: {
        lambda1: {
          service: 'Lambda',
        },
      },
    })),
      (pathManager.getBackendDirPath = jest.fn().mockReturnValue('backend'));
    JSONUtilities.readJson = jest.fn().mockReturnValue({});
  });

  it('Returns empty map when no lambda triggers exist', async () => {
    stateManager.getMeta = jest.fn().mockReturnValueOnce({});
    const mockTables = ['TodoTable'];
    const result = await findModelLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(0);
    expect(result).toEqual({});
  });

  it('Does not Map types other than event source mappings', async () => {
    const mockTables = ['TodoTable'];
    JSONUtilities.readJson = jest.fn().mockReturnValue({
      Resources: {
        LambdaEventSourceMappingTodo: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            EventSourceArn: 'mockResourceReference',
          },
        },
      },
    });
    const result = await findModelLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(1);
    expect(result).toEqual({});
  });

  it('Does not Map event source mappings other than DDB streams', async () => {
    const mockTables = ['TodoTable'];
    JSONUtilities.readJson = jest.fn().mockReturnValue({
      Resources: {
        LambdaEventSourceMappingTodo: {
          Type: 'AWS::Lambda::EventSourceMapping',
          Properties: {
            EventSourceArn: 'mockResourceReference',
          },
        },
      },
    });
    const result = await findModelLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(1);
    expect(result).toEqual({});
  });

  it('Maps existing Model DDB triggers correctly', async () => {
    const mockTables = ['TodoTable'];
    JSONUtilities.readJson = jest.fn().mockReturnValue({
      Resources: {
        LambdaEventSourceMappingTodo: {
          Type: 'AWS::Lambda::EventSourceMapping',
          Properties: {
            EventSourceArn: { 'Fn::ImportValue': { 'Fn::Sub': '${apimocklambdatrigrGraphQLAPIIdOutput}:GetAtt:TodoTable:StreamArn' } },
          },
        },
      },
    });
    const result = await findModelLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(1);
    expect(result).toEqual({
      TodoTable: [{ name: 'lambda1' }],
    });
  });
});

describe('Find Searchable Lambda Triggers for API Models', () => {
  const mockOpenSearchEndpoint = new URL('http://localhost:9200');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Returns empty map when no searchable models exist', async () => {
    const result = await findSearchableLambdaTriggers(mockContext, [], mockOpenSearchEndpoint);
    expect(result).toEqual({});
  });

  it('Returns empty map when the opensearch endpoint is absent', async () => {
    const result = await findSearchableLambdaTriggers(mockContext, []);
    expect(result).toEqual({});
  });

  it('Returns correct mapping to lambda trigger config for searchable models', async () => {
    const mockTable = 'TodoTable';
    const result = await findSearchableLambdaTriggers(mockContext, [mockTable], mockOpenSearchEndpoint);
    const receivedConfig = result[mockTable]?.config;

    // verify that searchable trigger has config but not name since it's not added via functions category
    expect(receivedConfig).toBeDefined();
    expect(result[mockTable]?.name).toBeUndefined();

    // verify the correctness of the searchable trigger config
    expect(receivedConfig?.directory).toEqual(
      path.join(mockProjectRoot, 'amplify', 'mock-api-resources', 'searchable', 'searchable-lambda-trigger'),
    );
    expect(receivedConfig?.envVars).toEqual({
      DEBUG: '1',
      OPENSEARCH_ENDPOINT: mockOpenSearchEndpoint,
      OPENSEARCH_USE_EXTERNAL_VERSIONING: 'false',
      TABLE_NAME: mockTable?.substring(0, mockTable?.lastIndexOf('Table')),
    });
    expect(receivedConfig?.handler).toEqual('index.handler');
    expect(receivedConfig?.reBuild).toEqual(false);
    expect(receivedConfig?.runtime).toEqual('python');
    expect(receivedConfig?.runtimePluginId).toEqual('amplify-python-function-runtime-provider');
  });
});
