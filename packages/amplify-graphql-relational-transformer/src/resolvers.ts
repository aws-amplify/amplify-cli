import assert from 'assert';
import { MappingTemplate } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { Table } from '@aws-cdk/aws-dynamodb';
import * as cdk from '@aws-cdk/core';
import { ObjectTypeDefinitionNode } from 'graphql';
import {
  bool,
  compoundExpression,
  DynamoDBMappingTemplate,
  equals,
  Expression,
  ifElse,
  iff,
  list,
  nul,
  obj,
  ObjectNode,
  or,
  print,
  raw,
  ref,
  set,
  str,
} from 'graphql-mapping-template';
import {
  applyCompositeKeyConditionExpression,
  applyKeyConditionExpression,
  attributeTypeFromScalar,
  ModelResourceIDs,
  NONE_VALUE,
  ResourceConstants,
  toCamelCase,
} from 'graphql-transformer-common';
import { HasManyDirectiveConfiguration, HasOneDirectiveConfiguration } from './types';
import { getConnectionAttributeName } from './utils';

export function makeGetItemConnectionWithKeyResolver(config: HasOneDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { connectionFields, field, fields, object, relatedType, relatedTypeIndex } = config;
  assert(relatedTypeIndex.length > 0);
  const localFields = fields.length > 0 ? fields : connectionFields;
  const table = getTable(ctx, relatedType);
  const { keySchema } = table as any;
  const dataSource = ctx.api.host.getDataSource(`${relatedType.name.value}Table`);
  const partitionKeyName = keySchema[0].attributeName;
  const keyObj = {
    [partitionKeyName]: ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${localFields[0]}, "${NONE_VALUE}"))`),
  };

  // Add a composite sort key or simple sort key if there is one.
  if (relatedTypeIndex.length > 2) {
    const rangeKeyFields = localFields.slice(1);
    const sortKeyName = keySchema[1].attributeName;
    const condensedSortKeyValue = condenseRangeKey(rangeKeyFields.map(keyField => `\${ctx.source.${keyField}}`));

    keyObj[sortKeyName] = ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank("${condensedSortKeyValue}", "${NONE_VALUE}"))`);
  } else if (relatedTypeIndex.length === 2) {
    const sortKeyName = keySchema[1].attributeName;

    keyObj[sortKeyName] = ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${localFields[1]}, "${NONE_VALUE}"))`);
  }

  const resolver = ctx.resolvers.generateQueryResolver(
    object.name.value,
    field.name.value,
    dataSource as any,
    MappingTemplate.s3MappingTemplateFromString(
      print(
        ifElse(
          or(localFields.map(f => raw(`$util.isNull($ctx.source.${f})`))),
          raw('#return'),
          compoundExpression([
            DynamoDBMappingTemplate.getItem({
              key: obj(keyObj),
            }),
          ]),
        ),
      ),
      `${object.name.value}.${field.name.value}.req.vtl`,
    ),
    MappingTemplate.s3MappingTemplateFromString(
      print(DynamoDBMappingTemplate.dynamoDBResponse(false)),
      `${object.name.value}.${field.name.value}.res.vtl`,
    ),
  );

  resolver.mapToStack(table.stack);
  ctx.resolvers.addResolver(object.name.value, field.name.value, resolver);
}

export function makeQueryConnectionWithKeyResolver(config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { connectionFields, field, fields, indexName, limit, object, relatedType } = config;
  const table = getTable(ctx, relatedType);
  const dataSource = ctx.api.host.getDataSource(`${relatedType.name.value}Table`);
  const connectionAttributes: string[] = fields.length > 0 ? fields : connectionFields;
  assert(connectionAttributes.length > 0);
  const keySchema = getKeySchema(table, indexName);
  const setup: Expression[] = [
    set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${limit})`)),
    set(ref('query'), makeExpression(keySchema, connectionAttributes)),
  ];

  // If the key schema has a sort key but one is not provided for the query, let a sort key be
  // passed in via $ctx.args.
  if (keySchema[1] && !connectionAttributes[1]) {
    const sortKeyFieldName = keySchema[1].attributeName;
    const sortKeyField = relatedType.fields!.find(f => f.name.value === sortKeyFieldName);

    if (sortKeyField) {
      setup.push(applyKeyConditionExpression(sortKeyFieldName, attributeTypeFromScalar(sortKeyField.type), 'query'));
    } else {
      const sortKeyFieldNames = sortKeyFieldName.split(ModelResourceIDs.ModelCompositeKeySeparator());

      setup.push(applyCompositeKeyConditionExpression(sortKeyFieldNames, 'query', toCamelCase(sortKeyFieldNames), sortKeyFieldName));
    }
  }

  const queryArguments = {
    query: raw('$util.toJson($query)'),
    scanIndexForward: ifElse(
      ref('context.args.sortDirection'),
      ifElse(equals(ref('context.args.sortDirection'), str('ASC')), bool(true), bool(false)),
      bool(true),
    ),
    filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
    limit: ref('limit'),
    nextToken: ifElse(ref('context.args.nextToken'), ref('util.toJson($context.args.nextToken)'), nul()),
  } as any;

  if (indexName) {
    queryArguments.index = str(indexName);
  }

  const queryObj = DynamoDBMappingTemplate.query(queryArguments);
  const resolver = ctx.resolvers.generateQueryResolver(
    object.name.value,
    field.name.value,
    dataSource as any,
    MappingTemplate.s3MappingTemplateFromString(
      print(
        ifElse(
          raw(`$util.isNull($ctx.source.${connectionAttributes[0]})`),
          compoundExpression([set(ref('result'), obj({ items: list([]) })), raw('#return($result)')]),
          compoundExpression([...setup, queryObj]),
        ),
      ),
      `${object.name.value}.${field.name.value}.req.vtl`,
    ),
    MappingTemplate.s3MappingTemplateFromString(
      print(
        DynamoDBMappingTemplate.dynamoDBResponse(
          false,
          compoundExpression([iff(raw('!$result'), set(ref('result'), ref('ctx.result'))), raw('$util.toJson($result)')]),
        ),
      ),
      `${object.name.value}.${field.name.value}.res.vtl`,
    ),
  );

  resolver.mapToStack(table.stack);
  ctx.resolvers.addResolver(object.name.value, field.name.value, resolver);
}

