const path = require('path');
const fs = require('fs');
const { readJsonFile } = require('./read-json-file');
const { StorageCategory, Resources, DynamoDBTable, Properties, GlobalSecondaryIndexes } = require('./constants');
export function getExistingStorageGSIs(currentCloudBackendDirPath, resourceName) {
  const jsonTemplateFile = path.join(
    currentCloudBackendDirPath,
    StorageCategory,
    resourceName,
    `${resourceName}-cloudformation-template.json`
  );
  if (fs.existsSync(jsonTemplateFile)) {
    const template = readJsonFile(jsonTemplateFile);
    return template[Resources][DynamoDBTable][Properties][GlobalSecondaryIndexes] || [];
  }

  return [];
}
