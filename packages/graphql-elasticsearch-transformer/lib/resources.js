"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the IAM role assumed by AppSync for Elasticsearch.',
                Default: 'AppSyncElasticSearchAccess'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket] = new cloudform_1.StringParameter({
                Description: 'S3 bucket containing the DynamoDB streaming lambda code.'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key] = new cloudform_1.StringParameter({
                Description: 'S3 key containing the DynamoDB streaming lambda code.'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version] = new cloudform_1.StringParameter({
                Description: 'S3 version of the DynamoDB streaming lambda code version.'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaHandlerName] = new cloudform_1.StringParameter({
                Description: 'The name of the lambda handler.',
                Default: 'DynamoDBToElasticsearchStream'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaRuntime] = new cloudform_1.StringParameter({
                Description: 'The lambda runtime (https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime)',
                Default: 'python3.6'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName] = new cloudform_1.StringParameter({
                Description: 'The name of the streaming lambda function.',
                Default: 'DynamoDBToElasticSearchFunction'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the streaming lambda function IAM role.',
                Default: 'DynamoDBToElasticSearchFunctionIAMRole'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda] = new cloudform_1.NumberParameter({
                Description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
                Default: 1,
                AllowedValues: [0, 1]
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceCount] = new cloudform_1.NumberParameter({
                Description: 'The number of instances to launch into the ElasticSearch domain.',
                Default: 1
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName] = new cloudform_1.StringParameter({
                Description: 'The name of the ElasticSearch domain.',
                Default: 'appsync-elasticsearch-domain',
                AllowedPattern: '^[a-z][a-z0-9-]*$',
                MinLength: 1,
                MaxLength: 28
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceType] = new cloudform_1.StringParameter({
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
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB] = new cloudform_1.NumberParameter({
                Description: 'The size in GB of the EBS volumes that contain our data.',
                Default: 20
            }),
            _a;
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        var _a;
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID] = this.makeElasticsearchAccessIAMRole(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID] = this.makeElasticSearchDataSource(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID] = this.makeElasticSearchDomain(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID] = this.makeStreamingLambdaIAMRole(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID] = this.makeDynamoDBStreamingFunction(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaEventSourceMappingLogicalID] = this.makeDynamoDBStreamEventSourceMapping(),
                _a)
        };
    };
    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the elasticsearch domain.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the domain if it is different than the name of the data source.
     */
    ResourceFactory.prototype.makeElasticSearchDataSource = function () {
        var logicalName = graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID;
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(logicalName, 'DomainArn'))),
                Endpoint: cloudform_1.Fn.Join('', [
                    'https://',
                    cloudform_1.Fn.GetAtt(logicalName, 'DomainEndpoint')
                ])
            }
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID);
    };
    /**
     * Deploy a lambda function that will stream data from our DynamoDB table
     * to our elasticsearch index.
     */
    ResourceFactory.prototype.makeDynamoDBStreamingFunction = function () {
        return new cloudform_1.Lambda.Function({
            Code: {
                S3Bucket: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket),
                S3Key: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key),
                S3ObjectVersion: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version)
            },
            FunctionName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName),
            Handler: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaHandlerName),
            Role: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Runtime: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaRuntime),
            Environment: {
                Variables: {
                    ES_ENDPOINT: cloudform_1.Fn.Join('', [
                        'https://',
                        cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainEndpoint')
                    ]),
                    ES_REGION: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainArn'))),
                    DEBUG: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda)
                }
            }
        })
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID)
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID);
    };
    ResourceFactory.prototype.makeDynamoDBStreamEventSourceMapping = function () {
        return new cloudform_1.Lambda.EventSourceMapping({
            BatchSize: 1,
            Enabled: true,
            EventSourceArn: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'StreamArn'),
            FunctionName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID, 'Arn'),
            StartingPosition: 'LATEST'
        })
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID)
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID);
    };
    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    ResourceFactory.prototype.makeElasticsearchAccessIAMRole = function () {
        return new iam_1.default.Role({
            RoleName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName),
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
                                Resource: cloudform_1.Fn.Join('', [
                                    "arn:aws:es:",
                                    cloudform_1.Refs.Region,
                                    ":",
                                    cloudform_1.Refs.AccountId,
                                    ":domain/",
                                    cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName),
                                    "/*"
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
            RoleName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName),
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
                                Resource: cloudform_1.Fn.Join('', [
                                    "arn:aws:es:",
                                    cloudform_1.Refs.Region,
                                    ":",
                                    cloudform_1.Refs.AccountId,
                                    ":domain/",
                                    cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName),
                                    "/*"
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
                                    cloudform_1.Fn.Join('/', [cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'), '*'])
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
        }).dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID);
    };
    /**
     * Create the elasticsearch domain.
     */
    ResourceFactory.prototype.makeElasticSearchDomain = function () {
        return new cloudform_1.Elasticsearch.Domain({
            DomainName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName),
            ElasticsearchVersion: '6.2',
            AccessPolicies: {
                Version: "2012-10-17",
                Statement: {
                    Effect: "Allow",
                    Action: [
                        "es:ESHttpDelete",
                        "es:ESHttpHead",
                        "es:ESHttpGet",
                        "es:ESHttpPost",
                        "es:ESHttpPut"
                    ],
                    Principal: {
                        AWS: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn')
                    },
                    Resource: [
                        cloudform_1.Fn.Join('', [
                            "arn:aws:es:",
                            cloudform_1.Refs.Region,
                            ":",
                            cloudform_1.Refs.AccountId,
                            ":domain/",
                            cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName),
                            "/*"
                        ])
                    ]
                }
            },
            ElasticsearchClusterConfig: {
                ZoneAwarenessEnabled: false,
                InstanceCount: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceCount),
                InstanceType: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceType)
            },
            EBSOptions: {
                EBSEnabled: true,
                VolumeType: 'gp2',
                VolumeSize: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB)
            }
        })
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID);
    };
    /**
     * Create the ElasticSearch search resolver.
     */
    ResourceFactory.prototype.makeSearchResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : graphql_transformer_common_1.graphqlName('search' + graphql_transformer_common_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: cloudform_1.Fn.Sub(graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.set(graphql_mapping_template_1.ref('indexPath'), graphql_mapping_template_1.str('/${ddbTableName}/doc/_search')),
                graphql_mapping_template_1.ElasticSearchMappingTemplate.searchItem({
                    path: graphql_mapping_template_1.str('$indexPath.toLowerCase()'),
                    size: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.size'), graphql_mapping_template_1.ref('context.args.size'), graphql_mapping_template_1.int(10)),
                    from: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.from'), graphql_mapping_template_1.ref('context.args.from'), graphql_mapping_template_1.int(0)),
                    query: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.query'), graphql_mapping_template_1.ref('util.transform.toElasticsearchQueryDSL($ctx.args.query)'), graphql_mapping_template_1.obj({
                        'match_all': graphql_mapping_template_1.obj({})
                    })),
                    sort: graphql_mapping_template_1.ifElse(graphql_mapping_template_1.ref('context.args.sort'), graphql_mapping_template_1.list([
                        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$util.isNullOrEmpty($context.args.sort.field) && !$util.isNullOrEmpty($context.args.sort.direction)'), graphql_mapping_template_1.obj({
                            "$context.args.sort.field": graphql_mapping_template_1.obj({
                                "order": graphql_mapping_template_1.str('$context.args.sort.direction')
                            })
                        })),
                        graphql_mapping_template_1.str('_doc')
                    ]), graphql_mapping_template_1.list([]))
                })
            ])), { 'ddbTableName': cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableName) }),
            ResponseMappingTemplate: graphql_mapping_template_1.print(graphql_mapping_template_1.compoundExpression([
                graphql_mapping_template_1.set(graphql_mapping_template_1.ref('items'), graphql_mapping_template_1.list([])),
                graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('entry'), graphql_mapping_template_1.ref('context.result.hits.hits'), [
                    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$foreach.hasNext'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('nextToken'), graphql_mapping_template_1.str('$entry.sort.get(0)'))),
                    graphql_mapping_template_1.qref('$items.add($entry.get("_source"))')
                ]),
                graphql_mapping_template_1.toJson(graphql_mapping_template_1.obj({
                    "items": graphql_mapping_template_1.ref('items'),
                    "total": graphql_mapping_template_1.ref('ctx.result.hits.total'),
                    "nextToken": graphql_mapping_template_1.ref('nextToken')
                }))
            ]))
        })
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
            .dependsOn(graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID);
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map