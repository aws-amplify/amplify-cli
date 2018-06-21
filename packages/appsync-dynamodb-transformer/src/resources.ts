import DynamoDB from 'cloudform/types/dynamoDb'
import AppSync from 'cloudform/types/appSync'
import IAM from 'cloudform/types/iam'
import Output from 'cloudform/types/output'
import Template from 'cloudform/types/template'
import { Fn, StringParameter, NumberParameter, Lambda, Elasticsearch, Refs } from 'cloudform'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw,
    forEach, compoundExpression, qref, toJson
} from 'appsync-mapping-template'
import { toUpper, graphqlName } from './util'

type AppSyncDataSourceType = 'AMAZON_DYNAMODB' | 'AMAZON_ELASTICSEARCH' | 'AWS_LAMBDA' | 'NONE'

export class ResourceFactory {

    // Resources
    public static GraphQLAPILogicalID = 'GraphQLAPI'
    public static GraphQLSchemaLogicalID = 'GraphQLSchema'
    public static DynamoDBTableLogicalID = 'DynamoDBTable'
    public static DynamoDBAccessIAMRoleLogicalID = 'DynamoDBAccessIAMRole'
    public static APIKeyLogicalID = 'APIKey'

    // Outputs
    public static GraphQLAPIEndpointOutput = 'GraphQLAPIEndpoint'
    public static GraphQLAPIApiKeyOutput = 'GraphQLAPIKey'

    // DataSource
    public static DynamoDBDataSourceLogicalID = 'DynamoDBDataSource'

    public static ParameterIds = {
        AppSyncApiName: 'AppSyncApiName',
        DynamoDBTableName: 'DynamoDBTableName',
        ReadIOPS: 'ReadIOPS',
        WriteIOPS: 'WriteIOPS',
        DynamoDBAccessIAMRoleName: 'DynamoDBAccessIAMRoleName',
    }

    public makeParams() {
        return {
            [ResourceFactory.ParameterIds.AppSyncApiName]: new StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            }),
            [ResourceFactory.ParameterIds.DynamoDBTableName]: new StringParameter({
                Description: 'The name of the DynamoDB table backing your API.',
                Default: 'AppSyncSimpleTransformTable'
            }),
            [ResourceFactory.ParameterIds.ReadIOPS]: new NumberParameter({
                Description: 'The number of read IOPS the table should support.',
                Default: 5
            }),
            [ResourceFactory.ParameterIds.WriteIOPS]: new NumberParameter({
                Description: 'The number of write IOPS the table should support.',
                Default: 5
            }),
            [ResourceFactory.ParameterIds.DynamoDBAccessIAMRoleName]: new StringParameter({
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
                [ResourceFactory.GraphQLAPILogicalID]: this.makeAppSyncAPI(),
                [ResourceFactory.DynamoDBTableLogicalID]: this.makeDynamoDBTable(),
                [ResourceFactory.DynamoDBAccessIAMRoleLogicalID]: this.makeIAMRole(),
                [ResourceFactory.DynamoDBDataSourceLogicalID]: this.makeDynamoDBDataSource(),
                [ResourceFactory.APIKeyLogicalID]: this.makeAppSyncApiKey()
            },
            Outputs: {
                [ResourceFactory.GraphQLAPIEndpointOutput]: this.makeAPIEndpointOutput(),
                [ResourceFactory.GraphQLAPIApiKeyOutput]: this.makeApiKeyOutput()
            }
        }
    }

    /**
     * Create the AppSync API.
     */
    public makeAppSyncAPI() {
        return new AppSync.GraphQLApi({
            Name: Fn.Ref(ResourceFactory.ParameterIds.AppSyncApiName),
            AuthenticationType: 'API_KEY'
        })
    }

    public makeAppSyncSchema(schema: string) {
        return new AppSync.GraphQLSchema({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Definition: schema
        })
    }

    public makeAppSyncApiKey() {
        return new AppSync.ApiKey({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId')
        })
    }

    /**
     * Outputs
     */
    public makeAPIEndpointOutput(): Output {
        return {
            Description: "Your GraphQL API endpoint.",
            Value: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'GraphQLUrl'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiEndpoint"])
            }
        }
    }

    public makeApiKeyOutput(): Output {
        return {
            Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
            Value: Fn.GetAtt(ResourceFactory.APIKeyLogicalID, 'ApiKey'),
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
            TableName: Fn.Ref(ResourceFactory.ParameterIds.DynamoDBTableName),
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
                ReadCapacityUnits: Fn.Ref(ResourceFactory.ParameterIds.ReadIOPS),
                WriteCapacityUnits: Fn.Ref(ResourceFactory.ParameterIds.WriteIOPS)
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
            RoleName: Fn.Ref(ResourceFactory.ParameterIds.DynamoDBAccessIAMRoleName),
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
                                    Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'Arn'),
                                    Fn.Join('/', [Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'Arn'), '*'])
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
        const logicalName = ResourceFactory.DynamoDBTableLogicalID
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_DYNAMODB',
            ServiceRoleArn: Fn.GetAtt(ResourceFactory.DynamoDBAccessIAMRoleLogicalID, 'Arn'),
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
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
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
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID)
    }

    public makeUpdateResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName(`update` + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
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
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeGetResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('get' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
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
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type 
     */
    public makeDeleteResolver(type: string, nameOverride?: string) {
        const fieldName = nameOverride ? nameOverride : graphqlName('delete' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
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
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID)
    }
}
