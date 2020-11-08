import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineactions from '@aws-cdk/aws-codepipeline-actions';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as custom from '@aws-cdk/custom-resources';
import fs from 'fs-extra';
import path from 'path';

const rootAssetDir = path.resolve(path.join(__dirname, '../../../../resources/awscloudformation'));

export type PipelineAwaiterProps = {
    pipelineName: string,
    artifactBucketName?: string,
    artifactKey?: string,
};

export class PipelineAwaiter extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        props: PipelineAwaiterProps
    ) {
        const {
            pipelineName,
            artifactBucketName,
            artifactKey,
        } = props;

        const pipelineArn = cdk.Fn.join('', [
            'arn:',
            cdk.Aws.PARTITION,
            ':codepipeline:',
            cdk.Aws.REGION,
            ':',
            cdk.Aws.ACCOUNT_ID,
            ':',
            pipelineName
        ]);

        const onEventHandler = new lambda.Function(scope, `${id}CustomEventHandler`, {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: "index.handler",
            code: lambda.Code.fromInline(`exports.handler = async function ({ RequestType, PhysicalResourceId, ResourceProperties }) {
                switch (RequestType) {
                    case 'Delete':
                    case 'Update':
                        return { PhysicalResourceId };
                }

                const { pipelineName } = ResourceProperties;

                const result = {
                    PhysicalResourceId: \`pipelineawaiter-\${pipelineName}\`
                };

                return result;
            };`),
            timeout: cdk.Duration.minutes(5),
        });

        const containerTemplateFilePath = path.join(rootAssetDir, 'awaiter', 'pipeline.js');
        const isCompleteHandlerCode = fs.readFileSync(containerTemplateFilePath, 'utf8');

        const isCompleteHandler = new lambda.Function(scope, `${id}CustomCompleteHandler`, {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: "index.handler",
            timeout: cdk.Duration.seconds(25),
            code: lambda.Code.fromInline(isCompleteHandlerCode),
            environment: { // TODO: Move to custom resource properties
                PIPELINE_NAME: pipelineName,
                ARTIFACT_BUCKET_NAME: artifactBucketName,
                ARTIFACT_KEY: artifactKey,
            },
        });
        isCompleteHandler.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'codepipeline:GetPipeline',
                'codepipeline:ListPipelineExecutions',
            ],
            resources: [pipelineArn],
        }));
        isCompleteHandler.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudformation:DescribeStacks',
            ],
            resources: [cdk.Stack.of(scope).stackId],
        }));

        const myProvider = new custom.Provider(scope, `${id}MyProvider`, {
            onEventHandler,
            isCompleteHandler,
            queryInterval: cdk.Duration.seconds(10),
        });

        const customResource = new cdk.CustomResource(scope, `Deployment${id}`, {
            serviceToken: myProvider.serviceToken,
            properties: {
                artifactKey,
                pipelineName,
            },
        });

        super(scope, id);
    }
}

