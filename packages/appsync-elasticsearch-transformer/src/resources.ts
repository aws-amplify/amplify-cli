import AppSync from 'cloudform/types/appSync'
import IAM from 'cloudform/types/iam'
import Template from 'cloudform/types/template'
import Output from 'cloudform/types/output'
import { Fn, StringParameter, NumberParameter, Lambda, Elasticsearch, Refs } from 'cloudform'
import {
    ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw,
    forEach, compoundExpression, qref, toJson
} from 'appsync-mapping-template'
import { toUpper, graphqlName, ResourceConstants } from 'appsync-transformer-common'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName]: new StringParameter({
                Description: 'The name of the IAM role assumed by AppSync.',
                Default: 'AppSyncElasticSearchAccess'
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName]: new StringParameter({
                Description: 'The name of the streaming lambda function.',
                Default: 'DynamoDBToElasticSearchFunction'
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName]: new StringParameter({
                Description: 'The name of the streaming lambda function IAM role.',
                Default: 'DynamoDBToElasticSearchFunctionIAMRole'
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda]: new NumberParameter({
                Description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
                Default: 1,
                AllowedValues: [0, 1]
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchInstanceCount]: new NumberParameter({
                Description: 'The number of instances to launch into the ElasticSearch domain.',
                Default: 1
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchDomainName]: new StringParameter({
                Description: 'The name of the ElasticSearch domain.',
                Default: 'appsync-elasticsearch-domain',
                AllowedPattern: '^[a-z][a-z0-9-]*$',
                MinLength: 1,
                MaxLength: 28
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchInstanceType]: new StringParameter({
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
            [ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB]: new NumberParameter({
                Description: 'The size in GB of the EBS volumes that contain our data.',
                Default: 20
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket]: new StringParameter({
                Description: 'S3 bucket containing the DynamoDB streaming lambda code.',
                Default: 'sr-lambda-blueprints'
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key]: new StringParameter({
                Description: 'S3 key containing the DynamoDB streaming lambda code.',
                Default: 'streaming-lambda.zip'
            }),
            [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version]: new StringParameter({
                Description: 'S3 key containing the DynamoDB lambda code version.',
                Default: 'n9NaP2A0v3G3BzPXDkrs3rbrkLq2O4qJ'
            })
        }
    }

    /**
     * Outputs
     */
    public makeLambdaIAMRoleOutput(): Output {
        return {
            Description: "Your lambda function Arn that will stream data from the DynamoDB table to the Elasticsearch Index",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "ElasticSearchStreamingLambdaIAMRoleArn"])
            }
        }
    }

    public makeElasticsearchIAMRoleOutput(): Output {
        return {
            Description: "The IAM Role used to execute queries against the ElasticSearch index.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "ElasticSearchAccessIAMRoleArn"])
            }
        }
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {
                [ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID]: this.makeIAMRole(),
                [ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID]: this.makeElasticSearchDataSource(),
                [ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID]: this.makeElasticSearchDomain(),
                [ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID]: this.makeStreamingLambdaIAMRole(),
                [ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID]: this.makeDynamoDBStreamingFunction(),
                [ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaEventSourceMappingLogicalID]: this.makeDynamoDBStreamEventSourceMapping()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.ElasticSearchStreamingLambdaIAMRoleArn]: this.makeLambdaIAMRoleOutput(),
                [ResourceConstants.OUTPUTS.ElasticSearchAccessIAMRoleArn]: this.makeElasticsearchIAMRoleOutput()
            }
        }
    }

    /**
     * Given the name of a data source and optional logical id return a CF
     * spec for a data source pointing to the elasticsearch domain.
     * @param name The name for the data source. If a logicalId is not provided the name is used.
     * @param logicalId The logicalId of the domain if it is different than the name of the data source.
     */
    public makeElasticSearchDataSource() {
        const logicalName = ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchAccessIAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: Fn.Select(3, Fn.Split(':', Fn.GetAtt(logicalName, 'DomainArn'))),
                Endpoint:
                    Fn.Join('', [
                        'https://',
                        Fn.GetAtt(logicalName, 'DomainEndpoint')
                    ])
            }
        })
    }

    /**
     * Deploy a lambda function that will stream data from our DynamoDB table
     * to our elasticsearch index.
     */
    public makeDynamoDBStreamingFunction() {
        return new Lambda.Function({
            Code: {
                S3Bucket: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket),
                S3Key: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key),
                S3ObjectVersion: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version)
            },
            FunctionName: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchStreamingFunctionName),
            Handler: 'python_streaming_function.lambda_handler',
            Role: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Runtime: 'python3.6',
            Environment: {
                Variables: {
                    ES_ENDPOINT: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainEndpoint'),
                    ES_REGION: Fn.Select(3, Fn.Split(':', Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID, 'DomainArn'))),
                    DEBUG: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchDebugStreamingLambda)
                }
            }
        })
    }

    public makeDynamoDBStreamEventSourceMapping() {
        return new Lambda.EventSourceMapping({
            BatchSize: 100,
            Enabled: true,
            EventSourceArn: Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'StreamArn'),
            FunctionName: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchStreamingLambdaFunctionLogicalID, 'Arn'),
            StartingPosition: 'TRIM_HORIZON'
        })
    }

    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    public makeIAMRole() {
        return new IAM.Role({
            RoleName: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName),
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
                                Resource: Fn.Join(
                                    '/',
                                    [
                                        Fn.GetAtt(
                                            ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID,
                                            'DomainArn'
                                        ),
                                        '*'
                                    ]
                                )
                            }
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    public makeStreamingLambdaIAMRole() {
        return new IAM.Role({
            RoleName: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName),
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
                new IAM.Role.Policy({
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
                                Resource: Fn.Join(
                                    '/',
                                    [
                                        Fn.GetAtt(
                                            ResourceConstants.RESOURCES.ElasticSearchDomainLogicalID,
                                            'DomainArn'
                                        ),
                                        '*'
                                    ]
                                )
                            }
                        ]
                    }
                }),
                new IAM.Role.Policy({
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
                                    Fn.Join(
                                        '/',
                                        [Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'), 'stream', '*']
                                    )
                                ]
                            }
                        ]
                    }
                }),
                new IAM.Role.Policy({
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
        })
    }

    /**
     * Create the elasticsearch domain.
     */
    public makeElasticSearchDomain() {
        return new Elasticsearch.Domain({
            DomainName: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchDomainName),
            ElasticsearchVersion: '6.2',
            ElasticsearchClusterConfig: {
                InstanceCount: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchInstanceCount),
                InstanceType: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchInstanceType)
            },
            EBSOptions: {
                EBSEnabled: true,
                VolumeType: 'gp2',
                VolumeSize: Fn.Ref(ResourceConstants.PARAMETERS.ElasticSearchEBSVolumeGB)
            }
        })
    }

    /**
     * Create the ElasticSearch search resolver.
     */
    public makeSearchResolver(type: string, fieldsToSearch: string[]) {
        const fieldName = graphqlName('search' + toUpper(type))
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticSearchDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: 'Query',
            RequestMappingTemplate: Fn.Sub(
                print(
                    compoundExpression([
                        set(ref('body'), obj({
                            size: ref('util.defaultIfNull($ctx.args.first, 20)'),
                            sort: list([
                                obj({ createdAt: str('asc') }),
                                obj({ _id: str('desc') })
                            ])
                        })),
                        ifElse(
                            ref('util.isNull($ctx.args.query)'),
                            set(
                                ref('query'),
                                obj({
                                    bool: obj({
                                        filter: obj({
                                            term: obj({
                                                '__typename.keyword': str(type)
                                            })
                                        }),
                                        must: list([
                                            obj({
                                                match_all: obj({})
                                            })
                                        ])
                                    })
                                })
                            ),
                            set(
                                ref('query'),
                                obj({
                                    bool: obj({
                                        filter: obj({
                                            term: obj({
                                                '__typename.keyword': str(type)
                                            })
                                        }),
                                        must: list([
                                            obj({
                                                multi_match: obj({
                                                    query: str('$ctx.args.query'),
                                                    fields: list(fieldsToSearch.map((s: string) => str(s))),
                                                    type: str('best_fields')
                                                })
                                            })
                                        ])
                                    })
                                })
                            )
                        ),
                        qref('$body.put("query", $query)'),
                        iff(
                            raw('!$util.isNullOrEmpty($ctx.args.after)'),
                            compoundExpression([
                                set(ref('split'), ref('ctx.args.after.split("/")')),
                                set(
                                    ref('afterToken'),
                                    list([ref('split.get(0)'), ref('split.get(1)')])
                                ),
                                qref('$body.put("search_after", $afterToken)')
                            ])
                        ),
                        set(ref('indexPath'), str('/${__ES_INDEX}/_search')),
                        ElasticSearchMappingTemplate.search({
                            body: ref('util.toJson($body)'),
                            pathRef: 'indexPath'
                        })
                    ]),
                ),
                { '__ES_INDEX': Fn.Ref(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID) }
            ),
            ResponseMappingTemplate: print(
                compoundExpression([
                    set(ref('items'), list([])),
                    forEach(
                        ref('entry'),
                        ref('context.result.hits.hits'),
                        [
                            iff(
                                raw('!$foreach.hasNext'),
                                set(ref('nextToken'), str('$entry.sort.get(0)/$entry.sort.get(1)'))
                            ),
                            qref('$items.add($entry.get("_source"))')
                        ]
                    ),
                    toJson(obj({
                        "items": ref('items'),
                        "total": ref('ctx.result.hits.total'),
                        "nextToken": ref('nextToken')
                    }))
                ])
            )
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }
}
