export {
  getStorageDefinition,
  StorageInputs,
  DynamoDBTableDefinition,
  DynamoDBAttribute,
  DynamoDBGSI,
} from './gen1_storage_codegen_adapter';
export {
  StorageCLIInputsJSON,
  CLIV1Permission,
  getStorageAccess,
  extractFunctionS3Access,
  FunctionS3Access,
  extractFunctionDynamoDBAccess,
  FunctionDynamoDBAccess,
} from './storage_access';
