import { createAndUpdateTable, MockDynamoDBConfig } from '../../../utils/dynamo-db';
import AWS_MOCK from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

import { createTables, describeTables, getUpdateTableInput, updateTables } from '../../../utils/dynamo-db/utils';
import { CreateTableInput, GlobalSecondaryIndex } from 'aws-sdk/clients/dynamodb';

jest.mock('../../../utils/dynamo-db/utils');

describe('createAndUpdateTable', () => {
  const describeTablesMock = jest.fn();
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

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    AWS_MOCK.setSDKInstance(AWS);
  });

  it('should create new tables when they are missing', async () => {
    const mockDDBConfig: MockDynamoDBConfig = {
      tables: [{ Properties: table1Input, isNewlyAdded: true }],
    };

    const mockListTables = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ TableNames: [] }),
    });

    describeTablesMock.mockReturnValue({});

    const ddbClient = {
      describeTables: describeTablesMock,
      listTables: mockListTables,
    };
    await createAndUpdateTable(ddbClient as unknown as DynamoDB, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(ddbClient, [table1Input]);
    expect(getUpdateTableInput).not.toHaveBeenCalled();
    expect(updateTables).toHaveBeenCalledWith(ddbClient, []);
  });

  it('should update existing table with new GSI', async () => {
    const createTablesMock = jest.fn();
    const mockListTables = jest.fn();

    const getUpdateTableInputResult = [
      {
        ...table2Input,
        GlobalSecondaryUpdate: {
          Create: [table2Input.GlobalSecondaryIndexes![0]],
        },
      },
      {
        ...table2Input,
        GlobalSecondaryUpdate: {
          Create: [table2Input.GlobalSecondaryIndexes![1]],
        },
      },
    ];

    createTablesMock.mockReturnValue(() => {
      jest.fn().mockResolvedValue([]);
    });

    mockListTables.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ TableNames: [table1Input.TableName, table2Input.TableName] }),
    });

    (getUpdateTableInput as jest.Mock).mockImplementation((input) => (input === table2Input ? getUpdateTableInputResult : []));

    (describeTables as jest.Mock).mockReturnValue({
      [table1Input.TableName]: table1Input.TableName,
      [table2Input.TableName]: { ...table2Input, GlobalSecondaryIndex: [] },
    });

    const mockDDBConfig: MockDynamoDBConfig = {
      tables: [
        { Properties: table1Input, isNewlyAdded: false },
        { Properties: table2Input, isNewlyAdded: false },
      ],
    };
    const ddbClient = {
      createTables: createTablesMock,
      listTables: mockListTables,
      getUpdateTableInput,
    };

    await createAndUpdateTable(ddbClient as unknown as DynamoDB, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(ddbClient, []);
    expect(getUpdateTableInput).toHaveBeenCalledWith(table2Input, { ...table2Input, GlobalSecondaryIndex: [] });
    expect(updateTables).toHaveBeenCalledWith(ddbClient, getUpdateTableInputResult);
  });
});
