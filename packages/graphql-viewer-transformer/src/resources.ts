import Template from 'cloudform/types/template'
import { Fn, AppSync } from 'cloudform'
import {
  str, print, ref, obj, nul, ifElse,
  compoundExpression, bool, equals, raw, DynamoDBMappingTemplate, int,
} from 'graphql-mapping-template'
import { ResourceConstants, ModelResourceIDs, DEFAULT_SCALARS } from 'graphql-transformer-common'
import Table, { GlobalSecondaryIndex, KeySchema, Projection, AttributeDefinition, ProvisionedThroughput } from 'cloudform/types/dynamoDb/table';
import { InvalidDirectiveError } from 'graphql-transformer-core';

export class ResourceFactory {

  public makeParams() {
    return {}
  }

  /**
   * Creates the barebones template for an application.
   */
  public initTemplate(): Template {
    return {
      Parameters: this.makeParams(),
      Resources: {},
      Outputs: {}
    }
  }

  /**
 * Add a GSI for the connection if one does not already exist.
 * @param table The table to add the GSI to.
 */
  public updateTableForConnection(table: Table,
    fieldName: string,
    fieldAttributeName: string,
    sortField: { name: string, type: string } = null
  ): Table {
    const gsis = table.Properties.GlobalSecondaryIndexes || [] as GlobalSecondaryIndex[]
    if (gsis.length >= 5) {
      throw new InvalidDirectiveError(
        `Cannot create connection ${fieldName}. Table ${table.Properties.TableName} out of GSI capacity.`
      )
    }
    const connectionGSIName = `gsi-${fieldName}`

    // If the GSI does not exist yet then add it.
    const existingGSI = gsis.find(gsi => gsi.IndexName === connectionGSIName)
    if (!existingGSI) {
      const keySchema = [new KeySchema({ AttributeName: fieldAttributeName, KeyType: 'HASH' })]
      if (sortField) {
        keySchema.push(new KeySchema({ AttributeName: sortField.name, KeyType: 'RANGE' }))
      }
      gsis.push(new GlobalSecondaryIndex({
        IndexName: connectionGSIName,
        KeySchema: keySchema,
        Projection: new Projection({
          ProjectionType: 'ALL'
        }),
        ProvisionedThroughput: new ProvisionedThroughput({
          ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
          WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS)
        }),
      }))
    }

    // If the attribute definition does not exist yet, add it.
    const attributeDefinitions = table.Properties.AttributeDefinitions as AttributeDefinition[]
    const existingAttribute = attributeDefinitions.find(attr => attr.AttributeName === fieldAttributeName)
    if (!existingAttribute) {
      attributeDefinitions.push(new AttributeDefinition({
        AttributeName: fieldAttributeName,
        AttributeType: 'S'
      }))
    }

    // If the attribute definition does not exist yet, add it.
    if (sortField) {
      const existingSortAttribute = attributeDefinitions.find(attr => attr.AttributeName === sortField.name)
      if (!existingSortAttribute) {
        const scalarType = DEFAULT_SCALARS[sortField.type]
        const attributeType = scalarType === 'String' ? 'S' : 'N'
        attributeDefinitions.push(new AttributeDefinition({ AttributeName: sortField.name, AttributeType: attributeType }))
      }
    }

    table.Properties.GlobalSecondaryIndexes = gsis
    table.Properties.AttributeDefinitions = attributeDefinitions
    return table
  }

  /**
  * Create a resolver that creates an item in DynamoDB.
  * @param type
  */
  public makeViewerResolver(type: string, fieldName: string, modelField: string = "email", identityField: string = "username", queryTypeName: string = 'Query') {
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
      FieldName: fieldName,
      TypeName: queryTypeName,
      RequestMappingTemplate: print(
        compoundExpression([
          DynamoDBMappingTemplate.query({
            query: obj({
              'expression': str('#fieldName = :fieldName'),
              'expressionNames': obj({
                '#fieldName': str(modelField)
              }),
              'expressionValues': obj({
                ':fieldName': obj({
                  'S': str(`$ctx.identity.${identityField}`)
                })
              })
            }),
            index: str(`gsi-${fieldName}`),
            scanIndexForward: nul(),
            filter: nul(),
            nextToken: nul(),
            limit: int(1)
          })
        ])
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.items.size() > 0'),
          raw('$util.toJson($ctx.result.items[0]'),
          nul()
        )
      )
    }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }
}
