import { createAndUpdateTable, MockDynamoDBConfig } from '../../../utils/dynamo-db';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

import { createTables, describeTables, getUpdateTableInput, updateTables } from '../../../utils/dynamo-db/utils';
import { CreateTableInput, GlobalSecondaryIndex } from 'aws-sdk/clients/dynamodb';

jest.mock('../../../utils/dynamo-db/utils');

describe('createAndUpdateTable', () => {
  const table1Input: CreateTableInput = {
    TableName: 'table1',
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
      {
        AttributeName: 'name',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
  };

  const indexByName: GlobalSecondaryIndex = {
    IndexName: 'byName',
    KeySchema: [
      {
        AttributeName: 'name',
        KeyType: 'HASH',
      },
    ],

    Projection: {
      ProjectionType: 'ALL',
    },
  };
  const indexByContent: GlobalSecondaryIndex = {
    IndexName: 'index1',
    KeySchema: [
      {
        AttributeName: 'content',
        KeyType: 'HASH',
      },
    ],

    Projection: {
      ProjectionType: 'ALL',
    },
  };

  const table2Input: CreateTableInput = {
    ...table1Input,
    AttributeDefinitions: [
      ...table1Input.AttributeDefinitions,
      {
        AttributeName: 'content',
        AttributeType: 'S',
      },
    ],
    TableName: 'table2',
    GlobalSecondaryIndexes: [indexByName, indexByContent],
  };
  const listTablesMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB', 'listTables', listTablesMock);
  });

  it('should create new tables when they are missing', async () => {
    const mockDDBConfig: MockDynamoDBConfig = {
      tables: [{ Properties: table1Input }],
    };
    listTablesMock.mockImplementation(cb => {
      cb(null, {
        TableNames: [],
      });
    });
    (describeTables as jest.Mock).mockReturnValue({});
    const client = new DynamoDB();
    await createAndUpdateTable(client, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(client, [table1Input]);
    expect(getUpdateTableInput).not.toHaveBeenCalled();
    expect(updateTables).toHaveBeenCalledWith(client, []);
  });

  it('should update existing table with new GSI', async () => {
    const mockDDBConfig: MockDynamoDBConfig = {
      tables: [{ Properties: table1Input }, { Properties: table2Input }],
    };

    listTablesMock.mockImplementation(cb => {
      cb(null, {
        TableNames: [table1Input.TableName, table2Input.TableName],
      });
    });

    (describeTables as jest.Mock).mockReturnValue({
      [table1Input.TableName]: table1Input.TableName,
      [table2Input.TableName]: { ...table2Input, GlobalSecondaryIndex: [] },
    });
    const getUpdateTableInputResult = [
      {
        ...table2Input,
        GlobalSecondaryUpdate: {
          Create: [table2Input.GlobalSecondaryIndexes[0]],
        },
      },
      {
        ...table2Input,
        GlobalSecondaryUpdate: {
          Create: [table2Input.GlobalSecondaryIndexes[1]],
        },
      },
    ];

    (getUpdateTableInput as jest.Mock).mockImplementation(input => (input === table2Input ? getUpdateTableInputResult : []));

    const client = new DynamoDB();
    await createAndUpdateTable(client, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(client, []);
    expect(getUpdateTableInput).toHaveBeenCalledWith(table2Input, { ...table2Input, GlobalSecondaryIndex: [] });
    expect(updateTables).toHaveBeenCalledWith(client, getUpdateTableInputResult);
  });
});