function makeExpression(keySchema: any[], connectionAttributes: string[]): ObjectNode {
  if (keySchema[1] && connectionAttributes[1]) {
    let condensedSortKeyValue;

    if (connectionAttributes.length > 2) {
      const rangeKeyFields = connectionAttributes.slice(1);

      condensedSortKeyValue = rangeKeyFields
        .map(keyField => `\${context.source.${keyField}}`)
        .join(ModelResourceIDs.ModelCompositeKeySeparator());
    }

    return obj({
      expression: str('#partitionKey = :partitionKey AND #sortKey = :sortKey'),
      expressionNames: obj({
        '#partitionKey': str(keySchema[0].attributeName),
        '#sortKey': str(keySchema[1].attributeName),
      }),
      expressionValues: obj({
        ':partitionKey': ref(`util.dynamodb.toDynamoDB($context.source.${connectionAttributes[0]})`),
        ':sortKey': ref(
          `util.dynamodb.toDynamoDB(${
            condensedSortKeyValue ? `"${condensedSortKeyValue}"` : `$context.source.${connectionAttributes[1]}`
          })`,
        ),
      }),
    });
  }

  return obj({
    expression: str('#partitionKey = :partitionKey'),
    expressionNames: obj({
      '#partitionKey': str(keySchema[0].attributeName),
    }),
    expressionValues: obj({
      ':partitionKey': ref(`util.dynamodb.toDynamoDB($context.source.${connectionAttributes[0]})`),
    }),
  });
}

function getTable(ctx: TransformerContextProvider, object: ObjectTypeDefinitionNode): Table {
  const ddbDataSource = ctx.dataSources.get(object) as DynamoDbDataSource;
  const tableName = ModelResourceIDs.ModelTableResourceID(object.name.value);
  const table = ddbDataSource.ds.stack.node.findChild(tableName) as Table;

  assert(table);
  return table;
}

function getKeySchema(table: any, indexName?: string): any {
  return (
    (
      table.globalSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName) ??
      table.localSecondaryIndexes.find((gsi: any) => gsi.indexName === indexName)
    )?.keySchema ?? table.keySchema
  );
}

function condenseRangeKey(fields: string[]): string {
  return fields.join(ModelResourceIDs.ModelCompositeKeySeparator());
}

export function updateTableForConnection(config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider) {
  let { fields, indexName } = config;

  // If an index name or list of fields was specified, then we don't need to create a GSI here.
  if (indexName || fields.length > 0) {
    return;
  }

  const { field, object, relatedType } = config;
  const connectionName = getConnectionAttributeName(object.name.value, field.name.value);
  const table = getTable(ctx, relatedType) as any;
  const gsis = table.globalSecondaryIndexes;

  indexName = `gsi-${object.name.value}.${field.name.value}`;
  config.indexName = indexName;

  // Check if the GSI already exists.
  if (gsis.some((gsi: any) => gsi.indexName === indexName)) {
    return;
  }

  table.addGlobalSecondaryIndex({
    indexName,
    projectionType: 'ALL',
    partitionKey: {
      name: connectionName,
      type: 'S',
    },
    readCapacity: cdk.Fn.ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
    writeCapacity: cdk.Fn.ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS),
  });

  // At the L2 level, the CDK does not handle the way Amplify sets GSI read and write capacity
  // very well. At the L1 level, the CDK does not create the correct IAM policy for accessing the
  // GSI. To get around these issues, keep the L1 and L2 GSI list in sync.
  const cfnTable = table.table;
  const gsi = gsis.find((gsi: any) => gsi.indexName === indexName);

  cfnTable.globalSecondaryIndexes = appendIndex(cfnTable.globalSecondaryIndexes, {
    indexName,
    keySchema: gsi.keySchema,
    projection: { projectionType: 'ALL' },
    provisionedThroughput: cdk.Fn.conditionIf(ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling, cdk.Fn.ref('AWS::NoValue'), {
      ReadCapacityUnits: cdk.Fn.ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
      WriteCapacityUnits: cdk.Fn.ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS),
    }),
  });
}

function appendIndex(list: any, newIndex: any): any[] {
  if (Array.isArray(list)) {
    list.push(newIndex);
    return list;
  }

  return [newIndex];
}
