import { StorageTriggerEvent, Lambda, StorageRenderParameters } from '../../core/migration-pipeline';
import { StorageCLIInputsJSON, getStorageAccess } from './storage_access';

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
  lambdaPermissions?: {
    functionName: string;
    envVarName: string;
  }[];
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
};

export const getStorageDefinition = ({ bucketName, cliInputs, triggers, dynamoTables }: StorageInputs): StorageRenderParameters => {
  const result: StorageRenderParameters = {};

  if (bucketName && cliInputs) {
    result.accessPatterns = getStorageAccess(cliInputs);
    result.storageIdentifier = bucketName;
    result.triggers = triggers ?? {};
  }

  if (dynamoTables) {
    result.dynamoTables = dynamoTables;
  }

  return result;
};
