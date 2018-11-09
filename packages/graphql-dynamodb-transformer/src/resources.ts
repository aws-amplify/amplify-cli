import DynamoDB from 'cloudform/types/dynamoDb'
import AppSync from 'cloudform/types/appSync'
import IAM from 'cloudform/types/iam'
import Output from 'cloudform/types/output'
import Template from 'cloudform/types/template'
import { Fn, StringParameter, NumberParameter, Refs } from 'cloudform'
import {
    DynamoDBMappingTemplate, printBlock, str, print,
    ref, obj, set, nul,
    ifElse, compoundExpression, qref, bool, equals, iff, raw, comment
} from 'graphql-mapping-template'
import { ResourceConstants, plurality, graphqlName, toUpper, ModelResourceIDs } from 'graphql-transformer-common'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AppSyncApiName]: new StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS]: new NumberParameter({
                Description: 'The number of read IOPS the table should support.',
                Default: 5
            }),
            [ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS]: new NumberParameter({
                Description: 'The number of write IOPS the table should support.',
                Default: 5
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
                [ResourceConstants.RESOURCES.APIKeyLogicalID]: this.makeAppSyncApiKey()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.GraphQLAPIIdOutput]: this.makeAPIIDOutput(),
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
            Name: Fn.If(
                ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                Fn.Join('-', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName), Fn.Ref(ResourceConstants.PARAMETERS.Env)]),
                Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName)
            ),
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
    public makeAPIIDOutput(): Output {
        return {
            Description: "Your GraphQL API ID.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiId"])
            }
        }
    }

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
     * Create a DynamoDB table for a specific type.
     */
    public makeModelTable(typeName: string, hashKey: string = 'id', rangeKey?: string) {
        const keySchema = hashKey && rangeKey ? [
            {
                AttributeName: hashKey,
                KeyType: 'HASH'
            }, {
                AttributeName: rangeKey,
                KeyType: 'RANGE'
            }] : [{ AttributeName: hashKey, KeyType: 'HASH' }]
        const attributeDefinitions = hashKey && rangeKey ? [
            {
                AttributeName: hashKey,
                AttributeType: 'S'
            }, {
                AttributeName: rangeKey,
                AttributeType: 'S'
            }] : [{ AttributeName: hashKey, AttributeType: 'S' }]
        return new DynamoDB.Table({
            TableName: Fn.If(
                ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                Fn.Join('-', [
                    typeName,
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                    Fn.Ref(ResourceConstants.PARAMETERS.Env)
                ]),
                Fn.Join('-', [typeName, Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')])
            ),
            KeySchema: keySchema,
            AttributeDefinitions: attributeDefinitions,
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
    public makeIAMRole(tableId: string) {
        return new IAM.Role({
            RoleName: Fn.If(
                ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                Fn.Join('-', [
                    tableId.slice(0, 21), // max of 64. 64-10-26-4-3 = 21
                    'role', // 4
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
                    Fn.Ref(ResourceConstants.PARAMETERS.Env) // 10
                ]),
                Fn.Join('-', [
                    tableId.slice(0, 31), // max of 64. 64-26-4-3 = 31
                    'role',
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
                ])
            ),
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
                                    Fn.GetAtt(tableId, 'Arn'),
                                    Fn.Join('/', [Fn.GetAtt(tableId, 'Arn'), '*'])
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
    public makeDynamoDBDataSource(tableId: string, iamRoleLogicalID: string) {
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: tableId,
            Type: 'AMAZON_DYNAMODB',
            ServiceRoleArn: Fn.GetAtt(iamRoleLogicalID, 'Arn'),
            DynamoDBConfig: {
                AwsRegion: Fn.Select(3, Fn.Split(':', Fn.GetAtt(tableId, 'Arn'))),
                TableName: Fn.Ref(tableId)
            }
        }).dependsOn(tableId).dependsOn(iamRoleLogicalID)
    }

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeCreateResolver(type: string, nameOverride?: string, mutationTypeName: string = 'Mutation') {
        const fieldName = nameOverride ? nameOverride : graphqlName('create' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: mutationTypeName,
            RequestMappingTemplate: printBlock('Prepare DynamoDB PutItem Request')(
                compoundExpression([
                    qref('$context.args.input.put("createdAt", $util.time.nowISO8601())'),
                    qref('$context.args.input.put("updatedAt", $util.time.nowISO8601())'),
                    qref(`$context.args.input.put("__typename", "${type}")`),
                    DynamoDBMappingTemplate.putItem({
                        key: obj({
                            id: raw(`$util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.args.input.id, $util.autoId()))`)
                        }),
                        attributeValues: ref('util.dynamodb.toMapValuesJson($context.args.input)'),
                        condition: obj({
                            expression: str(`attribute_not_exists(#id)`),
                            expressionNames: obj({
                                "#id": str('id')
                            })
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    public makeUpdateResolver(type: string, nameOverride?: string, mutationTypeName: string = 'Mutation') {
        const fieldName = nameOverride ? nameOverride : graphqlName(`update` + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: mutationTypeName,
            RequestMappingTemplate: print(
                compoundExpression([
                    ifElse(
                        raw(`$${ResourceConstants.SNIPPETS.AuthCondition} && $${ResourceConstants.SNIPPETS.AuthCondition}.expression != ""`),
                        compoundExpression([
                            set(ref('condition'), ref(ResourceConstants.SNIPPETS.AuthCondition)),
                            qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                            qref('$condition.expressionNames.put("#id", "id")')
                        ]),
                        set(ref('condition'), obj({
                            expression: str("attribute_exists(#id)"),
                            expressionNames: obj({
                                "#id": str("id")
                            }),
                            expressionValues: obj({}),
                        }))
                    ),
                    comment('Automatically set the updatedAt timestamp.'),
                    qref('$context.args.input.put("updatedAt", $util.time.nowISO8601())'),
                    qref(`$context.args.input.put("__typename", "${type}")`),
                    comment('Update condition if type is @versioned'),
                    iff(
                        ref(ResourceConstants.SNIPPETS.VersionedCondition),
                        compoundExpression([
                            // tslint:disable-next-line
                            qref(`$condition.put("expression", "($condition.expression) AND $${ResourceConstants.SNIPPETS.VersionedCondition}.expression")`),
                            qref(`$condition.expressionNames.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionNames)`),
                            qref(`$condition.expressionValues.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionValues)`)
                        ])
                    ),
                    DynamoDBMappingTemplate.updateItem({
                        key: obj({
                            id: obj({ S: str('$context.args.input.id') })
                        }),
                        condition: ref('util.toJson($condition)')
                    })
                ])
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
    public makeGetResolver(type: string, nameOverride?: string, queryTypeName: string = 'Query') {
        const fieldName = nameOverride ? nameOverride : graphqlName('get' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
            RequestMappingTemplate: print(
                DynamoDBMappingTemplate.getItem({
                    key: obj({
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
    public makeQueryResolver(type: string, nameOverride?: string, queryTypeName: string = 'Query') {
        const fieldName = nameOverride ? nameOverride : graphqlName(`query${toUpper(type)}`)
        const defaultPageLimit = 10
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
                    DynamoDBMappingTemplate.query({
                        query: obj({
                            'expression': str('#typename = :typename'),
                            'expressionNames': obj({
                                '#typename': str('__typename')
                            }),
                            'expressionValues': obj({
                                ':typename': obj({
                                    'S': str(type)
                                })
                            })
                        }),
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
                        )
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


    /**
     * Create a resolver that lists items in DynamoDB.
     * TODO: actually fill out the right filter expression. This is a placeholder only.
     * @param type
     */
    public makeListResolver(type: string, nameOverride?: string, queryTypeName: string = 'Query') {
        const fieldName = nameOverride ? nameOverride : graphqlName('list' + plurality(toUpper(type)))
        const defaultPageLimit = 10

        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
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
                raw('$util.toJson($ctx.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type The name of the type to delete an item of.
     * @param nameOverride A user provided override for the field name.
     */
    public makeDeleteResolver(type: string, nameOverride?: string, mutationTypeName: string = 'Mutation') {
        const fieldName = nameOverride ? nameOverride : graphqlName('delete' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: mutationTypeName,
            RequestMappingTemplate: print(
                compoundExpression([
                    ifElse(
                        ref(ResourceConstants.SNIPPETS.AuthCondition),
                        compoundExpression([
                            set(ref('condition'), ref(ResourceConstants.SNIPPETS.AuthCondition)),
                            qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                            qref('$condition.expressionNames.put("#id", "id")')
                        ]),
                        set(ref('condition'), obj({
                            expression: str("attribute_exists(#id)"),
                            expressionNames: obj({
                                "#id": str("id")
                            })
                        }))
                    ),
                    iff(
                        ref(ResourceConstants.SNIPPETS.VersionedCondition),
                        compoundExpression([
                            // tslint:disable-next-line
                            qref(`$condition.put("expression", "($condition.expression) AND $${ResourceConstants.SNIPPETS.VersionedCondition}.expression")`),
                            qref(`$condition.expressionNames.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionNames)`),
                            set(ref('expressionValues'), raw('$util.defaultIfNull($condition.expressionValues, {})')),
                            qref(`$expressionValues.putAll($${ResourceConstants.SNIPPETS.VersionedCondition}.expressionValues)`),
                            set(ref('condition.expressionValues'), ref('expressionValues'))
                        ])
                    ),
                    DynamoDBMappingTemplate.deleteItem({
                        key: obj({
                            id: ref('util.dynamodb.toDynamoDBJson($ctx.args.input.id)')
                        }),
                        condition: ref('util.toJson($condition)')
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }
}
