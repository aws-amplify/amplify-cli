const path = require('path');

const StorageCategory = 'storage';
const Resources = 'Resources';
const DynamoDBTable = 'DynamoDBTable';
const Properties = 'Properties';
const GlobalSecondaryIndexes = 'GlobalSecondaryIndexes';
const AttributeDefinitions = 'AttributeDefinitions';

function getExistingStorageGSIs(template) {
  if (template && template[Resources] && template[Resources][DynamoDBTable]) {
    return template[Resources][DynamoDBTable][Properties][GlobalSecondaryIndexes] || [];
  }
  return [];
}

function getExistingStorageAttributeDefinitions(template) {
  if (template && template[Resources] && template[Resources][DynamoDBTable]) {
    return template[Resources][DynamoDBTable][Properties][AttributeDefinitions] || [];
  }
  return [];
}

function getCloudFormationTemplatePath(currentCloudBackendDirPath, resourceName) {
  return path.join(currentCloudBackendDirPath, StorageCategory, resourceName, `${resourceName}-cloudformation-template.json`);
}

module.exports = {
  getExistingStorageAttributeDefinitions,
  getExistingStorageGSIs,
  getCloudFormationTemplatePath,
};
