import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { Table } from '@aws-cdk/aws-dynamodb';
import * as assert from 'assert';
import { ListValueNode, ObjectTypeDefinitionNode, StringValueNode } from 'graphql';
import { ModelResourceIDs } from 'graphql-transformer-common';

/**
 * getKeySchema
 */
export const getKeySchema = (table: any, indexName?: string): any => (
  (
    table.globalSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName)
      ?? table.localSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName)
  )?.keySchema ?? table.keySchema
);

/**
 * getTable
 */
export const getTable = (ctx: TransformerContextProvider, object: ObjectTypeDefinitionNode): any => {
  const ddbDataSource = ctx.dataSources.get(object) as DynamoDbDataSource;
  const tableName = ModelResourceIDs.ModelTableResourceID(object.name.value);
  const table = ddbDataSource.ds.stack.node.findChild(tableName) as Table;

  assert.ok(table);
  return table;
};

/**
 * getSortKeyFieldNames
 */
export const getSortKeyFieldNames = (type: ObjectTypeDefinitionNode): string[] => {
  const sortKeyFieldNames: string[] = [];

  type.fields!.forEach(field => {
    field.directives!.forEach(directive => {
      if (directive.name.value === 'primaryKey') {
        const values = directive.arguments?.find(arg => arg.name.value === 'sortKeyFields')?.value as ListValueNode;
        if (values) {
          sortKeyFieldNames.push(...values.values.map(it => (it as StringValueNode).value));
        }
      }
    });
  });

  return sortKeyFieldNames;
};
