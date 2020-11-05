import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineactions from '@aws-cdk/aws-codepipeline-actions';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
};

class PipelineWithAwaiter extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        {
            bucket,
            bucketKey,
            service,
            ecr,
            container,
        }: {
            bucket: s3.IBucket;
            bucketKey: string;
            service?: ecs.FargateService;
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

        const pipelineRole = new iam.Role(this, "Bleble", {
            assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        });

        // We add and remove a statement so CDK creates the policy to pass later to addDependsOn
        const policy = pipelineRole.addToPrincipalPolicy(new iam.PolicyStatement()).policyDependable as iam.Policy;
        (policy.document as any).statements = [];

        const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
            role: pipelineRole,
            crossAccountKeys: false,
            artifactBucket: bucket,
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipelineactions.S3SourceAction({
                            actionName: 'Source',
                            bucket,
                            bucketKey: bucketKey,
                            output: sourceOutput,
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipelineactions.CodeBuildAction({
                            type: codepipelineactions.CodeBuildActionType.BUILD,
                            actionName: 'Build',
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
            ]
                .concat(
                    service
                        ? {
                            stageName: 'Deploy',
                            actions: [
                                new codepipelineactions.EcsDeployAction({
                                    actionName: 'Deploy',
                                    service,
                                    input: buildOutput,
                                }),
                            ],
                        }
                        : <any>undefined,
                )
                .filter(Boolean),
        });

        // For some reason, CDK doesn't add these automatically
        const x =  (pipeline.node.defaultChild as codepipeline.CfnPipeline);
        x.addDependsOn(((pipeline.role as iam.Role).node.defaultChild as iam.CfnRole));
        x.addDependsOn(policy.node.defaultChild as any);

        if (codebuildproject.role) {
            // https://t.corp.amazon.com/V260327869/communication
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

        // const pipelineAwaiter = new PipelineAwaiter(this, "MyAwaiter", {
        //     queue: queue,
        //     bucketKey,
        // });

        // (pipelineAwaiter.node.defaultChild as CfnCustomResource).addDependsOn(
        //     pipeline.node.defaultChild as CfnPipeline
        // );
    }
}

export class ContainerStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ContainerStackProps) {
        super(scope, id);

        const { deploymentBucket, containerPort, awaiterZipPath } = props;

        new cdk.CfnParameter(this, 'env', { type: 'String' });

        const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', { type: 'String' });
        const paramZipPath2 = new cdk.CfnParameter(this, 'ParamZipPath2', {
            type: 'String',
            default: '',
        });

        // ECR
        const repository = new ecr.Repository(this, 'Repository', {});
        (repository.node.defaultChild as ecr.CfnRepository).overrideLogicalId('Repository');

        // Task (role, definition, execution role, policy)
        const task = new ecs.TaskDefinition(this, 'TaskDefinition', {
            compatibility: ecs.Compatibility.FARGATE,
            cpu: '256',
            memoryMiB: '512',
        });
        (task.node.defaultChild as ecs.CfnTaskDefinition).overrideLogicalId('TaskDefinition');

        // TODO: MyContainer should come from elsewhere
        const container = task.addContainer('MyContainer', {
            image: ecs.ContainerImage.fromEcrRepository(repository),
        });
        container.addPortMappings({
            containerPort,
            protocol: ecs.Protocol.TCP,
        });

        // CodePipeline
        const cosa = new PipelineWithAwaiter(this, 'Pipeline', {
            bucket: s3.Bucket.fromBucketName(this, 'Bucket', deploymentBucket),
            bucketKey: paramZipPath.valueAsString,
            container,
            ecr: repository,
        });

        // Outputs
        new cdk.CfnOutput(this, 'TaskDefinitionArn', {
            value: task.taskDefinitionArn,
        });
    }
}
