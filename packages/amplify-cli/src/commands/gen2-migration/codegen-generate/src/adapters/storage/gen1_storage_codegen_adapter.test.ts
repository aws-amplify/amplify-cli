import { describe, it, expect } from '@jest/globals';
import { getStorageDefinition, StorageInputs, DynamoDBTableDefinition } from './gen1_storage_codegen_adapter';

describe('Storage Adapter DynamoDB Support', () => {
  describe('getStorageDefinition', () => {
    it('should handle DynamoDB tables without S3 bucket', () => {
      const dynamoTables: DynamoDBTableDefinition[] = [
        {
          tableName: 'testTable',
          partitionKey: { name: 'id', type: 'STRING' },
          billingMode: 'PAY_PER_REQUEST',
        },
      ];

      const inputs: StorageInputs = {
        dynamoTables,
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toEqual(dynamoTables);
      expect(result.accessPatterns).toBeUndefined();
      expect(result.storageIdentifier).toBeUndefined();
    });

    it('should handle both S3 bucket and DynamoDB tables', () => {
      const dynamoTables: DynamoDBTableDefinition[] = [
        {
          tableName: 'mixedTable',
          partitionKey: { name: 'pk', type: 'STRING' },
          sortKey: { name: 'sk', type: 'NUMBER' },
          billingMode: 'PROVISIONED',
          readCapacity: 5,
          writeCapacity: 5,
        },
      ];

      const inputs: StorageInputs = {
        bucketName: 'test-bucket-dev',
        cliInputs: {
          resourceName: 'testStorage',
          policyUUID: 'test-uuid',
          bucketName: 'test-bucket-dev',
          storageAccess: 'auth',
          guestAccess: [],
          authAccess: ['CREATE_AND_UPDATE', 'READ', 'DELETE'],
          triggerFunction: 'NONE',
          groupAccess: {},
        },
        dynamoTables,
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toEqual(dynamoTables);
      expect(result.storageIdentifier).toBe('test-bucket-dev');
      expect(result.accessPatterns).toBeDefined();
    });

    it('should handle complex DynamoDB table with GSIs and triggers', () => {
      const dynamoTables: DynamoDBTableDefinition[] = [
        {
          tableName: 'complexTable-dev',
          partitionKey: { name: 'userId', type: 'STRING' },
          sortKey: { name: 'timestamp', type: 'NUMBER' },
          billingMode: 'PROVISIONED',
          readCapacity: 10,
          writeCapacity: 10,
          streamEnabled: true,
          streamViewType: 'NEW_AND_OLD_IMAGES',
          gsis: [
            {
              indexName: 'statusIndex',
              partitionKey: { name: 'status', type: 'STRING' },
              sortKey: { name: 'createdAt', type: 'NUMBER' },
            },
          ],
          lambdaPermissions: [
            {
              functionName: 'dataProcessor',
              envVarName: 'TABLE_NAME',
            },
          ],
          triggerFunctions: ['streamHandler'],
        },
      ];

      const inputs: StorageInputs = {
        dynamoTables,
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toHaveLength(1);
      expect(result.dynamoTables![0].tableName).toBe('complexTable-dev');
      expect(result.dynamoTables![0].gsis).toHaveLength(1);
      expect(result.dynamoTables![0].lambdaPermissions).toHaveLength(1);
      expect(result.dynamoTables![0].triggerFunctions).toHaveLength(1);
      expect(result.dynamoTables![0].streamEnabled).toBe(true);
    });

    it('should handle empty inputs', () => {
      const inputs: StorageInputs = {};

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toBeUndefined();
      expect(result.accessPatterns).toBeUndefined();
      expect(result.storageIdentifier).toBeUndefined();
    });

    it('should handle undefined dynamoTables', () => {
      const inputs: StorageInputs = {
        bucketName: 'test-bucket',
        cliInputs: {
          resourceName: 'testStorage',
          policyUUID: 'test-uuid',
          bucketName: 'test-bucket',
          storageAccess: 'auth',
          guestAccess: [],
          authAccess: ['READ'],
          triggerFunction: 'NONE',
          groupAccess: {},
        },
        dynamoTables: undefined,
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toBeUndefined();
      expect(result.storageIdentifier).toBe('test-bucket');
    });

    it('should handle empty dynamoTables array', () => {
      const inputs: StorageInputs = {
        dynamoTables: [],
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toEqual([]);
    });
  });

  describe('DynamoDB table validation', () => {
    it('should handle table with all supported attribute types', () => {
      const dynamoTables: DynamoDBTableDefinition[] = [
        {
          tableName: 'typeTestTable',
          partitionKey: { name: 'stringKey', type: 'STRING' },
          sortKey: { name: 'numberKey', type: 'NUMBER' },
          billingMode: 'PAY_PER_REQUEST',
          gsis: [
            {
              indexName: 'binaryIndex',
              partitionKey: { name: 'binaryKey', type: 'BINARY' },
            },
          ],
        },
      ];

      const inputs: StorageInputs = { dynamoTables };
      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables![0].partitionKey.type).toBe('STRING');
      expect(result.dynamoTables![0].sortKey!.type).toBe('NUMBER');
      expect(result.dynamoTables![0].gsis![0].partitionKey.type).toBe('BINARY');
    });

    it('should handle table with all billing modes', () => {
      const provisionedTable: DynamoDBTableDefinition = {
        tableName: 'provisionedTable',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
      };

      const payPerRequestTable: DynamoDBTableDefinition = {
        tableName: 'payPerRequestTable',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const inputs: StorageInputs = {
        dynamoTables: [provisionedTable, payPerRequestTable],
      };

      const result = getStorageDefinition(inputs);

      expect(result.dynamoTables).toHaveLength(2);
      expect(result.dynamoTables![0].billingMode).toBe('PROVISIONED');
      expect(result.dynamoTables![1].billingMode).toBe('PAY_PER_REQUEST');
    });

    it('should handle table with all stream view types', () => {
      const streamViewTypes: Array<'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES'> = [
        'KEYS_ONLY',
        'NEW_IMAGE',
        'OLD_IMAGE',
        'NEW_AND_OLD_IMAGES',
      ];

      streamViewTypes.forEach((viewType, index) => {
        const dynamoTable: DynamoDBTableDefinition = {
          tableName: `streamTable${index}`,
          partitionKey: { name: 'id', type: 'STRING' },
          billingMode: 'PAY_PER_REQUEST',
          streamEnabled: true,
          streamViewType: viewType,
        };

        const inputs: StorageInputs = { dynamoTables: [dynamoTable] };
        const result = getStorageDefinition(inputs);

        expect(result.dynamoTables![0].streamViewType).toBe(viewType);
      });
    });
  });
});
