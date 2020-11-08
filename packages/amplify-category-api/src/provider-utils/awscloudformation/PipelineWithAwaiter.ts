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

type PipelineAwaiterProps = {
    pipeline: codepipeline.Pipeline,
    artifactBucketName?: string,
    artifactKey?: string,
};

export type GitHubSourceActionInfo = {
    path: string;
    tokenSecretArn: string;
}

class PipelineAwaiter extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        props: PipelineAwaiterProps
    ) {
        const {
            pipeline,
            artifactBucketName,
            artifactKey,
        } = props;

        const { pipelineArn, pipelineName } = pipeline;

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

        const containerTemplateFilePath = path.join(__dirname, 'awaiter', 'pipeline.js');
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
            s3SourceActionKey,
            service,
            repository,
            container,
            githubSourceActionInfo,
        }: {
            bucket: s3.IBucket;
            s3SourceActionKey?: string;
            githubSourceActionInfo?: GitHubSourceActionInfo;
            service: ecs.CfnService;
            repository: ecr.Repository;
            container: ecs.ContainerDefinition;
        },
    ) {
        super(scope, id);

        const sourceOutput = new codepipeline.Artifact('SourceArtifact');
        const buildOutput = new codepipeline.Artifact('BuildArtifact');

        const codebuildproject = new codebuild.PipelineProject(scope, `${id}CodeBuildProject`, {

            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                privileged: true,
            },
        });

        if (githubSourceActionInfo) {
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
                    resources: [githubSourceActionInfo.tokenSecretArn],
                })
            )
        }

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

        const sourceStageUpdate = createSourceStage(scope, {
            bucket,
            s3SourceActionKey,
            githubSourceActionInfo,
            roleName: 'UpdateSource',
            sourceOutput
        });

        const stagesWithDeploy = [
            sourceStageUpdate,
            {
                stageName: 'Build',
                actions: [
                    new codepipelineactions.CodeBuildAction({
                        role: getRole(scope, 'UpdateBuild'),
                        actionName: 'Build',
                        type: codepipelineactions.CodeBuildActionType.BUILD,
                        project: codebuildproject,
                        input: sourceOutput,
                        outputs: [buildOutput],
                        environmentVariables: {
                            REPOSITORY_URI: {
                                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                                value: repository.repositoryUri,
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
                        role: getRole(scope, 'UpdateDeploy'),
                        actionName: 'Deploy',
                        service: new class extends cdk.Construct implements ecs.IBaseService {
                            cluster = {
                                clusterName: service.cluster,
                                env: {},
                            } as ecs.ICluster;
                            serviceArn = cdk.Fn.ref(service.serviceArn);
                            serviceName = service.serviceName;
                            stack = cdk.Stack.of(this);
                            env = {} as any;
                            node = service.node;
                        }(this, 'tmpService'), // TODO: clean this,
                        input: buildOutput,
                    }),
                ],
            }];

        const role = getRole(scope, `Pipeline`, new iam.ServicePrincipal('codepipeline.amazonaws.com'));

        const pipeline = new codepipeline.Pipeline(scope, `${id}Pipeline`, {
            crossAccountKeys: false,
            artifactBucket: bucket,
            stages: stagesWithDeploy,
            role,
        });

        pipeline.node.addDependency(service); 

        const pipelineAwaiter = new PipelineAwaiter(scope, 'Awaiter', {
            pipeline,
            artifactBucketName: bucket.bucketName,
            artifactKey: s3SourceActionKey
        });
    }
}

function createSourceStage(scope: cdk.Construct, {
    bucket,
    s3SourceActionKey,
    githubSourceActionInfo,
    sourceOutput,
    roleName
}: {
    bucket: s3.IBucket,
    s3SourceActionKey: string,
    githubSourceActionInfo?: GitHubSourceActionInfo,
    sourceOutput: codepipeline.Artifact,
    roleName: string,
}) {
    const stage = {
        stageName: 'Source',
        actions: []
    };

    if (githubSourceActionInfo && githubSourceActionInfo.path) {
        const { path, tokenSecretArn } = githubSourceActionInfo;
        const { githubOwner, githubRepo } = getGitHubOwnerRepoFromPath(path);
        stage.actions = [
            new codepipelineactions.GitHubSourceAction({
                actionName: 'Source',
                oauthToken: cdk.SecretValue.secretsManager(tokenSecretArn),
                owner: githubOwner,
                repo: githubRepo,
                output: sourceOutput,

            })
        ];
    } else {
        stage.actions = [
            new codepipelineactions.S3SourceAction({
                role: getRole(scope, roleName),
                actionName: 'Source',
                bucket,
                bucketKey: s3SourceActionKey,
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
        githubRepo // get branch from GitHub path
    }
}

function getRole(
    scope: cdk.Construct,
    prefix: string,
    assumedBy?: iam.IPrincipal,
): iam.Role {
    const role = new iam.Role(scope, `${prefix}Role`, {
        assumedBy: assumedBy ?? new iam.AccountRootPrincipal(),
    });

    const cfnRole = role.node.defaultChild as iam.CfnRole;

    // We add a dummy statement that we immediately remove so CDK creates a policy to which we can add a condition
    const defaultPolicy = role.addToPrincipalPolicy(new iam.PolicyStatement({
        actions: ['*'],
        effect: iam.Effect.DENY,
    })).policyDependable as iam.Policy;
    (defaultPolicy.document as any).statements = [];

    return role;
};

export type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
    githubPath?: string;
    githubTokenSecretsManagerArn: string;
};