import { waitTillTableStateIsActive } from '../../../utils/dynamo-db/helpers';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

describe('aitTillTableStateIsActive', () => {
  const describeTableMock = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB', 'describeTable', describeTableMock);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should wait for table to be in active state', async () => {
    describeTableMock.mockImplementation(({ TableName }, cb) => {
      cb(null, {
        Table: {
          TableName,
          TableStatus: 'ACTIVE',
        },
      });
    });
    const dynamoDBClient = new DynamoDB();

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(dynamoDBClient, 'table1');
    jest.advanceTimersByTime(1000);
    await waitTillTableStateIsActivePromise;
    expect(describeTableMock.mock.calls[0][0]).toEqual({ TableName: 'table1' });
  });

  it('should reject the promise when table does not become active for timeout period', async () => {
    describeTableMock.mockImplementation(({ TableName }, cb) => {
      cb(null, {
        Table: {
          TableName,
          TableStatus: 'UPDATING',
        },
      });
    });
    const dynamoDBClient = new DynamoDB();

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(dynamoDBClient, 'table1');
    jest.runOnlyPendingTimers();
    await expect(waitTillTableStateIsActivePromise).rejects.toMatchObject({ message: 'Waiting for table status to turn ACTIVE timed out' });
    expect(describeTableMock).toHaveBeenCalled();
  });

  it('should periodically call check status', async () => {
    let callCount = 0;
    describeTableMock.mockImplementation(({ TableName }, cb) => {
      callCount += 1;
      cb(null, {
        Table: {
          TableName,
          TableStatus: callCount === 3 ? 'ACTIVE' : 'UPDATING',
        },
      });
    });
    const dynamoDBClient = new DynamoDB();

    const waitTillTableStateIsActivePromise = waitTillTableStateIsActive(dynamoDBClient, 'table1');
    jest.advanceTimersByTime(3000);
    await waitTillTableStateIsActivePromise;
    expect(describeTableMock).toBeCalledTimes(4);
    expect(describeTableMock.mock.calls[0][0]).toEqual({ TableName: 'table1' });
    expect(describeTableMock.mock.calls[1][0]).toEqual({ TableName: 'table1' });
    expect(describeTableMock.mock.calls[2][0]).toEqual({ TableName: 'table1' });
    expect(describeTableMock.mock.calls[3][0]).toEqual({ TableName: 'table1' });
  });
});
