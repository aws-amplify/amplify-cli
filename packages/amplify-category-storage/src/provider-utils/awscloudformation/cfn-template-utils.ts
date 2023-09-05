import { pathManager, readCFNTemplate, AmplifyCategories } from '@aws-amplify/amplify-cli-core';
import { Template } from 'cloudform-types';
import Table, { AttributeDefinition, GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import _ from 'lodash';
import * as path from 'path';
import { FieldType } from './service-walkthrough-types/dynamoDB-user-input-types';

export const getCloudFormationTemplatePath = (resourceName: string) => {
  return path.join(
    pathManager.getBackendDirPath(),
    AmplifyCategories.STORAGE,
    resourceName,
    `${resourceName}-cloudformation-template.json`,
  );
};

/**
 * Some irrelevant change
 * @param resourceName foo
 */
export const getExistingStorageGSIs = async (resourceName: string) => {
  return ((await loadTable(resourceName))?.Properties?.GlobalSecondaryIndexes as GlobalSecondaryIndex[]) || [];
};

export const getExistingStorageAttributeDefinitions = async (resourceName: string) => {
  return ((await loadTable(resourceName))?.Properties?.AttributeDefinitions as AttributeDefinition[]) || [];
};

export const getExistingTableColumnNames = async (resourceName: string): Promise<string[]> => {
  return (await getExistingStorageAttributeDefinitions(resourceName)).map((att) => att.AttributeName.toString());
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
  const cfnTable = Object.values(cfnTemplate!.Resources!).find((resource) => resource.Type === 'AWS::DynamoDB::Table') as Table | undefined;
  return cfnTable;
};

export enum DdbAttrType {
  S = 'S', // string
  N = 'N', // number
  B = 'B', // binary
  BOOL = 'BOOL', // boolean
  NULL = 'NULL', // null
  L = 'L', // list
  M = 'M', // map
  SS = 'SS', // string-set
  NS = 'NS', // number-set
  BS = 'BS', // binary-set
}

const ddbAttrToFieldType: Record<DdbAttrType, FieldType> = {
  [DdbAttrType.S]: FieldType.string,
  [DdbAttrType.N]: FieldType.number,
  [DdbAttrType.B]: FieldType.binary,
  [DdbAttrType.BOOL]: FieldType.boolean,
  [DdbAttrType.NULL]: FieldType.null,
  [DdbAttrType.L]: FieldType.list,
  [DdbAttrType.M]: FieldType.map,
  [DdbAttrType.SS]: FieldType.stringSet,
  [DdbAttrType.NS]: FieldType.numberSet,
  [DdbAttrType.BS]: FieldType.binarySet,
};

const fieldTypeToDdbAttr: Record<FieldType, DdbAttrType> = {
  [FieldType.string]: DdbAttrType.S,
  [FieldType.number]: DdbAttrType.N,
  [FieldType.binary]: DdbAttrType.B,
  [FieldType.boolean]: DdbAttrType.BOOL,
  [FieldType.null]: DdbAttrType.NULL,
  [FieldType.list]: DdbAttrType.L,
  [FieldType.map]: DdbAttrType.M,
  [FieldType.stringSet]: DdbAttrType.SS,
  [FieldType.numberSet]: DdbAttrType.NS,
  [FieldType.binarySet]: DdbAttrType.BS,
};

export const getFieldType = (ddbAttr: DdbAttrType): FieldType => {
  const result = ddbAttrToFieldType[ddbAttr];
  if (!result) {
    throw new Error(`Unknown DDB attribute type ${ddbAttr}`);
  }
  return result;
};

export const getDdbAttrType = (fieldType: FieldType): DdbAttrType => {
  const result = fieldTypeToDdbAttr[fieldType];
  if (!result) {
    throw new Error(`Unknown FieldType ${fieldType}`);
  }
  return result;
};
