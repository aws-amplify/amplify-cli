import { AttributeDefinition, GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import { DynamoDB, IntrinsicFunction } from 'cloudform';
import { KeySchema } from 'cloudform-types/types/dynamoDb/table';
import _ from 'lodash';
import { GSIRecord } from './utils';

export const MAX_GSI_PER_TABLE = 20;
/**
 * Extract the GlobalSecondaryIndex information and required Attributes from a Table
 * @param indexName name of the global secondary index of which detail is extracted
 * @param table DynamoDB Table with GSI
 */
export const getGSIDetails = (indexName: string, table: DynamoDB.Table): GSIRecord | undefined => {
  const gsis = table.Properties.GlobalSecondaryIndexes ?? [];

  assertNotIntrinsicFunction<GlobalSecondaryIndex>(gsis);

  const indexItems = _.filter(gsis, {
    IndexName: indexName,
  });

  if (indexItems.length) {
    const addedGSI = indexItems[0];
    const keySchema = addedGSI.KeySchema;

    assertNotIntrinsicFunction<KeySchema>(keySchema);

    const attributesUsedInKey = keySchema.reduce((acc, attr) => {
      acc.push(attr.AttributeName);
      return acc;
    }, []);

    const existingAttrDefinition = table.Properties.AttributeDefinitions;
    assertNotIntrinsicFunction(existingAttrDefinition);

    const attributeDefinition = _.filter(existingAttrDefinition, defs => {
      return attributesUsedInKey.includes(defs.AttributeName);
    });

    return { gsi: addedGSI, attributeDefinition: attributeDefinition };
  }
};

/**
 * Helper method to add new GSI and attribute definitions
 * @param index GSIRecord with the index  and attribute definition
 * @param table DynamoDB table to which the new GSI is added
 */
export const addGSI = (index: GSIRecord, table: DynamoDB.Table): DynamoDB.Table => {
  const updatedTable = _.cloneDeep(table);

  const gsis = updatedTable.Properties.GlobalSecondaryIndexes ?? [];
  assertNotIntrinsicFunction<GlobalSecondaryIndex>(gsis);

  const existingIndices = getExistingIndexNames(table);

  if (existingIndices.length + 1 > MAX_GSI_PER_TABLE) {
    throw new Error(`DynamoDB ${table.Properties.TableName || '{UnNamedTable}'} can have max of ${MAX_GSI_PER_TABLE} GSIs`);
  }

  const indexName = index.gsi.IndexName;
  assertNotIntrinsicFunction(indexName);

  if (existingIndices.includes(indexName)) {
    throw new Error(`An index with name ${indexName} already exists`);
  }

  gsis.push(index.gsi);

  updatedTable.Properties.GlobalSecondaryIndexes = gsis;

  const attrDefs = (updatedTable.Properties.AttributeDefinitions ?? []) as AttributeDefinition[];
  updatedTable.Properties.AttributeDefinitions = _.unionBy(attrDefs, index.attributeDefinition, 'AttributeName');

  return updatedTable;
};

/**
 * Remove an specified index and attribute definition of the fields used in given index
 * @param indexName Name of the Index
 * @param table DynamoDB table from which the index is removed
 */
export const removeGSI = (indexName: string, table: DynamoDB.Table): DynamoDB.Table => {
  const updatedTable = _.cloneDeep(table);
  const gsis = updatedTable.Properties.GlobalSecondaryIndexes;
  assertNotIntrinsicFunction(gsis);

  if (!gsis || gsis.length === 0) {
    throw new Error(`No GSIs are present in the table`);
  }

  const indexNames = gsis.map(g => g.IndexName);
  if (!indexNames.includes(indexName)) {
    throw new Error(`Table ${table.Properties.TableName || '{UnnamedTable}'} does not contain GSI ${indexName}`);
  }

  const attrDefs = updatedTable.Properties.AttributeDefinitions;
  assertNotIntrinsicFunction(attrDefs);

  const removedIndices = _.remove(gsis, { IndexName: indexName });
  assertNotIntrinsicFunction(removedIndices);
  const currentKeySchemas = gsis.reduce((acc, gsi) => {
    acc.push(...(gsi.KeySchema as Array<KeySchema>));
    return acc;
  }, []);

  // Remove the property as it does not have any child
  if (gsis.length == 0) {
    delete updatedTable.Properties.GlobalSecondaryIndexes;
  }

  if (removedIndices?.length) {
    const removedIndex = removedIndices[0];

    const removedKeySchema = removedIndex.KeySchema;
    assertNotIntrinsicFunction(removedKeySchema);

    const attrToRemove = _.differenceBy(removedKeySchema, currentKeySchemas, 'AttributeName');
    _.pullAllBy(attrDefs, attrToRemove, 'AttributeName');
  }

  return updatedTable;
};
/**
 * Asserts a List is not an intrinsic function which is not generated and supported by transformer
 * @param x record
 */
export function assertNotIntrinsicFunction<A>(x: A[] | A | IntrinsicFunction): asserts x is A[] | A {
  if (x instanceof IntrinsicFunction) {
    throw new Error('Intrinsic functions are not supported in KeySchema and GlobalSecondaryIndex');
  }
}

export const getExistingIndexNames = (table: DynamoDB.Table): string[] => {
  const gsis = table.Properties.GlobalSecondaryIndexes ?? [];
  assertNotIntrinsicFunction(gsis);
  return gsis.reduce((acc, idx) => [...acc, idx.IndexName], []);
};
