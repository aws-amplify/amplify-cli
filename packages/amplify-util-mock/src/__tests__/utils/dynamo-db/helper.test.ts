import { waitTillTableStateIsActive } from '../../../utils/dynamo-db/helpers';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const ddbMock = mockClient(DynamoDBClient);

describe('waitTillTableStateIsActive', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    ddbMock.reset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should wait for table to be in active state', async () => {
    ddbMock.on(DescribeTableCommand).resolves({
      Table: {
        TableName: 'table1',
        TableStatus: 'ACTIVE',
      },
    });

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(ddbMock as unknown as DynamoDBClient, 'table1');
    jest.advanceTimersByTime(1000);
    await waitTillTableStateIsActivePromise;
    expect(ddbMock).toHaveReceivedNthCommandWith(1, DescribeTableCommand, { TableName: 'table1' });
    expect(ddbMock.commandCalls(DescribeTableCommand)).toHaveLength(1);
  });

  it('should reject the promise when table does not become active for timeout period', async () => {
    ddbMock.on(DescribeTableCommand).resolves({
      Table: {
        TableName: 'table1',
        TableStatus: 'UPDATING',
      },
    });

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(ddbMock as unknown as DynamoDBClient, 'table1');
    jest.runOnlyPendingTimers();
    await expect(waitTillTableStateIsActivePromise).rejects.toMatchObject({ message: 'Waiting for table status to turn ACTIVE timed out' });
    expect(ddbMock).toHaveReceivedCommand(DescribeTableCommand);
  });

  it('should periodically call check status', async () => {
    let callCount = 0;
    ddbMock.on(DescribeTableCommand).callsFake(() => {
      callCount += 1;
      return Promise.resolve({
        Table: {
          TableName: 'table1',
          TableStatus: callCount === 3 ? 'ACTIVE' : 'UPDATING',
        },
      });
    });

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(ddbMock as unknown as DynamoDBClient, 'table1');
    jest.advanceTimersByTime(4000);
    await waitTillTableStateIsActivePromise;
    expect(ddbMock.commandCalls(DescribeTableCommand)).toHaveLength(4);
    expect(ddbMock).toHaveReceivedNthCommandWith(1, DescribeTableCommand, { TableName: 'table1' });
    expect(ddbMock).toHaveReceivedNthCommandWith(2, DescribeTableCommand, { TableName: 'table1' });
    expect(ddbMock).toHaveReceivedNthCommandWith(3, DescribeTableCommand, { TableName: 'table1' });
    expect(ddbMock).toHaveReceivedNthCommandWith(4, DescribeTableCommand, { TableName: 'table1' });
  });
});