export class PipelineWithAwaiter extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        {
            bucket,
            bucketKey,
            clusterName,
            serviceArn,
            ecr,
            container,
            githubPath,
            githubTokenSecretsManagerArn
        }: {
            bucket?: s3.IBucket;
            bucketKey?: string;
            githubTokenSecretsManagerArn?: string;
            githubPath?: string;
            clusterName: cdk.CfnParameter;
            serviceArn: cdk.CfnParameter;
            ecr: ecr.Repository;
            container: ecs.ContainerDefinition;
        },
    ) {
        super(scope, id);

        const sourceOutput = new codepipeline.Artifact('SourceArtifact');
        const buildOutput = new codepipeline.Artifact('BuildArtifact');

        const codebuildproject = new codebuild.PipelineProject(this, 'MyCodeBuildProject', {

            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                privileged: true,
            },
        });

        codebuildproject.addToRolePolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetRandomPassword',
                'secretsmanager:GetResourcePolicy',
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
                'secretsmanager:ListSecretVersionIds',
              ],
              resources: [githubTokenSecretsManagerArn],
            })
          )

        if (codebuildproject.role) {
            codebuildproject.role.addToPrincipalPolicy(
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: [
                        'ecr:GetAuthorizationToken',
                        'ecr:BatchGetImage',
                        'ecr:BatchGetDownloadUrlForLayer',
                        'ecr:InitiateLayerUpload',
                        'ecr:BatchCheckLayerAvailability',
                        'ecr:UploadLayerPart',
                        'ecr:CompleteLayerUpload',
                        'ecr:PutImage',
                    ],
                    effect: iam.Effect.ALLOW,
                }),
            );
        }

        const conditionIsInitial = new cdk.CfnCondition(this, "ConditionIsInitial", {
            expression: cdk.Fn.conditionAnd(cdk.Fn.conditionEquals(clusterName, ''), cdk.Fn.conditionEquals(serviceArn, ''))
        });
        const conditionIsUpdate = new cdk.CfnCondition(this, "ConditionIsUpdate", {
            expression: cdk.Fn.conditionNot(conditionIsInitial)
        });


        // TODO: Use this instead of the tmpService below
        class Import extends cdk.Resource implements ecs.IFargateService {
            public readonly serviceArn: string;
            public readonly serviceName: string;

            constructor(scope: cdk.Construct, id: string, props: { serviceArn: string }) {
                super(scope, id);

                this.serviceArn = props.serviceArn;
                this.serviceName = cdk.Arn.parse(this.serviceArn, '/', true).resourceName;
            }
        }

        const tmpService = ecs.FargateService.fromFargateServiceArn(this, "Service", serviceArn.valueAsString);
        (tmpService as any).cluster = {
            clusterName: clusterName.valueAsString,
            env: {},
        } as ecs.ICluster;
        (tmpService as any).serviceName = cdk.Fn.select(2, cdk.Fn.split('/', serviceArn.valueAsString));
        const service: ecs.IBaseService = tmpService as ecs.IBaseService;

        const sourceStageInitial = createSourceStage(scope, {
            bucket, 
            bucketKey, 
            condition: conditionIsInitial, 
            githubPath, 
            githubTokenSecretsManagerArn, 
            roleName: 'InitialSource', 
            sourceOutput
        });

        const stages: { stageName: string, actions: codepipelineactions.Action[] }[] = [
            sourceStageInitial,
            {
                stageName: 'Build',
                actions: [
                    new codepipelineactions.CodeBuildAction({
                        role: getRole(scope, 'InitialBuild', conditionIsInitial),
                        actionName: 'Build', // TODO: Make sure this matches with the one used in the awaiter
                        type: codepipelineactions.CodeBuildActionType.BUILD,
                        project: codebuildproject,
                        input: sourceOutput,
                        outputs: [buildOutput],
                        environmentVariables: {
                            REPOSITORY_URI: {
                                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                                value: ecr.repositoryUri,
                            },
                            CONTAINER_NAME: {
                                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                                value: container.containerName,
                            },
                        },
                    }),
                ],
            },
        ];

        const sourceStageUpdate = createSourceStage(scope, {
            bucket, 
            bucketKey, 
            condition: conditionIsUpdate, 
            githubPath, 
            githubTokenSecretsManagerArn, 
            roleName: 'UpdateSource', 
            sourceOutput
        });

        const stagesWithDeploy = <typeof stages>[
            sourceStageUpdate,
            {
                stageName: 'Build',
                actions: [
                    new codepipelineactions.CodeBuildAction({
                        role: getRole(scope, 'UpdateBuild', conditionIsUpdate),
                        actionName: 'Build',
                        type: codepipelineactions.CodeBuildActionType.BUILD,
                        project: codebuildproject,
                        input: sourceOutput,
                        outputs: [buildOutput],
                        environmentVariables: {
                            REPOSITORY_URI: {
                                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                                value: ecr.repositoryUri,
                            },
                            CONTAINER_NAME: {
                                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                                value: container.containerName,
                            },
                        },
                    }),
                ],
            },
            {
                stageName: 'Deploy',
                actions: [
                    new codepipelineactions.EcsDeployAction({
                        role: getRole(scope, 'UpdateDeploy', conditionIsUpdate),
                        actionName: 'Deploy',
                        service,
                        input: buildOutput,
                    }),
                ],
            }];

        const pipelineNames = [
            {
                prefix: 'Initial',
                condition: conditionIsInitial,
                stages
            },
            {
                prefix: 'Update',
                condition: conditionIsUpdate,
                stages: stagesWithDeploy
            },
        ].map(({ prefix, stages, condition }) => {
            const role = getRole(scope, `${prefix}Pipeline`, condition, new iam.ServicePrincipal('codepipeline.amazonaws.com'));

            const pipeline = new codepipeline.Pipeline(scope, `${prefix}Pipeline`, {
                crossAccountKeys: false,
                artifactBucket: bucket,
                stages: stages,
                role,
            });
            (pipeline.node.defaultChild as codepipeline.CfnPipeline).cfnOptions.condition = condition;
            (pipeline.node.defaultChild as codepipeline.CfnPipeline).cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;

            return pipeline;
        });

        const [initialPipeline, updatePipeline] = pipelineNames;
        const pipelineName = cdk.Fn.conditionIf(
            conditionIsInitial.logicalId,
            initialPipeline.pipelineName,
            updatePipeline.pipelineName
        ) as unknown as string
        const pipelineLogicalId = cdk.Fn.conditionIf(
            conditionIsInitial.logicalId,
            initialPipeline.node.id,
            updatePipeline.node.id
        ) as unknown as string

        const pipelineAwaiter = new PipelineAwaiter(scope, 'Awaiter', {
            pipelineName,
            artifactBucketName: bucket.bucketName,
            artifactKey: bucketKey
        });
    }
}

