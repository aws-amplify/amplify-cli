import * as path from 'path';

const StorageCategory = 'storage';
const Resources = 'Resources';
const DynamoDBTable = 'DynamoDBTable';
const Properties = 'Properties';
const GlobalSecondaryIndexes = 'GlobalSecondaryIndexes';
const AttributeDefinitions = 'AttributeDefinitions';

export function getExistingStorageGSIs(template) {
  if (template && template[Resources] && template[Resources][DynamoDBTable]) {
    return template[Resources][DynamoDBTable][Properties][GlobalSecondaryIndexes] || [];
  }
  return [];
}

export function getExistingStorageAttributeDefinitions(template) {
  if (template && template[Resources] && template[Resources][DynamoDBTable]) {
    return template[Resources][DynamoDBTable][Properties][AttributeDefinitions] || [];
  }
  return [];
}

export function getCloudFormationTemplatePath(currentCloudBackendDirPath, resourceName) {
  return path.join(currentCloudBackendDirPath, StorageCategory, resourceName, `${resourceName}-cloudformation-template.json`);
}
