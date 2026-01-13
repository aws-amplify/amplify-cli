import { StorageTriggerEvent, Lambda, StorageRenderParameters } from '../../core/migration-pipeline';
import { StorageCLIInputsJSON, getStorageAccess, extractFunctionS3Access, extractFunctionDynamoDBAccess } from './storage_access';

export type DynamoDBAttribute = {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BINARY';
};

export type DynamoDBGSI = {
  indexName: string;
  partitionKey: DynamoDBAttribute;
  sortKey?: DynamoDBAttribute;
};

export type DynamoDBTableDefinition = {
  tableName: string;
  partitionKey: DynamoDBAttribute;
  sortKey?: DynamoDBAttribute;
  gsis?: DynamoDBGSI[];
  billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readCapacity?: number;
  writeCapacity?: number;
  streamEnabled?: boolean;
  streamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
};

export type StorageInputs = {
  bucketName?: string;
  cliInputs?: StorageCLIInputsJSON;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  dynamoTables?: DynamoDBTableDefinition[];
  /** Array of function names that may have access to this storage resource */
  functionNames?: string[];
  /** Resource name for S3 function access matching */
  resourceName?: string;
};

export const getStorageDefinition = ({
  bucketName,
  cliInputs,
  triggers,
  dynamoTables,
  functionNames,
  resourceName,
}: StorageInputs): StorageRenderParameters => {
  const result: StorageRenderParameters = {};

  if (bucketName && cliInputs) {
    result.accessPatterns = getStorageAccess(cliInputs);
    result.storageIdentifier = bucketName;
    result.triggers = triggers ?? {};

    if (functionNames && functionNames.length > 0) {
      const functionAccess = extractFunctionS3Access(functionNames);
      if (functionAccess.length > 0) {
        if (!result.accessPatterns) {
          result.accessPatterns = {};
        }
        result.accessPatterns.functions = functionAccess;
      }
    }
  }

  if (dynamoTables) {
    result.dynamoTables = dynamoTables;

    if (functionNames && functionNames.length > 0) {
      const tableNames = dynamoTables.map((table) => table.tableName);
      const dynamoFunctionAccess = extractFunctionDynamoDBAccess(functionNames, tableNames);
      if (dynamoFunctionAccess.length > 0) {
        result.dynamoFunctionAccess = dynamoFunctionAccess;
      }
    }
  }

  return result;
};