function createSourceStage(scope: cdk.Construct, {
    bucket,
    bucketKey,
    githubPath,
    githubTokenSecretsManagerArn,
    condition,
    sourceOutput,
    roleName
}: {
    bucket: s3.IBucket,
    bucketKey: string,
    githubPath: string,
    githubTokenSecretsManagerArn,
    condition: cdk.CfnCondition,
    sourceOutput: codepipeline.Artifact,
    roleName: string,
}) {
    const stage = {
        stageName: 'Source',
        actions: []
    };

    if (githubPath && githubTokenSecretsManagerArn) {
        const { githubOwner, githubRepo } = getGitHubOwnerRepoFromPath(githubPath);
        stage.actions = [
            new codepipelineactions.GitHubSourceAction({
                actionName: 'Source',
                oauthToken: cdk.SecretValue.secretsManager(githubTokenSecretsManagerArn),
                owner: githubOwner,
                repo: githubRepo,
                output: sourceOutput,

            })
        ];
    } else {
        stage.actions = [
            new codepipelineactions.S3SourceAction({
                role: getRole(scope, roleName, condition),
                actionName: 'Source',
                bucket,
                bucketKey: bucketKey,
                output: sourceOutput,
            }),
        ];
    }

    return stage;
}

function getGitHubOwnerRepoFromPath(path: string) {
    if (!path.startsWith('https://github.com/')) {
        throw Error(`Invalid Repo Path ${path}`);
    }

    const [githubOwner, githubRepo] = path.substring(19).split('/'); // https://github.com/<owner>/<repo> 

    return {
        githubOwner,
        githubRepo
    }
}

function getRole(
    scope: cdk.Construct,
    prefix: string,
    condition: cdk.CfnCondition,
    assumedBy?: iam.IPrincipal,
): iam.Role {
    const role = new iam.Role(scope, `${prefix}Role`, {
        assumedBy: assumedBy ?? new iam.AccountRootPrincipal(),
    });

    const cfnRole = role.node.defaultChild as iam.CfnRole;
    // condition for role
    cfnRole.cfnOptions.condition = condition;

    // We add a dummy statement that we immediately remove so CDK creates a policy to which we can add a condition
    const defaultPolicy = role.addToPrincipalPolicy(new iam.PolicyStatement({
        actions: ['*'],
        effect: iam.Effect.DENY,
    })).policyDependable as iam.Policy;
    (defaultPolicy.document as any).statements = [];

    // condition for policy
    (defaultPolicy.node.defaultChild as iam.CfnPolicy).cfnOptions.condition = condition;

    return role;
};

export type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
    githubPath?: string;
    githubTokenSecretsManagerArn: string;
};