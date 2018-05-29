import DynamoDB from 'cloudform/types/dynamoDb'
import AppSync from 'cloudform/types/appSync'
import IAM from 'cloudform/types/iam'
import Template from 'cloudform/types/template'
import { Fn, StringParameter, NumberParameter } from 'cloudform'
import { DynamoDBMappingTemplate, print, str, ref, obj, set, forEach, compoundExpression, qref } from 'appsync-mapping-template'
import { toUpper, graphqlName } from './util'

type AppSyncDataSourceType = 'AMAZON_DYNAMODB' | 'AMAZON_ELASTICSEARCH' | 'AWS_LAMBDA' | 'NONE'

export class ResourceFactory {

    // Resources
    public static GraphQLAPILogicalID = 'GraphQLAPILogicalID'
    public static GraphQLSchemaLogicalID = 'GraphQLSchemaLogicalID'
    public static DynamoDBTableLogicalID = 'DynamoDBTableLogicalID'
    public static ElasticSearchLogicalID = 'ElasticSearchLogicalID'
    public static IAMRoleLogicalID = 'IAMRoleLogicalID'
    public static APIKeyLogicalID = 'APIKeyLogicalID'

    // DataSource
    public static DynamoDBDataSourceLogicalID = 'DynamoDBDataSourceLogicalID'
    public static ElasticSearchDataSourceLogicalID = 'ElasticSearchDataSourceLogicalID'

    public static ParameterIds = {
        AppSyncApiName: 'AppSyncApiName',
        DynamoDBTableName: 'DynamoDBTableName',
        ReadIOPS: 'ReadIOPS',
        WriteIOPS: 'WriteIOPS',
        ElasticSearchDomainName: 'ElasticSearchDomainName',
        IAMRoleName: 'IAMRoleName'
    }

    /**
     * The ResourceFactory creates AWS cloudformation resource specifications
     * for the simple-appsync-transform
     */
    constructor() { }

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
            [ResourceFactory.ParameterIds.IAMRoleName]: new StringParameter({
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
                [ResourceFactory.IAMRoleLogicalID]: this.makeIAMRole(),
                [ResourceFactory.DynamoDBDataSourceLogicalID]: this.makeDynamoDBDataSource(),
                [ResourceFactory.APIKeyLogicalID]: this.makeAppSyncApiKey()
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
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the elasticsearch domain.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the domain if it is different than the name of the data source.
     */
    public makeElasticSearchDataSource() {
        const logicalName = ResourceFactory.ElasticSearchLogicalID
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: Fn.Select(3, Fn.Split(':', Fn.GetAtt(logicalName, 'Arn'))),
                Endpoint: Fn.GetAtt(logicalName, 'DomainEndpoint')
            }
        })
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
            RoleName: Fn.Ref(ResourceFactory.ParameterIds.IAMRoleName),
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
     * spec for a data source pointing to the function.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the function if it is different than the name of the data source.
     */
    public makeLambdaDataSource(
        name: string,
        logicalId?: string
    ) {
        const logicalName = logicalId ? logicalId : name;
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: name,
            Type: 'AWS_LAMBDA',
            ServiceRoleArn: Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
            LambdaConfig: {
                LambdaFunctionArn: Fn.Ref(logicalName)
            }
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
            ServiceRoleArn: Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
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
    public makeCreateResolver(type: string) {
        const fieldName = graphqlName('create' + toUpper(type))
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
        })
    }

    public makeUpdateResolver(type: string) {
        const fieldName = graphqlName(`update` + toUpper(type))
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
                    })
                })
            ),
            ResponseMappingTemplate: print(
                ref('util.toJson($context.result)')
            )
        })
    }

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeGetResolver(type: string) {
        const fieldName = graphqlName('get' + toUpper(type))
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
        })
    }

    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type 
     */
    public makeDeleteResolver(type: string) {
        const fieldName = graphqlName('delete' + toUpper(type))
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
        })
    }
}
