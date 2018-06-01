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
     * for the simple-appsync-transform
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
            _a[ResourceFactory.ParameterIds.IAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the IAM role assumed by AppSync.',
                Default: 'AppSyncSimpleTransformRole'
            }),
            _a[ResourceFactory.ParameterIds.StreamingIAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the streaming lambda function.',
                Default: 'DynamoDBToElasticSearch'
            }),
            _a[ResourceFactory.ParameterIds.DebugStreamingLambda] = new cloudform_1.NumberParameter({
                Description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
                Default: 1,
                AllowedValues: [0, 1]
            }),
            _a[ResourceFactory.ParameterIds.ElasticSearchInstanceCount] = new cloudform_1.NumberParameter({
                Description: 'The number of instances to launch into the ElasticSearch domain.',
                Default: 1
            }),
            _a[ResourceFactory.ParameterIds.ElasticSearchDomainName] = new cloudform_1.StringParameter({
                Description: 'The name of the ElasticSearch domain.',
                Default: 'appsync-elasticsearch-domain',
                AllowedPattern: '^[a-z][a-z0-9-]*$',
                MinLength: 1,
                MaxLength: 28
            }),
            _a[ResourceFactory.ParameterIds.ElasticSearchInstanceType] = new cloudform_1.StringParameter({
                Description: 'The type of instance to launch into the ElasticSearch domain.',
                Default: 't2.small.elasticsearch',
                AllowedValues: [
                    't2.small.elasticsearch', 't2.medium.elasticsearch', 'c4.large.elasticsearch',
                    'c4.xlarge.elasticsearch', 'c4.2xlarge.elasticsearch', 'c4.4xlarge.elasticsearch',
                    'c4.8xlarge.elasticsearch', 'm3.medium.elasticsearch', 'm3.large.elasticsearch',
                    'm3.xlarge.elasticsearch', 'm3.2xlarge.elasticsearch', 'm4.large.elasticsearch',
                    'm4.xlarge.elasticsearch', 'm4.2xlarge.elasticsearch', 'm4.4xlarge.elasticsearch',
                    'm4.10xlarge.elasticsearch', 'r3.large.elasticsearch', 'r3.xlarge.elasticsearch',
                    'r3.2xlarge.elasticsearch', 'r3.4xlarge.elasticsearch', 'r3.8xlarge.elasticsearch',
                    'r4.large.elasticsearch', 'r4.xlarge.elasticsearch', 'r4.2xlarge.elasticsearch',
                    'r4.4xlarge.elasticsearch', 'r4.8xlarge.elasticsearch', 'r4.16xlarge.elasticsearch',
                    'i2.xlarge.elasticsearch', 'i2.2xlarge.elasticsearch', 'i3.large.elasticsearch',
                    'i3.xlarge.elasticsearch', 'i3.2xlarge.elasticsearch', 'i3.4xlarge.elasticsearch',
                    'i3.8xlarge.elasticsearch', 'i3.16xlarge.elasticsearch'
                ]
            }),
            _a[ResourceFactory.ParameterIds.ElasticSearchEBSVolumeGB] = new cloudform_1.NumberParameter({
                Description: 'The size in GB of the EBS volumes that contain our data.',
                Default: 20
            }),
            _a[ResourceFactory.ParameterIds.StreamingLambdaCodeS3Bucket] = new cloudform_1.StringParameter({
                Description: 'S3 bucket containing the DynamoDB streaming lambda code.',
                Default: 'mp-lambda-blueprints'
            }),
            _a[ResourceFactory.ParameterIds.StreamingLambdaCodeS3Key] = new cloudform_1.StringParameter({
                Description: 'S3 key containing the DynamoDB streaming lambda code.',
                Default: 'streaming-lambda.zip'
            }),
            _a[ResourceFactory.ParameterIds.StreamingLambdaCodeS3Version] = new cloudform_1.StringParameter({
                Description: 'S3 key containing the DynamoDB lambda code version.',
                Default: 'Sc32fGDZq2SdHBc1Hek6I3_Lzzt4OazX'
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
                _a[ResourceFactory.IAMRoleLogicalID] = this.makeIAMRole(),
                _a[ResourceFactory.DynamoDBDataSourceLogicalID] = this.makeDynamoDBDataSource(),
                _a[ResourceFactory.APIKeyLogicalID] = this.makeAppSyncApiKey(),
                _a[ResourceFactory.ElasticSearchDomainLogicalID] = this.makeElasticSearchDomain(),
                _a[ResourceFactory.StreamingLambdaIAMRoleLogicalID] = this.makeStreamingLambdaIAMRole(),
                _a[ResourceFactory.StreamingLambdaFunctionLogicalID] = this.makeDynamoDBStreamingFunction(),
                _a[ResourceFactory.StreamingLambdaEventSourceMappingLogicalID] = this.makeDynamoDBStreamEventSourceMapping(),
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
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the elasticsearch domain.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the domain if it is different than the name of the data source.
     */
    ResourceFactory.prototype.makeElasticSearchDataSource = function () {
        var logicalName = ResourceFactory.ElasticSearchDomainLogicalID;
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(logicalName, 'Arn'))),
                Endpoint: cloudform_1.Fn.GetAtt(logicalName, 'DomainEndpoint')
            }
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
     * Deploy a lambda function that will stream data from our DynamoDB table
     * to our elasticsearch index.
     */
    ResourceFactory.prototype.makeDynamoDBStreamingFunction = function () {
        return new cloudform_1.Lambda.Function({
            Code: {
                S3Bucket: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.StreamingLambdaCodeS3Bucket),
                S3Key: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.StreamingLambdaCodeS3Key),
                S3ObjectVersion: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.StreamingLambdaCodeS3Version)
            },
            Handler: 'python_streaming_function.lambda_handler',
            Role: cloudform_1.Fn.GetAtt(ResourceFactory.StreamingLambdaIAMRoleLogicalID, 'Arn'),
            Runtime: 'python3.6',
            Environment: {
                Variables: {
                    ES_ENDPOINT: cloudform_1.Fn.GetAtt(ResourceFactory.ElasticSearchDomainLogicalID, 'DomainEndpoint'),
                    ES_REGION: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(ResourceFactory.ElasticSearchDomainLogicalID, 'DomainArn'))),
                    DEBUG: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.DebugStreamingLambda)
                }
            }
        });
    };
    ResourceFactory.prototype.makeDynamoDBStreamEventSourceMapping = function () {
        return new cloudform_1.Lambda.EventSourceMapping({
            BatchSize: 100,
            Enabled: true,
            EventSourceArn: cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'StreamArn'),
            FunctionName: cloudform_1.Fn.GetAtt(ResourceFactory.StreamingLambdaFunctionLogicalID, 'Arn'),
            StartingPosition: 'TRIM_HORIZON'
        });
    };
    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    ResourceFactory.prototype.makeIAMRole = function () {
        return new iam_1.default.Role({
            RoleName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.IAMRoleName),
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
                }),
                new iam_1.default.Role.Policy({
                    PolicyName: 'ElasticSearchAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Action: [
                                    "es:ESHttpPost",
                                    "es:ESHttpDelete",
                                    "es:ESHttpHead",
                                    "es:ESHttpGet",
                                    "es:ESHttpPost",
                                    "es:ESHttpPut"
                                ],
                                Effect: "Allow",
                                Resource: cloudform_1.Fn.Join('/', [
                                    cloudform_1.Fn.GetAtt(ResourceFactory.ElasticSearchDomainLogicalID, 'DomainArn'),
                                    '*'
                                ])
                            }
                        ]
                    }
                })
            ]
        });
    };
    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    ResourceFactory.prototype.makeStreamingLambdaIAMRole = function () {
        return new iam_1.default.Role({
            RoleName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.StreamingIAMRoleName),
            AssumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        },
                        Action: "sts:AssumeRole"
                    }
                ]
            },
            Policies: [
                new iam_1.default.Role.Policy({
                    PolicyName: 'ElasticSearchAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Action: [
                                    "es:ESHttpPost",
                                    "es:ESHttpDelete",
                                    "es:ESHttpHead",
                                    "es:ESHttpGet",
                                    "es:ESHttpPost",
                                    "es:ESHttpPut"
                                ],
                                Effect: "Allow",
                                Resource: cloudform_1.Fn.Join('/', [
                                    cloudform_1.Fn.GetAtt(ResourceFactory.ElasticSearchDomainLogicalID, 'DomainArn'),
                                    '*'
                                ])
                            }
                        ]
                    }
                }),
                new iam_1.default.Role.Policy({
                    PolicyName: 'DynamoDBStreamAccess',
                    PolicyDocument: {
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Action: [
                                    "dynamodb:DescribeStream",
                                    "dynamodb:GetRecords",
                                    "dynamodb:GetShardIterator",
                                    "dynamodb:ListStreams"
                                ],
                                Effect: "Allow",
                                Resource: [
                                    cloudform_1.Fn.Join('/', [cloudform_1.Fn.GetAtt(ResourceFactory.DynamoDBTableLogicalID, 'Arn'), 'stream', '*'])
                                ]
                            }
                        ]
                    }
                }),
                new iam_1.default.Role.Policy({
                    PolicyName: 'CloudWatchLogsAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: "Allow",
                                Action: [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                Resource: "arn:aws:logs:*:*:*"
                            }
                        ]
                    }
                })
            ]
        });
    };
    /**
     * Create the elasticsearch domain.
     */
    ResourceFactory.prototype.makeElasticSearchDomain = function () {
        return new cloudform_1.Elasticsearch.Domain({
            DomainName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.ElasticSearchDomainName),
            ElasticsearchVersion: '6.2',
            ElasticsearchClusterConfig: {
                InstanceCount: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.ElasticSearchInstanceCount),
                InstanceType: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.ElasticSearchInstanceType)
            },
            EBSOptions: {
                EBSEnabled: true,
                VolumeType: 'gp2',
                VolumeSize: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.ElasticSearchEBSVolumeGB)
            }
            // AccessPolicies: {
            //     Version: '2012-10-17',
            //     Statement: [
            //         {
            //             Effect: 'Allow',
            //             Action: ["es:*"],
            //             Principal: {
            //                 AWS: [
            //                     Fn.Join(
            //                         '', [
            //                             'arn:aws:iam:',
            //                             Refs.AccountId,
            //                             ':role/',
            //                             Fn.Ref(ResourceFactory.ParameterIds.StreamingIAMRoleName)
            //                         ]
            //                     ),
            //                     Fn.Sub('arn:aws:iam::${AWS::AccountId}:role/${rolename}', { rolename: Fn.Ref(ResourceFactory.ParameterIds.IAMRoleName) })
            //                 ]
            //             },
            //             Resource: Fn.Join(
            //                 '',
            //                 [
            //                     'arn:aws:es:',
            //                     Refs.Region,
            //                     ':',
            //                     Refs.AccountId,
            //                     ':domain/',
            //                     Fn.Ref(ResourceFactory.ParameterIds.ElasticSearchDomainName),
            //                     '/*'
            //                 ]
            //             )
            //         }
            //     ]
            // }
            // 
            // TODO: Snapshotting
        });
    };
    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the function.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the function if it is different than the name of the data source.
     */
    ResourceFactory.prototype.makeLambdaDataSource = function (name, logicalId) {
        var logicalName = logicalId ? logicalId : name;
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            Name: name,
            Type: 'AWS_LAMBDA',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
            LambdaConfig: {
                LambdaFunctionArn: cloudform_1.Fn.Ref(logicalName)
            }
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
            ServiceRoleArn: cloudform_1.Fn.GetAtt(ResourceFactory.IAMRoleLogicalID, 'Arn'),
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
        });
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
        });
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
        });
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
        });
    };
    // Resources
    ResourceFactory.GraphQLAPILogicalID = 'GraphQLAPILogicalID';
    ResourceFactory.GraphQLSchemaLogicalID = 'GraphQLSchemaLogicalID';
    ResourceFactory.DynamoDBTableLogicalID = 'DynamoDBTableLogicalID';
    ResourceFactory.IAMRoleLogicalID = 'IAMRoleLogicalID';
    ResourceFactory.APIKeyLogicalID = 'APIKeyLogicalID';
    ResourceFactory.ElasticSearchDomainLogicalID = 'ElasticSearchDomainLogicalID';
    ResourceFactory.StreamingLambdaIAMRoleLogicalID = 'StreamingLambdaIAMRoleLogicalID';
    ResourceFactory.StreamingLambdaFunctionLogicalID = 'StreamingLambdaFunctionLogicalID';
    ResourceFactory.StreamingLambdaEventSourceMappingLogicalID = 'StreamingLambdaEventSourceMappingLogicalID';
    // DataSource
    ResourceFactory.DynamoDBDataSourceLogicalID = 'DynamoDBDataSourceLogicalID';
    ResourceFactory.ElasticSearchDataSourceLogicalID = 'ElasticSearchDataSourceLogicalID';
    ResourceFactory.ParameterIds = {
        AppSyncApiName: 'AppSyncApiName',
        DynamoDBTableName: 'DynamoDBTableName',
        ReadIOPS: 'ReadIOPS',
        WriteIOPS: 'WriteIOPS',
        ElasticSearchDomainName: 'ElasticSearchDomainName',
        IAMRoleName: 'IAMRoleName',
        DebugStreamingLambda: 'DebugStreamingLambda',
        StreamingIAMRoleName: 'StreamingIAMRoleName',
        ElasticSearchInstanceCount: 'ElasticSearchInstanceCount',
        ElasticSearchInstanceType: 'ElasticSearchInstanceType',
        ElasticSearchEBSVolumeGB: 'ElasticSearchEBSVolumeGB',
        StreamingLambdaCodeS3Bucket: 'StreamingLambdaCodeS3Bucket',
        StreamingLambdaCodeS3Key: 'StreamingLambdaCodeS3Key',
        StreamingLambdaCodeS3Version: 'StreamingLambdaCodeS3Version'
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map