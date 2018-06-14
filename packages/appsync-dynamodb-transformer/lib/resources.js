"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dynamoDb_1 = require("cloudform/types/dynamoDb");
var appSync_1 = require("cloudform/types/appSync");
var iam_1 = require("cloudform/types/iam");
var cloudform_1 = require("cloudform");
var appsync_mapping_template_1 = require("appsync-mapping-template");
var util_1 = require("./util");
var ResourceFactory = /** @class */ (function () {
    /**
     * The ResourceFactory creates AWS cloudformation resource specifications
     * for the appsync-dynamodb-transformerer
     */
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        return _a = {},
            _a[ResourceFactory.ParameterIds.AppSyncApiName] = new cloudform_1.StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            }),
            _a[ResourceFactory.ParameterIds.DynamoDBTableName] = new cloudform_1.StringParameter({
                Description: 'The name of the DynamoDB table backing your API.',
                Default: 'AppSyncSimpleTransformTable'
            }),
            _a[ResourceFactory.ParameterIds.ReadIOPS] = new cloudform_1.NumberParameter({
                Description: 'The number of read IOPS the table should support.',
                Default: 5
            }),
            _a[ResourceFactory.ParameterIds.WriteIOPS] = new cloudform_1.NumberParameter({
                Description: 'The number of write IOPS the table should support.',
                Default: 5
            }),
            _a[ResourceFactory.ParameterIds.DynamoDBAccessIAMRole] = new cloudform_1.StringParameter({
                Description: 'The name of the IAM role assumed by AppSync.',
                Default: 'AppSyncSimpleTransformRole'
            }),
            _a;
        var _a;
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[ResourceFactory.GraphQLAPILogicalID] = this.makeAppSyncAPI(),
                _a[ResourceFactory.DynamoDBTableLogicalID] = this.makeDynamoDBTable(),
                _a[ResourceFactory.DynamoDBAccessIAMRoleLogicalID] = this.makeIAMRole(),
                _a[ResourceFactory.DynamoDBDataSourceLogicalID] = this.makeDynamoDBDataSource(),
                _a[ResourceFactory.APIKeyLogicalID] = this.makeAppSyncApiKey(),
                _a)
        };
        var _a;
    };
    /**
     * Create the AppSync API.
     */
    ResourceFactory.prototype.makeAppSyncAPI = function () {
        return new appSync_1.default.GraphQLApi({
            Name: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.AppSyncApiName),
            AuthenticationType: 'API_KEY'
        });
    };
    ResourceFactory.prototype.makeAppSyncSchema = function (schema) {
        return new appSync_1.default.GraphQLSchema({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Definition: schema
        });
    };
    ResourceFactory.prototype.makeAppSyncApiKey = function () {
        return new appSync_1.default.ApiKey({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId')
        });
    };
    /**
     * Create the DynamoDB table that will hold all objects for our application.
     * @param name The name of the DynamoDB table to use.
     */
    ResourceFactory.prototype.makeDynamoDBTable = function () {
        return new dynamoDb_1.default.Table({
            TableName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.DynamoDBTableName),
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
                ReadCapacityUnits: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.ReadIOPS),
                WriteCapacityUnits: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.WriteIOPS)
            },
            StreamSpecification: {
                StreamViewType: 'NEW_AND_OLD_IMAGES'
            }
        });
    };
    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    ResourceFactory.prototype.makeIAMRole = function () {
        return new iam_1.default.Role({
            RoleName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.DynamoDBAccessIAMRole),
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
                new iam_1.default.Role.Policy({
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
                                    cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'Arn'),
                                    cloudform_1.Fn.Join('/', [cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'Arn'), '*'])
                                ]
                            }
                        ]
                    }
                })
            ]
        });
    };
    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the dynamodb table.
     */
    ResourceFactory.prototype.makeDynamoDBDataSource = function () {
        var logicalName = ResourceFactory.DynamoDBTableLogicalID;
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_DYNAMODB',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBAccessIAMRoleLogicalID, 'Arn'),
            DynamoDBConfig: {
                AwsRegion: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(logicalName, 'Arn'))),
                TableName: cloudform_1.Fn.Ref(logicalName)
            }
        });
    };
    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeCreateResolver = function (type) {
        var fieldName = util_1.graphqlName('create' + util_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.compoundExpression([
                appsync_mapping_template_1.set(appsync_mapping_template_1.ref('value'), appsync_mapping_template_1.ref('util.map.copyAndRemoveAllKeys($context.args.input, [])')),
                appsync_mapping_template_1.qref('$value.put("createdAt", "$util.time.nowISO8601()")'),
                appsync_mapping_template_1.qref('$value.put("updatedAt", "$util.time.nowISO8601()")'),
                appsync_mapping_template_1.DynamoDBMappingTemplate.putItem({
                    key: appsync_mapping_template_1.obj({
                        '__typename': appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str(type) }),
                        id: appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str("$util.autoId()") })
                    }),
                    attributeValues: appsync_mapping_template_1.ref('util.dynamodb.toMapValuesJson($value)'),
                    condition: appsync_mapping_template_1.obj({
                        expression: appsync_mapping_template_1.str("attribute_not_exists(#type) AND attribute_not_exists(#id)"),
                        expressionNames: appsync_mapping_template_1.obj({
                            "#type": appsync_mapping_template_1.str('__typename'),
                            "#id": appsync_mapping_template_1.str('id'),
                        })
                    })
                })
            ])),
            ResponseMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID);
    };
    ResourceFactory.prototype.makeUpdateResolver = function (type) {
        var fieldName = util_1.graphqlName("update" + util_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.DynamoDBMappingTemplate.updateItem({
                key: appsync_mapping_template_1.obj({
                    '__typename': appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str(type) }),
                    id: appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str('$context.args.input.id') })
                }),
                condition: appsync_mapping_template_1.obj({
                    expression: "attribute_exists(#type) AND attribute_exists(#id)",
                    expressionNames: appsync_mapping_template_1.obj({
                        "#type": "__typename",
                        "#id": "id"
                    })
                })
            })),
            ResponseMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeGetResolver = function (type) {
        var fieldName = util_1.graphqlName('get' + util_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.DynamoDBMappingTemplate.getItem({
                key: appsync_mapping_template_1.obj({
                    '__typename': appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str(type) }),
                    id: appsync_mapping_template_1.ref('util.dynamodb.toDynamoDBJson($ctx.args.id)')
                })
            })),
            ResponseMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeDeleteResolver = function (type) {
        var fieldName = util_1.graphqlName('delete' + util_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.DynamoDBMappingTemplate.deleteItem({
                key: appsync_mapping_template_1.obj({
                    '__typename': appsync_mapping_template_1.obj({ S: appsync_mapping_template_1.str(type) }),
                    id: appsync_mapping_template_1.ref('util.dynamodb.toDynamoDBJson($ctx.args.input.id)')
                })
            })),
            ResponseMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID);
    };
    // Resources
    ResourceFactory.GraphQLAPILogicalID = 'GraphQLAPILogicalID';
    ResourceFactory.GraphQLSchemaLogicalID = 'GraphQLSchemaLogicalID';
    ResourceFactory.DynamoDBTableLogicalID = 'DynamoDBTableLogicalID';
    ResourceFactory.DynamoDBAccessIAMRoleLogicalID = 'DynamoDBAccessIAMRoleLogicalID';
    ResourceFactory.APIKeyLogicalID = 'APIKeyLogicalID';
    // DataSource
    ResourceFactory.DynamoDBDataSourceLogicalID = 'DynamoDBDataSourceLogicalID';
    ResourceFactory.ParameterIds = {
        AppSyncApiName: 'AppSyncApiName',
        DynamoDBTableName: 'DynamoDBTableName',
        ReadIOPS: 'ReadIOPS',
        WriteIOPS: 'WriteIOPS',
        DynamoDBAccessIAMRole: 'DynamoDBAccessIAMRole',
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map