import { AttributeDefinition, GlobalSecondaryIndex, KeySchema } from 'cloudform-types/types/dynamoDb/table';
import { DynamoDB, IntrinsicFunction } from 'cloudform-types';

import _ from 'lodash';
import { AmplifyError, AMPLIFY_SUPPORT_DOCS } from '@aws-amplify/amplify-cli-core';
import { GSIRecord } from '../utils/amplify-resource-state-utils';
import { DISABLE_GSI_LIMIT_CHECK_OPTION } from './amplify-graphql-resource-manager';

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

    const attributeDefinition = _.filter(existingAttrDefinition, (defs) => attributesUsedInKey.includes(defs.AttributeName));

    return { gsi: addedGSI, attributeDefinition };
  }
  return undefined;
};

/**
 * Helper method to add new GSI and attribute definitions
 * @param index GSIRecord with the index  and attribute definition
 * @param table DynamoDB table to which the new GSI is added
 * @param disableGSILimitChecks if enabled, do not check for GSI limits during iteration.
 */
export const addGSI = (index: GSIRecord, table: DynamoDB.Table, disableGSILimitCheck: boolean): DynamoDB.Table => {
  const updatedTable = _.cloneDeep(table);

  const gsis = updatedTable.Properties.GlobalSecondaryIndexes ?? [];
  assertNotIntrinsicFunction<GlobalSecondaryIndex>(gsis);

  const existingIndices = getExistingIndexNames(table);

  if (existingIndices.length + 1 > MAX_GSI_PER_TABLE && !disableGSILimitCheck) {
    const tableName = table.Properties.TableName;
    const tableNameString = tableName ? (typeof tableName === 'string' ? tableName : JSON.stringify(tableName)) : '{UnNamedTable}';
    throw new AmplifyError('ConfigurationError', {
      message: `DynamoDB ${tableNameString} can have max of ${MAX_GSI_PER_TABLE} GSIs. To disable this check, use the --${DISABLE_GSI_LIMIT_CHECK_OPTION} option.`,
    });
  }

  const indexName = index.gsi.IndexName;
  assertNotIntrinsicFunction(indexName);

  if (existingIndices.includes(indexName)) {
    throw new AmplifyError('ConfigurationError', {
      message: `An index with name ${indexName} already exists`,
    });
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
    throw new AmplifyError('ConfigurationError', {
      message: `No GSIs are present in the table`,
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  const indexNames = gsis.map((g) => g.IndexName);
  if (!indexNames.includes(indexName)) {
    throw new AmplifyError('ConfigurationError', {
      message: `Table ${table.Properties.TableName || '{UnnamedTable}'} does not contain GSI ${indexName}`,
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  const attrDefs = updatedTable.Properties.AttributeDefinitions;
  assertNotIntrinsicFunction(attrDefs);

  const removedIndices = _.remove(gsis, { IndexName: indexName });
  assertNotIntrinsicFunction(removedIndices);
  console.log(gsis);
  const gsiKeySchemas: Array<KeySchema> = gsis.reduce((acc, gsi) => {
    acc.push(...(gsi.KeySchema as Array<KeySchema>));
    return acc;
  }, []);

  // Add the KeySchema property on table to the currentKeySchemas
  const currentKeySchemas = _.union(gsiKeySchemas, (updatedTable?.Properties?.KeySchema as Array<KeySchema>) || []);

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
    throw new AmplifyError('ConfigurationError', {
      message: 'Intrinsic functions are not supported in KeySchema and GlobalSecondaryIndex',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }
}

/**
 *
 */
export const getExistingIndexNames = (table: DynamoDB.Table): string[] => {
  const gsis = table.Properties.GlobalSecondaryIndexes ?? [];
  assertNotIntrinsicFunction(gsis);
  return gsis.reduce((acc, idx) => [...acc, idx.IndexName], []);
};
