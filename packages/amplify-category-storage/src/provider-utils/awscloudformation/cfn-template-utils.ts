import { pathManager, readCFNTemplate } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import Table, { AttributeDefinition, GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import _ from 'lodash';
import * as path from 'path';
import { AmplifyCategories } from 'amplify-cli-core';

export const getCloudFormationTemplatePath = (resourceName: string) => {
  return path.join(
    pathManager.getBackendDirPath(),
    AmplifyCategories.STORAGE,
    resourceName,
    `${resourceName}-cloudformation-template.json`,
  );
};

export const getExistingStorageGSIs = async (resourceName: string) => {
  return ((await loadTable(resourceName))?.Properties?.GlobalSecondaryIndexes as GlobalSecondaryIndex[]) || [];
};

export const getExistingStorageAttributeDefinitions = async (resourceName: string) => {
  return ((await loadTable(resourceName))?.Properties?.AttributeDefinitions as AttributeDefinition[]) || [];
};

export const getExistingTableColumnNames = async (resourceName: string): Promise<string[]> => {
  return (await getExistingStorageAttributeDefinitions(resourceName)).map(att => att.AttributeName.toString());
};

const loadTable = async (resourceName?: string): Promise<Table | undefined> => {
  const table = getTableFromTemplate(await loadCfnTemplateSafe(resourceName));
  return table;
};

const loadCfnTemplateSafe = async (resourceName?: string): Promise<Template | undefined> => {
  if (!resourceName) {
    return undefined;
  }
  const { cfnTemplate } = readCFNTemplate(getCloudFormationTemplatePath(resourceName), { throwIfNotExist: false }) || {};
  return cfnTemplate;
};

const getTableFromTemplate = (cfnTemplate?: Template): Table | undefined => {
  if (_.isEmpty(cfnTemplate?.Resources)) {
    return undefined;
  }
  const cfnTable = Object.values(cfnTemplate!.Resources!).find(resource => resource.Type === 'AWS::DynamoDB::Table') as Table | undefined;
  return cfnTable;
};
