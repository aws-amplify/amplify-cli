import * as ddbUtils from '../../../utils/dynamo-db/utils';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { DescribeTableOutput, CreateTableInput, UpdateTableInput, UpdateTableOutput, TableDescription } from 'aws-sdk/clients/dynamodb';
import { waitTillTableStateIsActive } from '../../../utils/dynamo-db/helpers';

jest.mock('../../../utils/dynamo-db/helpers');

describe('DynamoDB Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    AWSMock.setSDKInstance(AWS);
  });

  describe('describeTables', () => {
    const describeTableMock = jest.fn();
    beforeEach(() => {
      AWSMock.mock('DynamoDB', 'describeTable', describeTableMock);
    });

    it('should call call DynamoDB Clients describe table and collect the results', async () => {
      const tableNames = ['table1', 'table2'];
      const describeTableResult: Record<string, DescribeTableOutput> = {
        table1: {
          Table: {
            TableName: 'table1',
            KeySchema: [
              {
                AttributeName: 'id',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              },
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'index1',
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
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
              },
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              },
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'index2',
                Projection: {
                  ProjectionType: 'ALL',
                },
              },
            ],
          },
        },
      };
      describeTableMock.mockImplementation((params, cb) => {
        const tableName = params.TableName;
        cb(null, describeTableResult[tableName]);
      });
      const client = new AWS.DynamoDB();
      await expect(ddbUtils.describeTables(client, tableNames)).resolves.toEqual({
        table1: describeTableResult.table1.Table,
        table2: describeTableResult.table2.Table,
      });
      expect(describeTableMock).toHaveBeenCalledTimes(2);
      expect(describeTableMock.mock.calls[0][0]).toEqual({ TableName: 'table1' });
      expect(describeTableMock.mock.calls[1][0]).toEqual({ TableName: 'table2' });
    });
  });

  describe('createTables', () => {
    const createTableMock = jest.fn();
    beforeEach(() => {
      AWSMock.mock('DynamoDB', 'createTable', createTableMock);
    });

    it('should call createTable for each table', async () => {
      createTableMock.mockImplementation((params, cb) => {
        const tableName = params.TableName;
        cb(null, null);
      });

      const tableInputs: CreateTableInput[] = [
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
        },
        {
          TableName: 'table2',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
        },
      ];
      const client = new AWS.DynamoDB();
      await ddbUtils.createTables(client, tableInputs);
      expect(createTableMock).toHaveBeenCalledTimes(2);
      expect(createTableMock.mock.calls[0][0]).toEqual(tableInputs[0]);
      expect(createTableMock.mock.calls[1][0]).toEqual(tableInputs[1]);
    });
  });

  describe('updateTables', () => {
    const updateTableMock = jest.fn();
    const describeTableMock = jest.fn();
    beforeEach(() => {
      AWSMock.mock('DynamoDB', 'updateTable', updateTableMock);
      AWSMock.mock('DynamoDB', 'describeTable', describeTableMock);
    });

    it('should wait for table to be in ACTIVE state before updating', async () => {
      const waitTillTableStateIsActiveMock = (waitTillTableStateIsActive as jest.Mock).mockResolvedValue(undefined);
      updateTableMock.mockImplementation(({ TableName, AttributeDefinitions, GlobalSecondaryIndexUpdates }: UpdateTableInput, cb) => {
        const response: UpdateTableOutput = {
          TableDescription: {
            TableName,
            AttributeDefinitions,
            GlobalSecondaryIndexes: GlobalSecondaryIndexUpdates.filter(update => update.Create).map(gsi => gsi.Update),
          },
        };
        cb(null, response);
      });
      const tables: UpdateTableInput[] = [
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
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
            },
          ],
        },
        {
          TableName: 'table1',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
            {
              AttributeName: 'createdAt',
              AttributeType: 'S',
            },
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
            },
          ],
        },
      ];
      const client = new AWS.DynamoDB();
      const updatePromise = ddbUtils.updateTables(client, tables);
      await updatePromise;

      expect(updateTableMock).toHaveBeenCalledTimes(2);
      expect(updateTableMock.mock.calls[0][0]).toEqual(tables[0]);
      expect(updateTableMock.mock.calls[1][0]).toEqual(tables[1]);

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
        },
        {
          AttributeName: 'Name',
          AttributeType: 'S',
        },
        {
          AttributeName: 'Address',
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
    const existingIndex = {
      IndexName: 'existingIndex',
      KeySchema: [
        {
          AttributeName: 'address',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    };
    const newIndex = {
      IndexName: 'newIndex1',
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
    it('should add a new index', () => {
      const createTableInput: CreateTableInput = {
        ...baseSchema,
        GlobalSecondaryIndexes: [newIndex, existingIndex],
      };
      const existingTableConfig: TableDescription = {
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
      const createTableInput: CreateTableInput = {
        ...baseSchema,
      };
      const existingTableConfig: TableDescription = {
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
      const createTableInput: CreateTableInput = {
        ...baseSchema,
        TableName: 'different-name',
      };
      const existingTableConfig: TableDescription = {
        ...baseSchema,
        GlobalSecondaryIndexes: [existingIndex],
      };
      expect(() => ddbUtils.getUpdateTableInput(createTableInput, existingTableConfig)).toThrowError('Invalid input, table name mismatch');
    });

    it('should generate sepearate inputs when there is an addition and deletion of index', () => {
      const createTableInput: CreateTableInput = {
        ...baseSchema,
        GlobalSecondaryIndexes: [newIndex],
      };
      const existingTableConfig: TableDescription = {
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
