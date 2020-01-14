import Table, { GlobalSecondaryIndex, KeySchema, Projection, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table';
import Resolver from 'cloudform-types/types/appSync/resolver';
import Template from 'cloudform-types/types/template';
import { Fn, Refs } from 'cloudform-types';
import { ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode } from 'graphql';
import {
  DynamoDBMappingTemplate,
  str,
  print,
  ref,
  obj,
  set,
  nul,
  ObjectNode,
  ifElse,
  compoundExpression,
  bool,
  equals,
  iff,
  raw,
  comment,
  qref,
  Expression,
  block,
} from 'graphql-mapping-template';
import {
  ResourceConstants,
  ModelResourceIDs,
  DEFAULT_SCALARS,
  NONE_VALUE,
  NONE_INT_VALUE,
  applyKeyConditionExpression,
  attributeTypeFromScalar,
  toCamelCase,
  applyCompositeKeyConditionExpression,
} from 'graphql-transformer-common';
import { InvalidDirectiveError } from 'graphql-transformer-core';

export class ResourceFactory {
  public makeParams() {
    return {};
  }

  /**
   * Creates the barebones template for an application.
   */
  public initTemplate(): Template {
    return {
      Parameters: this.makeParams(),
      Resources: {},
      Outputs: {},
    };
  }

  /**
   * Add a GSI for the connection if one does not already exist.
   * @param table The table to add the GSI to.
   */
  public updateTableForConnection(
    table: Table,
    connectionName: string,
    connectionAttributeName: string,
    sortField: { name: string; type: string } = null
  ): Table {
    const gsis = <GlobalSecondaryIndex[]>table.Properties.GlobalSecondaryIndexes || ([] as GlobalSecondaryIndex[]);
    if (gsis.length >= 20) {
      throw new InvalidDirectiveError(
        `Cannot create connection ${connectionName}. Table ${table.Properties.TableName} out of GSI capacity.`
      );
    }
    const connectionGSIName = `gsi-${connectionName}`;

    // If the GSI does not exist yet then add it.
    const existingGSI = gsis.find(gsi => gsi.IndexName === connectionGSIName);
    if (!existingGSI) {
      const keySchema = [new KeySchema({ AttributeName: connectionAttributeName, KeyType: 'HASH' })];
      if (sortField) {
        keySchema.push(new KeySchema({ AttributeName: sortField.name, KeyType: 'RANGE' }));
      }
      gsis.push(
        new GlobalSecondaryIndex({
          IndexName: connectionGSIName,
          KeySchema: keySchema,
          Projection: new Projection({
            ProjectionType: 'ALL',
          }),
          ProvisionedThroughput: Fn.If(ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling, Refs.NoValue, {
            ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
            WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS),
          }) as any,
        })
      );
    }

    // If the attribute definition does not exist yet, add it.
    const attributeDefinitions = table.Properties.AttributeDefinitions as AttributeDefinition[];
    const existingAttribute = attributeDefinitions.find(attr => attr.AttributeName === connectionAttributeName);
    if (!existingAttribute) {
      attributeDefinitions.push(
        new AttributeDefinition({
          AttributeName: connectionAttributeName,
          AttributeType: 'S',
        })
      );
    }

    // If the attribute definition does not exist yet, add it.
    if (sortField) {
      const existingSortAttribute = attributeDefinitions.find(attr => attr.AttributeName === sortField.name);
      if (!existingSortAttribute) {
        const scalarType = DEFAULT_SCALARS[sortField.type];
        const attributeType = scalarType === 'String' ? 'S' : 'N';
        attributeDefinitions.push(new AttributeDefinition({ AttributeName: sortField.name, AttributeType: attributeType }));
      }
    }

    table.Properties.GlobalSecondaryIndexes = gsis;
    table.Properties.AttributeDefinitions = attributeDefinitions;
    return table;
  }

  /**
   * Create a get item resolver for singular connections.
   * @param type The parent type name.
   * @param field The connection field name.
   * @param relatedType The name of the related type to fetch from.
   * @param connectionAttribute The name of the underlying attribute containing the id.
   * @param idFieldName The name of the field within the type that serve as the id.
   * @param sortFieldInfo The info about the sort field if specified.
   */
  public makeGetItemConnectionResolver(
    type: string,
    field: string,
    relatedType: string,
    connectionAttribute: string,
    idFieldName: string,
    sortFieldInfo?: { primarySortFieldName: string; sortFieldName: string; sortFieldIsStringLike: boolean }
  ): Resolver {
    let keyObj: ObjectNode = obj({
      [`${idFieldName}`]: ref(
        `util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttribute}, "${NONE_VALUE}"))`
      ),
    });

    if (sortFieldInfo) {
      if (sortFieldInfo.sortFieldIsStringLike) {
        keyObj.attributes.push([
          sortFieldInfo.primarySortFieldName,
          ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${sortFieldInfo.sortFieldName}, "${NONE_VALUE}"))`),
        ]);
      } else {
        // Use Int minvalue as default
        keyObj.attributes.push([
          sortFieldInfo.primarySortFieldName,
          ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.source.${sortFieldInfo.sortFieldName}, "${NONE_INT_VALUE}"))`),
        ]);
      }
    }

    return new Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(relatedType), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: print(
        DynamoDBMappingTemplate.getItem({
          key: keyObj,
        })
      ),
      ResponseMappingTemplate: print(ref('util.toJson($context.result)')),
    }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
  }

  /**
   * Create a resolver that queries an item in DynamoDB.
   * @param type
   */
  public makeQueryConnectionResolver(
    type: string,
    field: string,
    relatedType: string,
    connectionAttribute: string,
    connectionName: string,
    idFieldName: string,
    sortKeyInfo?: { fieldName: string; attributeType: 'S' | 'B' | 'N' },
    limit?: number
  ) {
    const defaultPageLimit = 10;
    const pageLimit = limit || defaultPageLimit;
    const setup: Expression[] = [
      set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${pageLimit})`)),
      set(
        ref('query'),
        obj({
          expression: str('#connectionAttribute = :connectionAttribute'),
          expressionNames: obj({
            '#connectionAttribute': str(connectionAttribute),
          }),
          expressionValues: obj({
            ':connectionAttribute': obj({
              S: str(`$context.source.${idFieldName}`),
            }),
          }),
        })
      ),
    ];
    if (sortKeyInfo) {
      setup.push(applyKeyConditionExpression(sortKeyInfo.fieldName, sortKeyInfo.attributeType, 'query'));
    }
    return new Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(relatedType), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: print(
        compoundExpression([
          ...setup,
          DynamoDBMappingTemplate.query({
            query: raw('$util.toJson($query)'),
            scanIndexForward: ifElse(
              ref('context.args.sortDirection'),
              ifElse(equals(ref('context.args.sortDirection'), str('ASC')), bool(true), bool(false)),
              bool(true)
            ),
            filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
            limit: ref('limit'),
            nextToken: ifElse(ref('context.args.nextToken'), str('$context.args.nextToken'), nul()),
            index: str(`gsi-${connectionName}`),
          }),
        ])
      ),
      ResponseMappingTemplate: print(
        compoundExpression([iff(raw('!$result'), set(ref('result'), ref('ctx.result'))), raw('$util.toJson($result)')])
      ),
    }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
  }

  // Resources for new way to parameterize @connection

  /**
   * Create a get item resolver for singular connections.
   * @param type The parent type name.
   * @param field The connection field name.
   * @param relatedType The name of the related type to fetch from.
   * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
   * @param keySchema Key schema of the index or table being queried.
   */
  public makeGetItemConnectionWithKeyResolver(
    type: string,
    field: string,
    relatedType: string,
    connectionAttributes: string[],
    keySchema: KeySchema[]
  ): Resolver {
    const partitionKeyName = keySchema[0].AttributeName as string;

    let keyObj: ObjectNode = obj({
      [partitionKeyName]: ref(
        `util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttributes[0]}, "${NONE_VALUE}"))`
      ),
    });

    // Add a composite sort key or simple sort key if there is one.
    if (connectionAttributes.length > 2) {
      const rangeKeyFields = connectionAttributes.slice(1);
      const sortKeyName = keySchema[1].AttributeName as string;
      const condensedSortKeyValue = this.condenseRangeKey(rangeKeyFields.map(keyField => `\${ctx.source.${keyField}}`));

      keyObj.attributes.push([
        sortKeyName,
        ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank("${condensedSortKeyValue}", "${NONE_VALUE}"))`),
      ]);
    } else if (connectionAttributes[1]) {
      const sortKeyName = keySchema[1].AttributeName as string;
      keyObj.attributes.push([
        sortKeyName,
        ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttributes[1]}, "${NONE_VALUE}"))`),
      ]);
    }

    return new Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(relatedType), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: print(
        compoundExpression([
          DynamoDBMappingTemplate.getItem({
            key: keyObj,
          }),
        ])
      ),
      ResponseMappingTemplate: print(ref('util.toJson($context.result)')),
    }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
  }

  /**
   * Create a resolver that queries an item in DynamoDB.
   * @param type The parent type name.
   * @param field The connection field name.
   * @param relatedType The related type to fetch from.
   * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
   * @param keySchema The keySchema for the table or index being queried.
   * @param indexName The index to run the query on.
   */
  public makeQueryConnectionWithKeyResolver(
    type: string,
    field: string,
    relatedType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    connectionAttributes: string[],
    keySchema: KeySchema[],
    indexName: string
  ) {
    const defaultPageLimit = 10;
    const setup: Expression[] = [
      set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
      set(ref('query'), this.makeExpression(keySchema, connectionAttributes)),
    ];

    // If the key schema has a sort key but one is not provided for the query, let a sort key be
    // passed in via $ctx.args.
    if (keySchema[1] && !connectionAttributes[1]) {
      const sortKeyField = relatedType.fields.find(f => f.name.value === keySchema[1].AttributeName);

      if (sortKeyField) {
        setup.push(applyKeyConditionExpression(String(keySchema[1].AttributeName), attributeTypeFromScalar(sortKeyField.type), 'query'));
      } else {
        setup.push(
          applyCompositeKeyConditionExpression(
            this.getSortKeyNames(String(keySchema[1].AttributeName)),
            'query',
            this.makeCompositeSortKeyName(String(keySchema[1].AttributeName)),
            String(keySchema[1].AttributeName)
          )
        );
      }
    }

    let queryArguments = {
      query: raw('$util.toJson($query)'),
      scanIndexForward: ifElse(
        ref('context.args.sortDirection'),
        ifElse(equals(ref('context.args.sortDirection'), str('ASC')), bool(true), bool(false)),
        bool(true)
      ),
      filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
      limit: ref('limit'),
      nextToken: ifElse(ref('context.args.nextToken'), str('$context.args.nextToken'), nul()),
      index: indexName ? str(indexName) : undefined,
    };

    if (!indexName) {
      const indexArg = 'index';
      delete queryArguments[indexArg];
    }

    const queryObj = DynamoDBMappingTemplate.query(queryArguments);

    return new Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(relatedType.name.value), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: print(compoundExpression([...setup, queryObj])),
      ResponseMappingTemplate: print(
        compoundExpression([iff(raw('!$result'), set(ref('result'), ref('ctx.result'))), raw('$util.toJson($result)')])
      ),
    }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
  }

  /**
   * Makes the query expression based on whether there is a sort key to be used for the query
   * or not.
   * @param keySchema The key schema for the table or index being queried.
   * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
   */
  public makeExpression(keySchema: KeySchema[], connectionAttributes: string[]): ObjectNode {
    if (keySchema[1] && connectionAttributes[1]) {
      let condensedSortKeyValue: string = undefined;
      if (connectionAttributes.length > 2) {
        const rangeKeyFields = connectionAttributes.slice(1);
        condensedSortKeyValue = this.condenseRangeKey(rangeKeyFields.map(keyField => `\${context.source.${keyField}}`));
      }

      return obj({
        expression: str('#partitionKey = :partitionKey AND #sortKey = :sortKey'),
        expressionNames: obj({
          '#partitionKey': str(String(keySchema[0].AttributeName)),
          '#sortKey': str(String(keySchema[1].AttributeName)),
        }),
        expressionValues: obj({
          ':partitionKey': obj({
            S: str(`$context.source.${connectionAttributes[0]}`),
          }),
          ':sortKey': obj({
            S: str(condensedSortKeyValue || `$context.source.${connectionAttributes[1]}`),
          }),
        }),
      });
    }

    return obj({
      expression: str('#partitionKey = :partitionKey'),
      expressionNames: obj({
        '#partitionKey': str(String(keySchema[0].AttributeName)),
      }),
      expressionValues: obj({
        ':partitionKey': obj({
          S: str(`$context.source.${connectionAttributes[0]}`),
        }),
      }),
    });
  }

  private condenseRangeKey(fields: string[]) {
    return fields.join(ModelResourceIDs.ModelCompositeKeySeparator());
  }

  public makeCompositeSortKeyName(sortKeyName: string) {
    const attributeNames = sortKeyName.split(ModelResourceIDs.ModelCompositeKeySeparator());
    return toCamelCase(attributeNames);
  }

  private getSortKeyNames(compositeSK: string) {
    return compositeSK.split(ModelResourceIDs.ModelCompositeKeySeparator());
  }
}
