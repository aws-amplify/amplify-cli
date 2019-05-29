import Table, { GlobalSecondaryIndex, KeySchema, Projection, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table'
import Resolver from 'cloudform-types/types/appSync/resolver'
import Template from 'cloudform-types/types/template'
import { Fn, Refs } from 'cloudform-types'
import {
    DynamoDBMappingTemplate, str, print,
    ref, obj, set, nul,
    ifElse, compoundExpression, bool, equals, iff, raw, comment, qref, Expression, block
} from 'graphql-mapping-template'
import { ResourceConstants, ModelResourceIDs, DEFAULT_SCALARS, NONE_VALUE, applyKeyConditionExpression } from 'graphql-transformer-common'
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
    public updateTableForConnection(
        table: Table,
        connectionName: string,
        connectionAttributeName: string,
        sortField: { name: string, type: string } = null
    ): Table {
        const gsis = table.Properties.GlobalSecondaryIndexes || [] as GlobalSecondaryIndex[]
        if (gsis.length >= 20) {
            throw new InvalidDirectiveError(
                `Cannot create connection ${connectionName}. Table ${table.Properties.TableName} out of GSI capacity.`
            )
        }
        const connectionGSIName = `gsi-${connectionName}`

        // If the GSI does not exist yet then add it.
        const existingGSI = gsis.find(gsi => gsi.IndexName === connectionGSIName)
        if (!existingGSI) {
            const keySchema = [new KeySchema({ AttributeName: connectionAttributeName, KeyType: 'HASH' })]
            if (sortField) {
                keySchema.push(new KeySchema({ AttributeName: sortField.name, KeyType: 'RANGE' }))
            }
            gsis.push(new GlobalSecondaryIndex({
                IndexName: connectionGSIName,
                KeySchema: keySchema,
                Projection: new Projection({
                    ProjectionType: 'ALL'
                }),
                ProvisionedThroughput: Fn.If(
                    ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling,
                    Refs.NoValue,
                    {
                        ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
                        WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS)
                    }
                ) as any,
            }))
        }

        // If the attribute definition does not exist yet, add it.
        const attributeDefinitions = table.Properties.AttributeDefinitions as AttributeDefinition[]
        const existingAttribute = attributeDefinitions.find(attr => attr.AttributeName === connectionAttributeName)
        if (!existingAttribute) {
            attributeDefinitions.push(new AttributeDefinition({
                AttributeName: connectionAttributeName,
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
     * Create a get item resolver for singular connections.
     * @param type The parent type name.
     * @param field The connection field name.
     * @param relatedType The name of the related type to fetch from.
     * @param connectionAttribute The name of the underlying attribute containing the id.
     */
    public makeGetItemConnectionResolver(type: string, field: string, relatedType: string, connectionAttribute: string): Resolver {
        return new Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(relatedType), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                DynamoDBMappingTemplate.getItem({
                    key: obj({
                        id: ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttribute}, "${NONE_VALUE}"))`)
                    })
                })
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that queries an item in DynamoDB.
     * @param type
     */
    public makeQueryConnectionResolver(
        type: string, field: string, relatedType: string, 
        connectionAttribute: string, connectionName: string, 
        sortKeyInfo?: { fieldName: string, attributeType: 'S' | 'B' | 'N' }
    ) {
        const defaultPageLimit = 10
        const setup: Expression[] = [
            set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
            set(ref('query'), obj({
                'expression': str('#connectionAttribute = :connectionAttribute'),
                'expressionNames': obj({
                    '#connectionAttribute': str(connectionAttribute)
                }),
                'expressionValues': obj({
                    ':connectionAttribute': obj({
                        'S': str('$context.source.id')
                    })
                })
            }))
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
                            ifElse(
                                equals(ref('context.args.sortDirection'), str('ASC')),
                                bool(true),
                                bool(false)
                            ),
                            bool(true)
                        ),
                        filter: ifElse(
                            ref('context.args.filter'),
                            ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'),
                            nul()
                        ),
                        limit: ref('limit'),
                        nextToken: ifElse(
                            ref('context.args.nextToken'),
                            str('$context.args.nextToken'),
                            nul()
                        ),
                        index: str(`gsi-${connectionName}`)
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                compoundExpression([
                    iff(raw('!$result'), set(ref('result'), ref('ctx.result'))),
                    raw('$util.toJson($result)')
                ])
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }
}
