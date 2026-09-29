import * as ddbUtils from '../../../utils/dynamo-db/utils';
import {
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  UpdateTableCommand,
  KeySchemaElement,
  GlobalSecondaryIndexDescription,
  AttributeDefinition,
  GlobalSecondaryIndexUpdate,
  ProjectionType,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { waitTillTableStateIsActive } from '../../../utils/dynamo-db/helpers';

const ddbMock = mockClient(DynamoDBClient);

jest.mock('../../../utils/dynamo-db/helpers');

describe('DynamoDB Utils', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('describeTables', () => {
    it('should call DynamoDB Clients describe table and collect the results', async () => {
      const tableNames = ['table1', 'table2'];
      const describeTableResult = {
        table1: {
          Table: {
            TableName: 'table1',
            KeySchema: [
              {
                AttributeName: 'id',
                KeyType: 'HASH',
              } as KeySchemaElement,
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              } as KeySchemaElement,
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'index1',
                Projection: {
                  ProjectionType: 'ALL',
                },
              } as GlobalSecondaryIndexDescription,
            ],
          },
        },
        table2: {
          Table: {
            TableName: 'table2',
            KeySchema: [
              {
                AttributeName: 'table2_id',
                KeyType: 'HASH',
              } as KeySchemaElement,
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              } as KeySchemaElement,
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'index2',
                Projection: {
                  ProjectionType: 'ALL',
                },
              } as GlobalSecondaryIndexDescription,
            ],
          },
        },
      };

      ddbMock.on(DescribeTableCommand, { TableName: 'table1' }).resolves(describeTableResult.table1);
      ddbMock.on(DescribeTableCommand, { TableName: 'table2' }).resolves(describeTableResult.table2);

      const client = new DynamoDBClient({});
      await expect(ddbUtils.describeTables(client, tableNames)).resolves.toEqual({
        table1: describeTableResult.table1.Table,
        table2: describeTableResult.table2.Table,
      });
      expect(ddbMock).toHaveReceivedNthCommandWith(1, DescribeTableCommand, { TableName: 'table1' });
      expect(ddbMock).toHaveReceivedNthCommandWith(2, DescribeTableCommand, { TableName: 'table2' });
      expect(ddbMock.commandCalls(DescribeTableCommand)).toHaveLength(2);
    });

    it('should early exit for empty tables', async () => {
      const tableNames: string[] = [];
      await expect(ddbUtils.describeTables(ddbMock as unknown as DynamoDBClient, tableNames)).resolves.toEqual({});
      expect(ddbMock.commandCalls(DescribeTableCommand)).toHaveLength(0);
    });
  });

  describe('createTables', () => {
    it('should call createTable for each table', async () => {
      const tableInputs = [
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            } as AttributeDefinition,
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            } as KeySchemaElement,
          ],
        },
        {
          TableName: 'table2',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            } as AttributeDefinition,
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            } as KeySchemaElement,
          ],
        },
      ];

      ddbMock.on(CreateTableCommand).resolves({});

      await ddbUtils.createTables(ddbMock as unknown as DynamoDBClient, tableInputs);
      expect(ddbMock).toHaveReceivedNthCommandWith(1, CreateTableCommand, tableInputs[0]);
      expect(ddbMock).toHaveReceivedNthCommandWith(2, CreateTableCommand, tableInputs[1]);
      expect(ddbMock.commandCalls(CreateTableCommand)).toHaveLength(2);
    });
  });

  describe('updateTables', () => {
    it('should wait for table to be in ACTIVE state before updating', async () => {
      const waitTillTableStateIsActiveMock = (waitTillTableStateIsActive as jest.Mock).mockResolvedValue(undefined);

      const tables = [
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            } as AttributeDefinition,
          ],
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: 'idx1',
                KeySchema: [
                  {
                    AttributeName: 'id',
                    KeyType: 'HASH',
                  },
                ],
                Projection: { ProjectionType: 'ALL' },
              },
            } as GlobalSecondaryIndexUpdate,
          ],
        },
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            } as AttributeDefinition,
            {
              AttributeName: 'createdAt',
              AttributeType: 'S',
            } as AttributeDefinition,
          ],
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: 'byCreatedDate',
                KeySchema: [
                  {
                    AttributeName: 'id',
                    KeyType: 'HASH',
                  },
                  {
                    AttributeName: 'createdAt',
                    KeyType: 'SORT',
                  },
                ],
                Projection: { ProjectionType: 'ALL' },
              },
            } as GlobalSecondaryIndexUpdate,
          ],
        },
      ];

      ddbMock.on(UpdateTableCommand).resolves({
        TableDescription: {
          TableName: 'table1',
          AttributeDefinitions: [],
          GlobalSecondaryIndexes: [],
        },
      });

      const client = new DynamoDBClient({});
      await ddbUtils.updateTables(client, tables);

      expect(ddbMock).toHaveReceivedNthCommandWith(1, UpdateTableCommand, tables[0]);
      expect(ddbMock).toHaveReceivedNthCommandWith(2, UpdateTableCommand, tables[1]);
      expect(ddbMock.commandCalls(UpdateTableCommand)).toHaveLength(2);
      expect(waitTillTableStateIsActiveMock).toHaveBeenCalledTimes(2);
      expect(waitTillTableStateIsActiveMock).toHaveBeenNthCalledWith(1, client, tables[0].TableName);
      expect(waitTillTableStateIsActiveMock).toHaveBeenNthCalledWith(2, client, tables[1].TableName);
    });
  });

  describe('getUpdateTableInput', () => {
    const baseSchema = {
      TableName: 'table1',
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        } as AttributeDefinition,
        {
          AttributeName: 'Name',
          AttributeType: 'S',
        } as AttributeDefinition,
        {
          AttributeName: 'Address',
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
    const existingIndex = {
      IndexName: 'existingIndex',
      KeySchema: [
        {
          AttributeName: 'address',
          KeyType: 'HASH',
        } as KeySchemaElement,
      ],
      Projection: {
        ProjectionType: 'ALL' as ProjectionType,
      },
    };
    const newIndex = {
      IndexName: 'newIndex1',
      KeySchema: [
        {
          AttributeName: 'name',
          KeyType: 'HASH',
        } as KeySchemaElement,
      ],
      Projection: {
        ProjectionType: 'ALL' as ProjectionType,
      },
    };
    it('should add a new index', () => {
      const createTableInput = {
        ...baseSchema,
        GlobalSecondaryIndexes: [newIndex, existingIndex],
      };
      const existingTableConfig = {
        ...baseSchema,
        GlobalSecondaryIndexes: [existingIndex],
      };

      const updateInput = ddbUtils.getUpdateTableInput(createTableInput, existingTableConfig);
      expect(updateInput).toHaveLength(1);
      expect(updateInput[0].TableName).toEqual(baseSchema.TableName);
      expect(updateInput[0].AttributeDefinitions).toEqual(baseSchema.AttributeDefinitions);
      expect(updateInput[0].GlobalSecondaryIndexUpdates).toEqual([
        {
          Create: newIndex,
        },
      ]);
    });
    it('should delete a new index', () => {
      const createTableInput = {
        ...baseSchema,
      };
      const existingTableConfig = {
        ...baseSchema,
        GlobalSecondaryIndexes: [existingIndex],
      };
      const updateInput = ddbUtils.getUpdateTableInput(createTableInput, existingTableConfig);
      expect(updateInput[0].GlobalSecondaryIndexUpdates).toEqual([
        {
          Delete: { IndexName: existingIndex.IndexName },
        },
      ]);
    });

    it('should throw error if the table names dont match', () => {
      const createTableInput = {
        ...baseSchema,
        TableName: 'different-name',
      };
      const existingTableConfig = {
        ...baseSchema,
        GlobalSecondaryIndexes: [existingIndex],
      };
      expect(() => ddbUtils.getUpdateTableInput(createTableInput, existingTableConfig)).toThrowError('Invalid input, table name mismatch');
    });

    it('should generate sepearate inputs when there is an addition and deletion of index', () => {
      const createTableInput = {
        ...baseSchema,
        GlobalSecondaryIndexes: [newIndex],
      };
      const existingTableConfig = {
        ...baseSchema,
        GlobalSecondaryIndexes: [existingIndex],
      };
      const updateInput = ddbUtils.getUpdateTableInput(createTableInput, existingTableConfig);
      expect(updateInput).toHaveLength(2);
      expect(updateInput[0].GlobalSecondaryIndexUpdates).toEqual([
        {
          Delete: { IndexName: existingIndex.IndexName },
        },
      ]);

      expect(updateInput[1].GlobalSecondaryIndexUpdates).toEqual([
        {
          Create: newIndex,
        },
      ]);
    });
  });
});
