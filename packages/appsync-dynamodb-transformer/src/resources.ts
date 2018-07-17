import DynamoDB from 'cloudform/types/dynamoDb'
import AppSync from 'cloudform/types/appSync'
import IAM from 'cloudform/types/iam'
import Output from 'cloudform/types/output'
import Template from 'cloudform/types/template'
import { Fn, StringParameter, NumberParameter, Refs } from 'cloudform'
import {
    DynamoDBMappingTemplate,  print, str,
    ref, obj, set, nul,
    ifElse, compoundExpression, qref
} from 'appsync-mapping-template'
import { ResourceConstants, graphqlName, toUpper } from 'appsync-transformer-common'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AppSyncApiName]: new StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableName]: new StringParameter({
                Description: 'The name of the DynamoDB table backing your API.',
                Default: 'AppSyncSimpleTransformTable'
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS]: new NumberParameter({
                Description: 'The number of read IOPS the table should support.',
                Default: 5
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS]: new NumberParameter({
                Description: 'The number of write IOPS the table should support.',
                Default: 5
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableAccessIAMRoleName]: new StringParameter({
                Description: 'The name of the IAM role assumed by AppSync.',
                Default: 'AppSyncSimpleTransformRole'
            })
        }
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {
                [ResourceConstants.RESOURCES.GraphQLAPILogicalID]: this.makeAppSyncAPI(),
                [ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID]: this.makeDynamoDBTable(),
                [ResourceConstants.RESOURCES.DynamoDBModelTableAccessIAMRoleLogicalID]: this.makeIAMRole(),
                [ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID]: this.makeDynamoDBDataSource(),
                [ResourceConstants.RESOURCES.APIKeyLogicalID]: this.makeAppSyncApiKey()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput]: this.makeAPIEndpointOutput(),
                [ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput]: this.makeApiKeyOutput()
            }
        }
    }

    /**
     * Create the AppSync API.
     */
    public makeAppSyncAPI() {
        return new AppSync.GraphQLApi({
            Name: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName),
            AuthenticationType: 'API_KEY'
        })
    }

    public makeAppSyncSchema(schema: string) {
        return new AppSync.GraphQLSchema({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Definition: schema
        })
    }

    public makeAppSyncApiKey() {
        return new AppSync.ApiKey({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
        })
    }

    /**
     * Outputs
     */
    public makeAPIEndpointOutput(): Output {
        return {
            Description: "Your GraphQL API endpoint.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'GraphQLUrl'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiEndpoint"])
            }
        }
    }

    public makeApiKeyOutput(): Output {
        return {
            Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.APIKeyLogicalID, 'ApiKey'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiKey"])
            }
        }
    }

    /**
     * Create the DynamoDB table that will hold all objects for our application.
     * @param name The name of the DynamoDB table to use.
     */
    public makeDynamoDBTable() {
        return new DynamoDB.Table({
            TableName: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableName),
            KeySchema: [{
                AttributeName: '__typename',
                KeyType: 'HASH'
            }, {
                AttributeName: 'id',
                KeyType: 'RANGE'
            }],
            AttributeDefinitions: [{
                AttributeName: '__typename',
                AttributeType: 'S'
            }, {
                AttributeName: 'id',
                AttributeType: 'S'
            }],
            ProvisionedThroughput: {
                ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
                WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS)
            },
            StreamSpecification: {
                StreamViewType: 'NEW_AND_OLD_IMAGES'
            }
        })
    }

    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    public makeIAMRole() {
        return new IAM.Role({
            RoleName: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableAccessIAMRoleName),
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'appsync.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]
            },
            Policies: [
                new IAM.Role.Policy({
                    PolicyName: 'DynamoDBAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    'dynamodb:BatchGetItem',
                                    'dynamodb:BatchWriteItem',
                                    'dynamodb:PutItem',
                                    'dynamodb:DeleteItem',
                                    'dynamodb:GetItem',
                                    'dynamodb:Scan',
                                    'dynamodb:Query',
                                    'dynamodb:UpdateItem'
                                ],
                                Resource: [
                                    Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'),
                                    Fn.Join('/', [Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'), '*'])
                                ]
                            }
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the dynamodb table.
     */
    public makeDynamoDBDataSource() {
        const logicalName = ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_DYNAMODB',
            ServiceRoleArn: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableAccessIAMRoleLogicalID, 'Arn'),
            DynamoDBConfig: {
                AwsRegion: Fn.Select(3, Fn.Split(':', Fn.GetAtt(logicalName, 'Arn'))),
                TableName: Fn.Ref(logicalName)
            }
        })
    }

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeCreateResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('create' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('value'), ref('util.map.copyAndRemoveAllKeys($context.args.input, [])')),
                    qref('$value.put("createdAt", "$util.time.nowISO8601()")'),
                    qref('$value.put("updatedAt", "$util.time.nowISO8601()")'),
                    DynamoDBMappingTemplate.putItem({
                        key: obj({
                            '__typename': obj({ S: str(type) }),
                            id: obj({ S: str(`$util.autoId()`) })
                        }),
                        attributeValues: ref('util.dynamodb.toMapValuesJson($value)'),
                        condition: obj({
                            expression: str(`attribute_not_exists(#type) AND attribute_not_exists(#id)`),
                            expressionNames: obj({
                                "#type": str('__typename'),
                                "#id": str('id'),
                            })
                        })
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    public makeUpdateResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName(`update` + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: print(
                DynamoDBMappingTemplate.updateItem({
                    key: obj({
                        '__typename': obj({ S: str(type) }),
                        id: obj({ S: str('$context.args.input.id') })
                    }),
                    condition: obj({
                        expression: str("attribute_exists(#type) AND attribute_exists(#id)"),
                        expressionNames: obj({
                            "#type": str("__typename"),
                            "#id": str("id")
                        })
                    })
                })
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeGetResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('get' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: print(
                DynamoDBMappingTemplate.getItem({
                    key: obj({
                        '__typename': obj({ S: str(type) }),
                        id: ref('util.dynamodb.toDynamoDBJson($ctx.args.id)')
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
    public makeQueryResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName(`query${toUpper(type)}`)
        const defaultPageLimit = 10
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
                    DynamoDBMappingTemplate.query({
                        query: obj({
                            'expression' : str('#typename = :typename'),
                            'expressionNames' : obj({
                                '#typename' : str('__typename')
                            }),
                            'expressionValues' : obj({
                                ':typename' : obj({
                                    'S' : str(type)
                                })
                            })
                        }),
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
                        )
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                DynamoDBMappingTemplate.paginatedResponse()
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }


    /**
     * Create a resolver that lists items in DynamoDB.
     * TODO: actually fill out the right filter expression. This is a placeholder only.
     * @param type
     */
    public makeListResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('list' + toUpper(type))
        const defaultPageLimit = 10

        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
                    DynamoDBMappingTemplate.listItem({
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
                        )
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                DynamoDBMappingTemplate.paginatedResponse()
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type The name of the type to delete an item of.
     * @param nameOverride A user provided override for the field name.
     */
    public makeDeleteResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('delete' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: print(
                DynamoDBMappingTemplate.deleteItem({
                    key: obj({
                        '__typename': obj({ S: str(type) }),
                        id: ref('util.dynamodb.toDynamoDBJson($ctx.args.input.id)')
                    })
                })
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }
}
