import { $TSContext, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { findLambdaTriggers } from '../../utils/lambda/find-lambda-triggers';

const mockContext = {} as $TSContext;

describe('Find DDB Lambda Triggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateManager.getMeta = jest.fn().mockReturnValue({
        function: {
          lambda1: {
            service: 'Lambda',
          }
        }
    }),
    pathManager.getBackendDirPath = jest.fn().mockReturnValue('backend');
    JSONUtilities.readJson = jest.fn().mockReturnValue({});
  });

  it('Returns empty map when no lambda triggers exist', async () => {
    stateManager.getMeta = jest.fn().mockReturnValueOnce({});
    const mockTables = ['TodoTable'];
    const result = await findLambdaTriggers(mockContext, mockTables);
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
            EventSourceArn: "mockResourceReference"
          }
        }
      }
    });
    const result = await findLambdaTriggers(mockContext, mockTables);
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
            EventSourceArn: "mockResourceReference"
          }
        }
      }
    });
    const result = await findLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(1);
    expect(result).toEqual({});
  });

  it('Maps existing triggers correctly', async () => {
    const mockTables = ['TodoTable'];
    JSONUtilities.readJson = jest.fn().mockReturnValue({
      Resources: {
        LambdaEventSourceMappingTodo: {
          Type: 'AWS::Lambda::EventSourceMapping',
          Properties: {
            EventSourceArn: {"Fn::ImportValue":{"Fn::Sub":"${apimocklambdatrigrGraphQLAPIIdOutput}:GetAtt:TodoTable:StreamArn"}}
          }
        }
      }
    });
    const result = await findLambdaTriggers(mockContext, mockTables);
    expect(JSONUtilities.readJson).toBeCalledTimes(1);
    expect(result).toEqual({
      TodoTable: ['lambda1']
    });
  });
});
