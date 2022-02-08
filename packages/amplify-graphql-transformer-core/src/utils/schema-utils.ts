import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { Table } from '@aws-cdk/aws-dynamodb';
import assert from 'assert';
import { ObjectTypeDefinitionNode } from 'graphql';
import { ModelResourceIDs } from 'graphql-transformer-common';

export function getKeySchema(table: any, indexName?: string): any {
  return (
    (
      table.globalSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName) ??
      table.localSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName)
    )?.keySchema ?? table.keySchema
  );
}

export function getTable(ctx: TransformerContextProvider, object: ObjectTypeDefinitionNode): any {
  const ddbDataSource = ctx.dataSources.get(object) as DynamoDbDataSource;
  const tableName = ModelResourceIDs.ModelTableResourceID(object.name.value);
  const table = ddbDataSource.ds.stack.node.findChild(tableName) as Table;

  assert(table);
  return table;
}
