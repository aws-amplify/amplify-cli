"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dynamoDb_1 = require("cloudform/types/dynamoDb");
var appSync_1 = require("cloudform/types/appSync");
var iam_1 = require("cloudform/types/iam");
var cloudform_1 = require("cloudform");
var graphql_mapping_template_1 = require("graphql-mapping-template");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var ResourceFactory = /** @class */ (function () {
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        var _a;
        return _a = {},
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiName] = new cloudform_1.StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS] = new cloudform_1.NumberParameter({
                Description: 'The number of read IOPS the table should support.',
                Default: 5
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS] = new cloudform_1.NumberParameter({
                Description: 'The number of write IOPS the table should support.',
                Default: 5
            }),
            _a;
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        var _a, _b;
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID] = this.makeAppSyncAPI(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.APIKeyLogicalID] = this.makeAppSyncApiKey(),
                _a),
            Outputs: (_b = {},
                _b[graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput] = this.makeAPIEndpointOutput(),
                _b[graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput] = this.makeApiKeyOutput(),
                _b)
        };
    };
    /**
     * Create the AppSync API.
     */
    ResourceFactory.prototype.makeAppSyncAPI = function () {
        return new appSync_1.default.GraphQLApi({
            Name: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiName),
            AuthenticationType: 'API_KEY'
        });
    };
    ResourceFactory.prototype.makeAppSyncSchema = function (schema) {
        return new appSync_1.default.GraphQLSchema({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Definition: schema
        });
    };
    ResourceFactory.prototype.makeAppSyncApiKey = function () {
        return new appSync_1.default.ApiKey({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
        });
    };
    /**
     * Outputs
     */
    ResourceFactory.prototype.makeAPIEndpointOutput = function () {
        return {
            Description: "Your GraphQL API endpoint.",
            Value: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'GraphQLUrl'),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "GraphQLApiEndpoint"])
            }
        };
    };
    ResourceFactory.prototype.makeApiKeyOutput = function () {
        return {
            Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
            Value: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.APIKeyLogicalID, 'ApiKey'),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "GraphQLApiKey"])
            }
        };
    };
    /**
     * Create a DynamoDB table for a specific type.
     */
    ResourceFactory.prototype.makeModelTable = function (typeName, hashKey, rangeKey) {
        if (hashKey === void 0) { hashKey = 'id'; }
        var keySchema = hashKey && rangeKey ? [
            {
                AttributeName: hashKey,
                KeyType: 'HASH'
            }, {
                AttributeName: rangeKey,
                KeyType: 'RANGE'
            }
        ] : [{ AttributeName: hashKey, KeyType: 'HASH' }];
        var attributeDefinitions = hashKey && rangeKey ? [
            {
                AttributeName: hashKey,
                AttributeType: 'S'
            }, {
                AttributeName: rangeKey,
                AttributeType: 'S'
            }
        ] : [{ AttributeName: hashKey, AttributeType: 'S' }];
        return new dynamoDb_1.default.Table({
            TableName: cloudform_1.Fn.Join('-', [cloudform_1.Refs.StackName, typeName]),
            KeySchema: keySchema,
            AttributeDefinitions: attributeDefinitions,
            ProvisionedThroughput: {
                ReadCapacityUnits: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
                WriteCapacityUnits: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS)
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
    ResourceFactory.prototype.makeIAMRole = function (tableId) {
        return new iam_1.default.Role({
            RoleName: cloudform_1.Fn.Join('-', [cloudform_1.Refs.StackName, tableId, 'role']),
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
                                    cloudform_1.Fn.GetAtt(tableId, 'Arn'),
                                    cloudform_1.Fn.Join('/', [cloudform_1.Fn.GetAtt(tableId, 'Arn'), '*'])
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
    ResourceFactory.prototype.makeDynamoDBDataSource = function (tableId, iamRoleLogicalID) {
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: tableId,
            Type: 'AMAZON_DYNAMODB',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(iamRoleLogicalID, 'Arn'),
            DynamoDBConfig: {
                AwsRegion: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(tableId, 'Arn'))),
                TableName: cloudform_1.Fn.Ref(tableId)
            }
        });
    };
    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeCreateResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName('create' + graphql_transformer_common_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: graphql_mapping_template_1.printBlock('Prepare DynamoDB PutItem Request')(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$input'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('input'), graphql_mapping_template_1.ref('util.map.copyAndRemoveAllKeys($context.args.input, [])'))),
                graphql_mapping_template_1.qref('$input.put("createdAt", $util.time.nowISO8601())'),
                graphql_mapping_template_1.qref('$input.put("updatedAt", $util.time.nowISO8601())'),
                graphql_mapping_template_1.qref("$input.put(\"__typename\", \"" + type + "\")"),
                graphql_mapping_template_1.DynamoDBMappingTemplate.putItem({
                    key: graphql_mapping_template_1.obj({
                        id: graphql_mapping_template_1.obj({ S: graphql_mapping_template_1.str("$util.autoId()") })
                    }),
                    attributeValues: graphql_mapping_template_1.ref('util.dynamodb.toMapValuesJson($input)'),
                    condition: graphql_mapping_template_1.obj({
                        expression: graphql_mapping_template_1.str("attribute_not_exists(#id)"),
                        expressionNames: graphql_mapping_template_1.obj({
                            "#id": graphql_mapping_template_1.str('id')
                        })
                    })
                }),
            ])),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    ResourceFactory.prototype.makeUpdateResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName("update" + graphql_transformer_common_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.compoundExpression([
                    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('condition'), graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition)),
                    graphql_mapping_template_1.qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                    graphql_mapping_template_1.qref('$condition.expressionNames.put("#id", "id")')
                ]), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('condition'), graphql_mapping_template_1.obj({
                    expression: graphql_mapping_template_1.str("attribute_exists(#id)"),
                    expressionNames: graphql_mapping_template_1.obj({
                        "#id": graphql_mapping_template_1.str("id")
                    })
                }))),
                graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$input'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('input'), graphql_mapping_template_1.ref('util.map.copyAndRemoveAllKeys($context.args.input, [])'))),
                graphql_mapping_template_1.comment('Automatically set the updatedAt timestamp.'),
                graphql_mapping_template_1.qref('$input.put("updatedAt", $util.time.nowISO8601())'),
                graphql_mapping_template_1.qref("$input.put(\"__typename\", \"" + type + "\")"),
                graphql_mapping_template_1.DynamoDBMappingTemplate.updateItem({
                    key: graphql_mapping_template_1.obj({
                        id: graphql_mapping_template_1.obj({ S: graphql_mapping_template_1.str('$context.args.input.id') })
                    }),
                    condition: graphql_mapping_template_1.ref('util.toJson($condition)')
                })
            ])),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeGetResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName('get' + graphql_transformer_common_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.DynamoDBMappingTemplate.getItem({
                key: graphql_mapping_template_1.obj({
                    id: graphql_mapping_template_1.ref('util.dynamodb.toDynamoDBJson($ctx.args.id)')
                })
            })),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that queries an item in DynamoDB.
     * @param type
     */
    ResourceFactory.prototype.makeQueryResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName("query" + graphql_transformer_common_1.toUpper(type));
        var defaultPageLimit = 10;
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.set(graphql_mapping_template_1.ref('limit'), graphql_mapping_template_1.ref("util.defaultIfNull($context.args.limit, " + defaultPageLimit + ")")),
                graphql_mapping_template_1.DynamoDBMappingTemplate.query({
                    query: graphql_mapping_template_1.obj({
                        'expression': graphql_mapping_template_1.str('#typename = :typename'),
                        'expressionNames': graphql_mapping_template_1.obj({
                            '#typename': graphql_mapping_template_1.str('__typename')
                        }),
                        'expressionValues': graphql_mapping_template_1.obj({
                            ':typename': graphql_mapping_template_1.obj({
                                'S': graphql_mapping_template_1.str(type)
                            })
                        })
                    }),
                    scanIndexForward: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.sortDirection'), graphql_mapping_template_1.ifElse(graphql_mapping_template_1.equals(graphql_mapping_template_1.ref('context.args.sortDirection'), graphql_mapping_template_1.str('ASC')), graphql_mapping_template_1.bool(true), graphql_mapping_template_1.bool(false)), graphql_mapping_template_1.bool(true)),
                    filter: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.filter'), graphql_mapping_template_1.ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), graphql_mapping_template_1.nul()),
                    limit: graphql_mapping_template_1.ref('limit'),
                    nextToken: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.nextToken'), graphql_mapping_template_1.str('$context.args.nextToken'), graphql_mapping_template_1.nul())
                })
            ])),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$result'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('result'), graphql_mapping_template_1.ref('ctx.result'))),
                graphql_mapping_template_1.raw('$util.toJson($result)')
            ]))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that lists items in DynamoDB.
     * TODO: actually fill out the right filter expression. This is a placeholder only.
     * @param type
     */
    ResourceFactory.prototype.makeListResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName('list' + graphql_transformer_common_1.toUpper(type));
        var defaultPageLimit = 10;
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.set(graphql_mapping_template_1.ref('limit'), graphql_mapping_template_1.ref("util.defaultIfNull($context.args.limit, " + defaultPageLimit + ")")),
                graphql_mapping_template_1.DynamoDBMappingTemplate.listItem({
                    filter: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.filter'), graphql_mapping_template_1.ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), graphql_mapping_template_1.nul()),
                    limit: graphql_mapping_template_1.ref('limit'),
                    nextToken: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.nextToken'), graphql_mapping_template_1.str('$context.args.nextToken'), graphql_mapping_template_1.nul())
                })
            ])),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.raw('$util.toJson($ctx.result)'))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    /**
     * Create a resolver that deletes an item from DynamoDB.
     * @param type The name of the type to delete an item of.
     * @param nameOverride A user provided override for the field name.
     */
    ResourceFactory.prototype.makeDeleteResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName('delete' + graphql_transformer_common_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
            FieldName: fieldName,
            TypeName: 'Mutation',
            RequestMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.compoundExpression([
                    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('condition'), graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition)),
                    graphql_mapping_template_1.qref('$condition.put("expression", "$condition.expression AND attribute_exists(#id)")'),
                    graphql_mapping_template_1.qref('$condition.expressionNames.put("#id", "id")')
                ]), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('condition'), graphql_mapping_template_1.obj({
                    expression: graphql_mapping_template_1.str("attribute_exists(#id)"),
                    expressionNames: graphql_mapping_template_1.obj({
                        "#id": graphql_mapping_template_1.str("id")
                    })
                }))),
                graphql_mapping_template_1.DynamoDBMappingTemplate.deleteItem({
                    key: graphql_mapping_template_1.obj({
                        id: graphql_mapping_template_1.ref('util.dynamodb.toDynamoDBJson($ctx.args.input.id)')
                    }),
                    condition: graphql_mapping_template_1.ref('util.toJson($condition)')
                })
            ])),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.ref('util.toJson($context.result)'))
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map