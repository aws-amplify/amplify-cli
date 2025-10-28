import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { invokeTrigger } from '../../api/lambda-invoke';
import { isMockable } from '@aws-amplify/amplify-category-function';
import * as lambdaTriggerHandlers from '../../api/lambda-trigger-handler';
import { DynamoDBStreamsClient } from '@aws-sdk/client-dynamodb-streams';

jest.mock('../../api/lambda-invoke', () => ({
  invokeTrigger: jest.fn(),
}));
const invokeLambdaMock = invokeTrigger as jest.MockedFunction<typeof invokeTrigger>;

jest.mock('@aws-amplify/amplify-category-function', () => ({
  isMockable: jest.fn().mockReturnValue({ isMockable: true }),
}));
const isMockableMock = isMockable as jest.MockedFunction<typeof isMockable>;

const mockContext = {} as $TSContext;
const mockStreamArn = 'mock-arn';
const mockTrigger = { name: 'mock-trigger' };
const mockDDBEndpoint = 'mock';

describe('Lambda Trigger Handler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws error if lambda trigger name and config both are not specified', async () => {
    try {
      await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, mockStreamArn, {}, mockDDBEndpoint);
      expect(true).toEqual(false);
    } catch (err) {
      expect(err.message).toBe('Lambda trigger must be specified');
    }
  });

  it('throws error if stream Arn is not specified', async () => {
    try {
      await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, null, mockTrigger, mockDDBEndpoint);
      expect(true).toEqual(false);
    } catch (err) {
      expect(err.message).toBe('Stream Arn must be specified');
    }
  });

  it('throws error if dynamoDB local endpoint is not specified', async () => {
    try {
      await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, mockStreamArn, mockTrigger, null);
      expect(true).toEqual(false);
    } catch (err) {
      expect(err.message).toBe('Local URL where DDB is running should be specified');
    }
  });

  it('throws error if local lambda is not mockable', async () => {
    isMockableMock.mockReturnValueOnce({
      isMockable: false,
      reason: 'Mocking a function with layers is not supported.',
    });
    try {
      await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, mockStreamArn, mockTrigger, mockDDBEndpoint);
      expect(true).toEqual(false);
    } catch (err) {
      expect(err.message).toBe(`Unable to mock ${mockTrigger.name}. Mocking a function with layers is not supported.`);
    }
  });

  it('Polls for records from given DDB stream', async () => {
    const pollForRecordsMock = jest.spyOn(lambdaTriggerHandlers, 'pollDDBStreamAndInvokeLambda').mockResolvedValueOnce();
    await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, mockStreamArn, mockTrigger, mockDDBEndpoint);
    expect(pollForRecordsMock).toBeCalledTimes(1);
    expect(pollForRecordsMock).toBeCalledWith(mockContext, mockStreamArn, expect.any(DynamoDBStreamsClient), mockTrigger);
  });

  it('Invokes the local lambda when records are available to be processed', async () => {
    const mockRecord = { eventID: 'mockEventID' };
    const mockData = { Records: [mockRecord], NextShardIterator: null } as $TSAny;
    const getLatestShardIteratorMock = jest
      .spyOn(lambdaTriggerHandlers, 'getLatestShardIterator')
      .mockResolvedValueOnce('mockShardIterator');
    const getStreamRecordsMock = jest.spyOn(lambdaTriggerHandlers, 'getStreamRecords').mockResolvedValueOnce({
      data: mockData,
      shardIterator: null, // to prevent continuously running loop
    });
    invokeLambdaMock.mockResolvedValueOnce();
    await lambdaTriggerHandlers.ddbLambdaTriggerHandler(mockContext, mockStreamArn, mockTrigger, mockDDBEndpoint);
    expect(getLatestShardIteratorMock).toBeCalledTimes(1);
    expect(getStreamRecordsMock).toBeCalledTimes(1);
    expect(invokeLambdaMock).toBeCalledTimes(1);
    expect(invokeLambdaMock).toBeCalledWith(mockContext, mockTrigger, mockData);
  });
});
