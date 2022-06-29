import { $TSAny, $TSContext } from 'amplify-cli-core';
import { invokeLambda } from '../../api/lambda-invoke';
import { isMockable } from 'amplify-category-function';
import * as lambdaTriggerHandlers from '../../api/lambda-trigger-handler';
import { DynamoDBStreams, Endpoint } from 'aws-sdk';

jest.mock('../../api/lambda-invoke', () => ({
    invokeLambda: jest.fn()
}));
const invokeLambdaMock = invokeLambda as jest.MockedFunction<typeof invokeLambda>;

jest.mock('amplify-category-function', () => ({
    isMockable: jest.fn().mockReturnValue({ isMockable: true })
}));
const isMockableMock = isMockable as jest.MockedFunction<typeof isMockable>;

const mockContext = {} as $TSContext;
const mockStreamArn = 'mock-arn';
const mockTriggerName = 'mock-trigger';
const mockDDBEndpoint = new Endpoint('mock');

describe('Lambda Trigger Handler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws error if lambda trigger name is not specified', async () => {
    try {
        await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
            mockContext,
            mockStreamArn,
            null,
            mockDDBEndpoint
        );
        expect(true).toEqual(false);
    }
    catch (err) {
        expect(err.message).toBe('Name of the lambda trigger function must be specified');
    }
  });

  it('throws error if stream Arn is not specified', async () => {
    try {
        await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
            mockContext,
            null,
            mockTriggerName,
            mockDDBEndpoint
        );
        expect(true).toEqual(false);
    }
    catch (err) {
        expect(err.message).toBe('Stream Arn must be specified');
    }
  });

  it('throws error if dynamoDB local endpoint is not specified', async () => {
    try {
        await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
            mockContext,
            mockStreamArn,
            mockTriggerName,
            null
        );
        expect(true).toEqual(false);
    }
    catch (err) {
        expect(err.message).toBe('Local URL where DDB is running should be specified');
    }
  });

  it('throws error if local lambda is not mockable', async () => {
    isMockableMock.mockReturnValueOnce({ 
        isMockable: false,
        reason: 'Mocking a function with layers is not supported.'
    });
    try {
        await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
            mockContext,
            mockStreamArn,
            mockTriggerName,
            mockDDBEndpoint
        );
        expect(true).toEqual(false);
    }
    catch (err) {
        expect(err.message).toBe(`Unable to mock ${mockTriggerName}. Mocking a function with layers is not supported.`);
    }
  });

  it('Polls for records from given DDB stream', async () => {
    const pollForRecordsMock = jest.spyOn(lambdaTriggerHandlers, 'pollDDBStreamAndInvokeLamba').mockResolvedValueOnce();
    await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
        mockContext,
        mockStreamArn,
        mockTriggerName,
        mockDDBEndpoint
    );
    expect(pollForRecordsMock).toBeCalledTimes(1);
    expect(pollForRecordsMock).toBeCalledWith(
        mockContext, 
        mockStreamArn, 
        expect.any(DynamoDBStreams), 
        mockTriggerName
    );
  });

  it('Invokes the local lambda when records are available to be processed', async () => {
    const mockRecord = { eventID: 'mockEventID' };
    const mockData = { Records: [mockRecord], NextShardIterator: null } as $TSAny;
    const getLatestShardIteratorMock = jest.spyOn(lambdaTriggerHandlers, 'getLatestShardIterator').mockResolvedValueOnce('mockShardIterator');
    const getStreamRecordsMock = jest.spyOn(lambdaTriggerHandlers, 'getStreamRecords').mockResolvedValueOnce({
        data: mockData,
        shardIterator: null // to prevent continuously running loop
    });
    invokeLambdaMock.mockResolvedValueOnce();
    await lambdaTriggerHandlers.ddbLambdaTriggerHandler(
        mockContext,
        mockStreamArn,
        mockTriggerName,
        mockDDBEndpoint
    );
    expect(getLatestShardIteratorMock).toBeCalledTimes(1);
    expect(getStreamRecordsMock).toBeCalledTimes(1);
    expect(invokeLambdaMock).toBeCalledTimes(1);
    expect(invokeLambdaMock).toBeCalledWith(mockContext, mockTriggerName, mockData);
  });
});
