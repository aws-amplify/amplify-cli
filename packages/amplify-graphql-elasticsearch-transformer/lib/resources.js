"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var appSync_1 = require("cloudform/types/appSync");
var iam_1 = require("cloudform/types/iam");
var cloudform_1 = require("cloudform");
var amplify_graphql_mapping_template_1 = require("amplify-graphql-mapping-template");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var ResourceFactory = /** @class */ (function () {
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        var _a;
        return _a = {},
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the IAM role assumed by AppSync for Elasticsearch.',
                Default: 'AppSyncElasticSearchAccess'
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName] = new cloudform_1.StringParameter({
                Description: 'The name of the streaming lambda function.',
                Default: 'DynamoDBToElasticSearchFunction'
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the streaming lambda function IAM role.',
                Default: 'DynamoDBToElasticSearchFunctionIAMRole'
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda] = new cloudform_1.NumberParameter({
                Description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
                Default: 1,
                AllowedValues: [0, 1]
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceCount] = new cloudform_1.NumberParameter({
                Description: 'The number of instances to launch into the ElasticSearch domain.',
                Default: 1
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName] = new cloudform_1.StringParameter({
                Description: 'The name of the ElasticSearch domain.',
                Default: 'appsync-elasticsearch-domain',
                AllowedPattern: '^[a-z][a-z0-9-]*$',
                MinLength: 1,
                MaxLength: 28
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceType] = new cloudform_1.StringParameter({
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
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB] = new cloudform_1.NumberParameter({
                Description: 'The size in GB of the EBS volumes that contain our data.',
                Default: 20
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket] = new cloudform_1.StringParameter({
                Description: 'S3 bucket containing the DynamoDB streaming lambda code.',
                Default: 'sr-lambda-blueprints'
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key] = new cloudform_1.StringParameter({
                Description: 'S3 key containing the DynamoDB streaming lambda code.',
                Default: 'streaming-lambda.zip'
            }),
            _a[amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version] = new cloudform_1.StringParameter({
                Description: 'S3 key containing the DynamoDB lambda code version.',
                Default: 'n9NaP2A0v3G3BzPXDkrs3rbrkLq2O4qJ'
            }),
            _a;
    };
    /**
     * Outputs
     */
    ResourceFactory.prototype.makeLambdaIAMRoleOutput = function () {
        return {
            Description: "Your lambda function Arn that will stream data from the DynamoDB table to the Elasticsearch Index",
            Value: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "ElasticSearchStreamingLambdaIAMRoleArn"])
            }
        };
    };
    ResourceFactory.prototype.makeElasticsearchIAMRoleOutput = function () {
        return {
            Description: "The IAM Role used to execute queries against the ElasticSearch index.",
            Value: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn'),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "ElasticSearchAccessIAMRoleArn"])
            }
        };
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        var _a, _b;
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID] = this.makeIAMRole(),
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID] = this.makeElasticSearchDataSource(),
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID] = this.makeElasticSearchDomain(),
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID] = this.makeStreamingLambdaIAMRole(),
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID] = this.makeDynamoDBStreamingFunction(),
                _a[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaEventSourceMappingLogicalID] = this.makeDynamoDBStreamEventSourceMapping(),
                _a),
            Outputs: (_b = {},
                _b[amplify_graphql_transformer_common_1.ResourceConstants.OUTPUTS.ElasticSearchStreamingLambdaIAMRoleArn] = this.makeLambdaIAMRoleOutput(),
                _b[amplify_graphql_transformer_common_1.ResourceConstants.OUTPUTS.ElasticSearchAccessIAMRoleArn] = this.makeElasticsearchIAMRoleOutput(),
                _b)
        };
    };
    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the elasticsearch domain.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the domain if it is different than the name of the data source.
     */
    ResourceFactory.prototype.makeElasticSearchDataSource = function () {
        var logicalName = amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID;
        return new appSync_1.default.DataSource({
            ApiId: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(logicalName, 'DomainArn'))),
                Endpoint: cloudform_1.Fn.Join('', [
                    'https://',
                    cloudform_1.Fn.GetAtt(logicalName, 'DomainEndpoint')
                ])
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
                S3Bucket: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket),
                S3Key: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key),
                S3ObjectVersion: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version)
            },
            FunctionName: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName),
            Handler: 'python_streaming_function.lambda_handler',
            Role: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Runtime: 'python3.6',
            Environment: {
                Variables: {
                    ES_ENDPOINT: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainEndpoint'),
                    ES_REGION: cloudform_1.Fn.Select(3, cloudform_1.Fn.Split(':', cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainArn'))),
                    DEBUG: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda)
                }
            }
        });
    };
    ResourceFactory.prototype.makeDynamoDBStreamEventSourceMapping = function () {
        return new cloudform_1.Lambda.EventSourceMapping({
            BatchSize: 100,
            Enabled: true,
            EventSourceArn: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'StreamArn'),
            FunctionName: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID, 'Arn'),
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
            RoleName: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName),
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
                                Resource: cloudform_1.Fn.Join('/', [
                                    cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainArn'),
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
            RoleName: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName),
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
                                    cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainArn'),
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
                                    cloudform_1.Fn.Join('/', [cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'), 'stream', '*'])
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
            DomainName: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchDomainName),
            ElasticsearchVersion: '6.2',
            ElasticsearchClusterConfig: {
                InstanceCount: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceCount),
                InstanceType: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchInstanceType)
            },
            EBSOptions: {
                EBSEnabled: true,
                VolumeType: 'gp2',
                VolumeSize: cloudform_1.Fn.Ref(amplify_graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB)
            }
        });
    };
    /**
     * Create the ElasticSearch search resolver.
     */
    ResourceFactory.prototype.makeSearchResolver = function (type, nameOverride) {
        var fieldName = nameOverride ? nameOverride : amplify_graphql_transformer_common_1.graphqlName('search' + amplify_graphql_transformer_common_1.toUpper(type));
        var ddbTableName = amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID;
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: amplify_graphql_mapping_template_1.print(amplify_graphql_mapping_template_1.compoundExpression([
                amplify_graphql_mapping_template_1.set(amplify_graphql_mapping_template_1.ref('indexPath'), amplify_graphql_mapping_template_1.str("/" + ddbTableName + "/_search")),
                amplify_graphql_mapping_template_1.ElasticSearchMappingTemplate.searchItem({
                    path: amplify_graphql_mapping_template_1.ref('indexPath'),
                    size: amplify_graphql_mapping_template_1.ref('context.args.size'),
                    from: amplify_graphql_mapping_template_1.ref('context.args.from'),
                    query: amplify_graphql_mapping_template_1.ref('util.transform.toElasticsearchQueryDSL($ctx.args.query)'),
                    sort: amplify_graphql_mapping_template_1.list([
                        amplify_graphql_mapping_template_1.iff(amplify_graphql_mapping_template_1.raw('!$util.isNullOrEmpty($context.args.sort.field) && !$util.isNullOrEmpty($context.args.sort.direction)'), amplify_graphql_mapping_template_1.obj({
                            "$context.args.sort.field": amplify_graphql_mapping_template_1.obj({
                                "order": amplify_graphql_mapping_template_1.str('$context.args.sort.direction')
                            })
                        })),
                        amplify_graphql_mapping_template_1.str('_doc')
                    ])
                })
            ])),
            ResponseMappingTemplate: amplify_graphql_mapping_template_1.print(amplify_graphql_mapping_template_1.compoundExpression([
                amplify_graphql_mapping_template_1.set(amplify_graphql_mapping_template_1.ref('items'), amplify_graphql_mapping_template_1.list([])),
                amplify_graphql_mapping_template_1.forEach(amplify_graphql_mapping_template_1.ref('entry'), amplify_graphql_mapping_template_1.ref('context.result.hits.hits'), [
                    amplify_graphql_mapping_template_1.iff(amplify_graphql_mapping_template_1.raw('!$foreach.hasNext'), amplify_graphql_mapping_template_1.set(amplify_graphql_mapping_template_1.ref('nextToken'), amplify_graphql_mapping_template_1.str('$entry.sort.get(0)/$entry.sort.get(1)'))),
                    amplify_graphql_mapping_template_1.qref('$items.add($entry.get("_source"))')
                ]),
                amplify_graphql_mapping_template_1.toJson(amplify_graphql_mapping_template_1.obj({
                    "items": amplify_graphql_mapping_template_1.ref('items'),
                    "total": amplify_graphql_mapping_template_1.ref('ctx.result.hits.total'),
                    "nextToken": amplify_graphql_mapping_template_1.ref('nextToken')
                }))
            ]))
        }).dependsOn(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map