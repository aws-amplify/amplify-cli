const path = require('path');
const fs = require('fs');
const { readJsonFile } = require('./read-json-file');
const { StorageCategory, Resources, DynamoDBTable, Properties, GlobalSecondaryIndexes, AttributeDefinitions } = require('./constants');

export function getExistingStorageGSIs(currentCloudBackendDirPath, resourceName) {
  const template = getCloudFormationTemplateMap(currentCloudBackendDirPath, resourceName);
  if (template) {
    return template[Resources][DynamoDBTable][Properties][GlobalSecondaryIndexes] || [];
  }

  return [];
}

export function getExistingStorageAttributeDefinitions(currentCloudBackendDirPath, resourceName) {
  const template = getCloudFormationTemplateMap(currentCloudBackendDirPath, resourceName);
  if (template) {
    return template[Resources][DynamoDBTable][Properties][AttributeDefinitions] || [];
  }
  return [];
}

function getCloudFormationTemplateMap(currentCloudBackendDirPath, resourceName) {
  const jsonTemplateFile = path.join(
    currentCloudBackendDirPath,
    StorageCategory,
    resourceName,
    `${resourceName}-cloudformation-template.json`
  );
  if (fs.existsSync(jsonTemplateFile)) {
    return readJsonFile(jsonTemplateFile);
  }
  return null;
}
