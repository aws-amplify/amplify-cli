"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var appSync_1 = require("cloudform/types/appSync");
var iam_1 = require("cloudform/types/iam");
var cloudform_1 = require("cloudform");
var appsync_mapping_template_1 = require("appsync-mapping-template");
var util_1 = require("./util");
var ResourceFactory = /** @class */ (function () {
    /**
     * The ResourceFactory creates AWS cloudformation resource specifications
     * for the appsync-elasticsearch-transformerer
     */
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        return _a = {},
            _a[ResourceFactory.ParameterIds.IAMRoleName] = new cloudform_1.StringParameter({
                Description: 'The name of the IAM role assumed by AppSync.',
                Default: 'AppSyncElasticSearchAccess'
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
                _a[ResourceFactory.IAMRoleLogicalID] = this.makeIAMRole(),
                _a[ResourceFactory.ElasticSearchDataSourceLogicalID] = this.makeElasticSearchDataSource(),
                _a[ResourceFactory.ElasticSearchDomainLogicalID] = this.makeElasticSearchDomain(),
                _a[ResourceFactory.StreamingLambdaIAMRoleLogicalID] = this.makeStreamingLambdaIAMRole(),
                _a[ResourceFactory.StreamingLambdaFunctionLogicalID] = this.makeDynamoDBStreamingFunction(),
                _a[ResourceFactory.StreamingLambdaEventSourceMappingLogicalID] = this.makeDynamoDBStreamEventSourceMapping(),
                _a)
        };
        var _a;
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
        });
    };
    /**
     * Create the ElasticSearch search resolver.
     */
    ResourceFactory.prototype.makeSearchResolver = function (type, fieldsToSearch) {
        var fieldName = util_1.graphqlName('search' + util_1.toUpper(type));
        return new appSync_1.default.Resolver({
            ApiId: cloudform_1.Fn.GetAtt(ResourceFactory.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: cloudform_1.Fn.GetAtt(ResourceFactory.ElasticSearchDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: cloudform_1.Fn.Sub(appsync_mapping_template_1.print(appsync_mapping_template_1.compoundExpression([
                appsync_mapping_template_1.set(appsync_mapping_template_1.ref('body'), appsync_mapping_template_1.obj({
                    size: appsync_mapping_template_1.ref('util.defaultIfNull($ctx.args.first, 20)'),
                    sort: appsync_mapping_template_1.list([
                        appsync_mapping_template_1.obj({ createdAt: appsync_mapping_template_1.str('asc') }),
                        appsync_mapping_template_1.obj({ _id: appsync_mapping_template_1.str('desc') })
                    ])
                })),
                appsync_mapping_template_1.ifElse(appsync_mapping_template_1.ref('util.isNull($ctx.args.query)'), appsync_mapping_template_1.set(appsync_mapping_template_1.ref('query'), appsync_mapping_template_1.obj({
                    bool: appsync_mapping_template_1.obj({
                        filter: appsync_mapping_template_1.obj({
                            term: appsync_mapping_template_1.obj({
                                '__typename.keyword': appsync_mapping_template_1.str(type)
                            })
                        }),
                        must: appsync_mapping_template_1.list([
                            appsync_mapping_template_1.obj({
                                match_all: appsync_mapping_template_1.obj({})
                            })
                        ])
                    })
                })), appsync_mapping_template_1.set(appsync_mapping_template_1.ref('query'), appsync_mapping_template_1.obj({
                    bool: appsync_mapping_template_1.obj({
                        filter: appsync_mapping_template_1.obj({
                            term: appsync_mapping_template_1.obj({
                                '__typename.keyword': appsync_mapping_template_1.str(type)
                            })
                        }),
                        must: appsync_mapping_template_1.list([
                            appsync_mapping_template_1.obj({
                                multi_match: appsync_mapping_template_1.obj({
                                    query: appsync_mapping_template_1.str('$ctx.args.query'),
                                    fields: appsync_mapping_template_1.list(fieldsToSearch.map(function (s) { return appsync_mapping_template_1.str(s); })),
                                    type: appsync_mapping_template_1.str('best_fields')
                                })
                            })
                        ])
                    })
                }))),
                appsync_mapping_template_1.qref('$body.put("query", $query)'),
                appsync_mapping_template_1.iff(appsync_mapping_template_1.raw('!$util.isNullOrEmpty($ctx.args.after)'), appsync_mapping_template_1.compoundExpression([
                    appsync_mapping_template_1.set(appsync_mapping_template_1.ref('split'), appsync_mapping_template_1.ref('ctx.args.after.split("/")')),
                    appsync_mapping_template_1.set(appsync_mapping_template_1.ref('afterToken'), appsync_mapping_template_1.list([appsync_mapping_template_1.ref('split.get(0)'), appsync_mapping_template_1.ref('split.get(1)')])),
                    appsync_mapping_template_1.qref('$body.put("search_after", $afterToken)')
                ])),
                appsync_mapping_template_1.set(appsync_mapping_template_1.ref('indexPath'), appsync_mapping_template_1.str('/${__ES_INDEX}/_search')),
                appsync_mapping_template_1.ElasticSearchMappingTemplate.search({
                    body: appsync_mapping_template_1.ref('util.toJson($body)'),
                    pathRef: 'indexPath'
                })
            ])), { '__ES_INDEX': cloudform_1.Fn.Ref(ResourceFactory.DynamoDBTableLogicalID) }),
            ResponseMappingTemplate: appsync_mapping_template_1.print(appsync_mapping_template_1.compoundExpression([
                appsync_mapping_template_1.set(appsync_mapping_template_1.ref('items'), appsync_mapping_template_1.list([])),
                appsync_mapping_template_1.forEach(appsync_mapping_template_1.ref('entry'), appsync_mapping_template_1.ref('context.result.hits.hits'), [
                    appsync_mapping_template_1.iff(appsync_mapping_template_1.raw('!$foreach.hasNext'), appsync_mapping_template_1.set(appsync_mapping_template_1.ref('nextToken'), appsync_mapping_template_1.str('$entry.sort.get(0)/$entry.sort.get(1)'))),
                    appsync_mapping_template_1.qref('$items.add($entry.get("_source"))')
                ]),
                appsync_mapping_template_1.toJson(appsync_mapping_template_1.obj({
                    "items": appsync_mapping_template_1.ref('items'),
                    "total": appsync_mapping_template_1.ref('ctx.result.hits.total'),
                    "nextToken": appsync_mapping_template_1.ref('nextToken')
                }))
            ]))
        }).dependsOn(ResourceFactory.GraphQLSchemaLogicalID);
    };
    // TODO: What is the best way to parameterize these dependencies.
    // The ElasticSearch transform depends on one or more tables to be created
    // by a previous transform. We use CF references to point to them but we may
    // need to pass the names of those tables to reference into this transform.
    // potentially via the transform context?
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
    ResourceFactory.ElasticSearchDataSourceLogicalID = 'ElasticSearchDataSourceLogicalID';
    ResourceFactory.ParameterIds = {
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