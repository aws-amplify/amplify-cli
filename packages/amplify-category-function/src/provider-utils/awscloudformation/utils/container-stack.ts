import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineactions from '@aws-cdk/aws-codepipeline-actions';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as custom from '@aws-cdk/custom-resources';

class PipelineAwaiter extends cdk.CustomResource {
    constructor(
        scope: cdk.Construct,
        id: string,
        pipeline: codepipeline.Pipeline,
    ) {
        const onEventHandler = new lambda.Function(scope, "CustomEventHandler", {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: "index.handler",
            code: lambda.Code.fromInline(`exports.handler = function (event) {};`),
            timeout: cdk.Duration.minutes(5),
        });

        const isCompleteHandler = new lambda.Function(scope, "CustomCompleteHandler", {
            runtime: lambda.Runtime.NODEJS_12_X,
            handler: "index.handler",
            timeout: cdk.Duration.seconds(25),
            code: lambda.Code.fromInline('const AWS=require("aws-sdk"),codePipeline=new AWS.CodePipeline;exports.handler=async function({RequestType:e}){if(console.log({RequestType:e}),"Delete"===e)return{IsComplete:!0};const{PIPELINE_NAME:i}=process.env,{pipelineExecutionSummaries:[s]}=await codePipeline.listPipelineExecutions({pipelineName:i}).promise();console.log(s);const{status:o}=s||{};if(void 0===o)return{IsComplete:!1};let t=!1;switch(o){case"Failed":case"Stopped":throw new Error("The execution didn\'t succeed");case"Succeeded":t=!0}return{IsComplete:t}};'),
            environment: {
                PIPELINE_NAME: pipeline.pipelineName
            },
        });
        isCompleteHandler.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:ListPipelineExecutions'],
            resources: [pipeline.pipelineArn],
        }))

        const myProvider = new custom.Provider(scope, "MyProvider", {
            onEventHandler,
            isCompleteHandler,
        });

        super(scope, id, {
            serviceToken: myProvider.serviceToken,
        });
    }
}

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

        const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
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

        const pipelineAwaiter = new PipelineAwaiter(this, "MyAwaiter", pipeline);
        (pipelineAwaiter.node.defaultChild as cdk.CfnCustomResource).addDependsOn(
            pipeline.node.defaultChild as codepipeline.CfnPipeline
        );
    }
}

type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
    synthesizer?: cdk.IStackSynthesizer;
};
export class ContainerStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ContainerStackProps) {
        const { deploymentBucket, containerPort, awaiterZipPath, synthesizer } = props;
        
        super(scope, id, {synthesizer});

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
