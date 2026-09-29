import { createAndUpdateTable, MockDynamoDBConfig } from '../../../utils/dynamo-db';
import {
  AttributeDefinition,
  CreateTableCommand,
  DynamoDBClient,
  KeySchemaElement,
  ListTablesCommand,
  UpdateTableCommand,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { createTables, describeTables, getUpdateTableInput, updateTables } from '../../../utils/dynamo-db/utils';

const ddbMock = mockClient(DynamoDBClient);

jest.mock('../../../utils/dynamo-db/utils');

describe('createAndUpdateTable', () => {
  const table1Input = {
    TableName: 'table1',
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      } as AttributeDefinition,
      {
        AttributeName: 'name',
        AttributeType: 'S',
      } as AttributeDefinition,
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      } as KeySchemaElement,
    ],
  };

  const indexByName = {
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
  const indexByContent = {
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

  const table2Input = {
    ...table1Input,
    AttributeDefinitions: [
      ...table1Input.AttributeDefinitions,
      {
        AttributeName: 'content',
        AttributeType: 'S',
      } as AttributeDefinition,
    ],
    TableName: 'table2',
    GlobalSecondaryIndexes: [indexByName, indexByContent],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    ddbMock.reset();
  });

  it('should create new tables when they are missing', async () => {
    const mockDDBConfig: MockDynamoDBConfig = {
      tables: [{ Properties: table1Input, isNewlyAdded: true }],
    };

    ddbMock.on(ListTablesCommand).resolves({ TableNames: [] });
    ddbMock.on(CreateTableCommand).resolves({});
    ddbMock.on(UpdateTableCommand).resolves({});

    //const ddbClient = new DynamoDBClient({});
    await createAndUpdateTable(ddbMock as unknown as DynamoDBClient, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(ddbMock as unknown as DynamoDBClient, [table1Input]);
    expect(getUpdateTableInput).not.toHaveBeenCalled();
    expect(updateTables).toHaveBeenCalledWith(ddbMock as unknown as DynamoDBClient, []);
  });

  it('should update existing table with new GSI', async () => {
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

    ddbMock.on(ListTablesCommand).resolves({ TableNames: [table1Input.TableName, table2Input.TableName] });
    ddbMock.on(CreateTableCommand).resolves({});
    ddbMock.on(UpdateTableCommand).resolves({});

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

    await createAndUpdateTable(ddbMock as unknown as DynamoDBClient, mockDDBConfig);
    expect(createTables).toHaveBeenCalledWith(ddbMock as unknown as DynamoDBClient, []);
    expect(getUpdateTableInput).toHaveBeenCalledWith(table2Input, { ...table2Input, GlobalSecondaryIndex: [] });
    expect(updateTables).toHaveBeenCalledWith(ddbMock as unknown as DynamoDBClient, getUpdateTableInputResult);
  });
});
