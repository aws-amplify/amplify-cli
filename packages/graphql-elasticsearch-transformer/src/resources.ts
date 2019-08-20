import Output from 'cloudform-types/types/output';
import AppSync from 'cloudform-types/types/appSync'
import IAM from 'cloudform-types/types/iam'
import Template from 'cloudform-types/types/template'
import { Fn, StringParameter, NumberParameter, Lambda, Elasticsearch, Refs } from 'cloudform-types'
import {
    ElasticsearchMappingTemplate,
    print, str, ref, obj, set, iff, list, raw,
    forEach, compoundExpression, qref, toJson, ifElse,
    int, Expression
} from 'graphql-mapping-template'
import { toUpper, plurality, graphqlName, ResourceConstants, ModelResourceIDs } from 'graphql-transformer-common'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.ElasticsearchAccessIAMRoleName]: new StringParameter({
                Description: 'The name of the IAM role assumed by AppSync for Elasticsearch.',
                Default: 'AppSyncElasticsearchRole'
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchStreamingLambdaHandlerName]: new StringParameter({
                Description: 'The name of the lambda handler.',
                Default: 'python_streaming_function.lambda_handler'
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchStreamingLambdaRuntime]: new StringParameter({
                Description: `The lambda runtime \
                (https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime)`,
                Default: 'python3.6'
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchStreamingFunctionName]: new StringParameter({
                Description: 'The name of the streaming lambda function.',
                Default: 'DdbToEsFn'
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchStreamingIAMRoleName]: new StringParameter({
                Description: 'The name of the streaming lambda function IAM role.',
                Default: 'SearchableLambdaIAMRole'
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchDebugStreamingLambda]: new NumberParameter({
                Description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
                Default: 1,
                AllowedValues: [0, 1]
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchInstanceCount]: new NumberParameter({
                Description: 'The number of instances to launch into the Elasticsearch domain.',
                Default: 1
            }),
            [ResourceConstants.PARAMETERS.ElasticsearchInstanceType]: new StringParameter({
                Description: 'The type of instance to launch into the Elasticsearch domain.',
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
            [ResourceConstants.PARAMETERS.ElasticsearchEBSVolumeGB]: new NumberParameter({
                Description: 'The size in GB of the EBS volumes that contain our data.',
                Default: 10
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
                [ResourceConstants.RESOURCES.ElasticsearchAccessIAMRoleLogicalID]: this.makeElasticsearchAccessIAMRole(),
                [ResourceConstants.RESOURCES.ElasticsearchDataSourceLogicalID]: this.makeElasticsearchDataSource(),
                [ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID]: this.makeElasticsearchDomain(),
                [ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaIAMRoleLogicalID]: this.makeStreamingLambdaIAMRole(),
                [ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaFunctionLogicalID]: this.makeDynamoDBStreamingFunction()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.ElasticsearchDomainArn]: this.makeDomainArnOutput(),
                [ResourceConstants.OUTPUTS.ElasticsearchDomainEndpoint]: this.makeDomainEndpointOutput()
            }
        }
    }

    /**
         * Given the name of a data source and optional logical id return a CF
         * spec for a data source pointing to the elasticsearch domain.
         * @param name The name for the data source. If a logicalId is not provided the name is used.
         * @param logicalId The logicalId of the domain if it is different than the name of the data source.
         */
    public makeElasticsearchDataSource() {
        const logicalName = ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: logicalName,
            Type: 'AMAZON_ELASTICSEARCH',
            ServiceRoleArn: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchAccessIAMRoleLogicalID, 'Arn'),
            ElasticsearchConfig: {
                AwsRegion: Fn.Select(3, Fn.Split(':', Fn.GetAtt(logicalName, 'DomainArn'))),
                Endpoint:
                    Fn.Join('', [
                        'https://',
                        Fn.GetAtt(logicalName, 'DomainEndpoint')
                    ])
            }
        }).dependsOn(ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID)
    }

    /**
     * Deploy a lambda function that will stream data from our DynamoDB table
     * to our elasticsearch index.
     */
    public makeDynamoDBStreamingFunction() {
        return new Lambda.Function({
            Code: {
                S3Bucket: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                S3Key: Fn.Join('/', [
                    Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    "functions",
                    Fn.Join('.', [
                        ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaFunctionLogicalID,
                        "zip"
                    ]),
                ])
            },
            FunctionName: this.joinWithEnv("-", [
                Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchStreamingFunctionName),
                Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            ]),
            Handler: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchStreamingLambdaHandlerName),
            Role: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaIAMRoleLogicalID, 'Arn'),
            Runtime: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchStreamingLambdaRuntime),
            Environment: {
                Variables: {
                    ES_ENDPOINT: Fn.Join('', [
                        'https://',
                        Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID, 'DomainEndpoint')
                    ]),
                    ES_REGION: Fn.Select(3, Fn.Split(':', Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID, 'DomainArn'))),
                    DEBUG: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchDebugStreamingLambda)
                }
            }
        }).dependsOn([
            ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaIAMRoleLogicalID,
            ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID
        ])
    }

    public makeDynamoDBStreamEventSourceMapping(typeName: string) {
        return new Lambda.EventSourceMapping({
            BatchSize: 1,
            Enabled: true,
            EventSourceArn: Fn.GetAtt(ModelResourceIDs.ModelTableResourceID(typeName), 'StreamArn'),
            FunctionName: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaFunctionLogicalID, 'Arn'),
            StartingPosition: 'LATEST'
        }).dependsOn([
            ResourceConstants.RESOURCES.ElasticsearchStreamingLambdaFunctionLogicalID
        ])
    }

    private joinWithEnv(separator: string, listToJoin: any[]) {
        return Fn.If(
            ResourceConstants.CONDITIONS.HasEnvironmentParameter,
            Fn.Join(
                separator,
                [
                    ...listToJoin,
                    Fn.Ref(ResourceConstants.PARAMETERS.Env)
                ]
            ),
            Fn.Join(
                separator,
                listToJoin
            )
        )
    }

    /**
     * Create a single role that has access to all the resources created by the
     * transform.
     * @param name  The name of the IAM role to create.
     */
    public makeElasticsearchAccessIAMRole() {
        return new IAM.Role({
            RoleName: this.joinWithEnv("-", [
                Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchAccessIAMRoleName),
                Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
            ]),
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
                    PolicyName: 'ElasticsearchAccess',
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
                                    '',
                                    [
                                        this.domainArn(),
                                        "/*"
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
            RoleName: this.joinWithEnv("-", [
                Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchStreamingIAMRoleName),
                Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            ]),
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
                    PolicyName: 'ElasticsearchAccess',
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
                                    '',
                                    [
                                        this.domainArn(),
                                        "/*"
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
                                    "*"
                                    // TODO: Scope this to each table individually.
                                    // Fn.Join(
                                    //     '/',
                                    //     [Fn.GetAtt(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID, 'Arn'), '*']
                                    // )
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
        // .dependsOn(ResourceConstants.RESOURCES.DynamoDBModelTableLogicalID)
    }

    /**
     * If there is an env, allow ES to create the domain name so we don't go
     * over 28 characters. If there is no env, fallback to original behavior.
     */
    private domainName() {
        return Fn.If(
            ResourceConstants.CONDITIONS.HasEnvironmentParameter,
            Refs.NoValue,
            Fn.Join(
                '-',
                [
                    'd',
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
                ]
            )
        )
    }

    private domainArn() {
        return Fn.GetAtt(
            ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID,
            "DomainArn"
        )
    }

    /**
     * Create the elasticsearch domain.
     */
    public makeElasticsearchDomain() {
        return new Elasticsearch.Domain({
            DomainName: this.domainName(),
            ElasticsearchVersion: '6.2',
            ElasticsearchClusterConfig: {
                ZoneAwarenessEnabled: false,
                InstanceCount: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchInstanceCount),
                InstanceType: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchInstanceType)
            },
            EBSOptions: {
                EBSEnabled: true,
                VolumeType: 'gp2',
                VolumeSize: Fn.Ref(ResourceConstants.PARAMETERS.ElasticsearchEBSVolumeGB)
            }
        })
    }

    /**
     * Create the Elasticsearch search resolver.
     */
    public makeSearchResolver(type: string, nonKeywordFields: Expression[], nameOverride?: string, queryTypeName: string = 'Query') {
        const fieldName = nameOverride ? nameOverride : graphqlName('search' + plurality(toUpper(type)));
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchDataSourceLogicalID, 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('indexPath'), str(`/${type.toLowerCase()}/doc/_search`)),
                    set(ref('nonKeywordFields'), list(nonKeywordFields)),
                    ElasticsearchMappingTemplate.searchItem({
                        path: str('$indexPath'),
                        size: ifElse(
                            ref('context.args.limit'),
                            ref('context.args.limit'),
                            int(10),
                            true),
                        search_after: list([str('$context.args.nextToken')]),
                        query: ifElse(
                            ref('context.args.filter'),
                            ref('util.transform.toElasticsearchQueryDSL($ctx.args.filter)'),
                            obj({
                                'match_all': obj({})
                            })),
                        sort: ifElse(
                            ref('context.args.sort'),
                            list([
                                iff(raw('!$util.isNullOrEmpty($context.args.sort.field) && !$util.isNullOrEmpty($context.args.sort.direction)'),
                                raw(`{${'#if($nonKeywordFields.contains($context.args.sort.field))\
                                    \n"$context.args.sort.field" #else "${context.args.sort.field}.keyword" #end'} : {
                                        "order": "$context.args.sort.direction"
                                    }
                                }`)
                                )
                            ]),
                            list([]))
                    })
                ])
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
                                set(ref('nextToken'), str('$entry.sort.get(0)'))
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
        }).dependsOn([
            ResourceConstants.RESOURCES.ElasticsearchDataSourceLogicalID
        ])
    }

    /**
     * OUTPUTS
     */
    /**
     * Create output to export the Elasticsearch DomainArn
     * @returns Output
     */
    public makeDomainArnOutput(): Output {
        return {
            Description: "Elasticsearch instance Domain ARN.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID, 'DomainArn'),
            Export: {
                Name: Fn.Join(':', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId), "GetAtt", "Elasticsearch", "DomainArn"])
            }
        }
    }
    /**
     * Create output to export the Elasticsearch DomainEndpoint
     * @returns Output
     */
    public makeDomainEndpointOutput(): Output {
        return {
            Description: "Elasticsearch instance Domain Endpoint.",
            Value: Fn.Join('', ['https://', Fn.GetAtt(ResourceConstants.RESOURCES.ElasticsearchDomainLogicalID, 'DomainEndpoint')]),
            Export: {
                Name: Fn.Join(':', [Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId), "GetAtt", "Elasticsearch", "DomainEndpoint"])
            }
        }
    }
}
