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

type PipelineAwaiterProps = {
    pipelineName: string,
    artifactBucketName: string,
    artifactKey: string,
};
class PipelineAwaiter extends cdk.Construct {
    constructor(
        scope: cdk.Construct,
        id: string,
        props: PipelineAwaiterProps
    ) {
        const {
            pipelineName,
            artifactBucketName,
            artifactKey
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

class PipelineWithAwaiter extends cdk.Construct {
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
        }: {
            bucket: s3.IBucket;
            bucketKey: string;
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

        const stages: { stageName: string, actions: codepipelineactions.Action[] }[] = [
            {
                stageName: 'Source',
                actions: [
                    new codepipelineactions.S3SourceAction({
                        role: getRole(scope, 'InitialSource', conditionIsInitial),
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
        const stagesWithDeploy = <typeof stages>[
            {
                stageName: 'Source',
                actions: [
                    new codepipelineactions.S3SourceAction({
                        role: getRole(scope, 'UpdateSource', conditionIsUpdate),
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

type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
};
export class ContainerStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ContainerStackProps) {
        const { deploymentBucket, containerPort, awaiterZipPath } = props;

        super(scope, id);

        new cdk.CfnParameter(this, 'env', { type: 'String' });

        const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', { type: 'String' });
        const paramClusterName = new cdk.CfnParameter(this, 'ParamClusterName', {
            type: 'String',
            default: '',
        });
        const paramServiceArn = new cdk.CfnParameter(this, 'ParamServiceArn', {
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
            serviceArn: paramServiceArn,
            clusterName: paramClusterName,
        });

        // Outputs
        new cdk.CfnOutput(this, 'TaskDefinitionArn', {
            value: task.taskDefinitionArn,
        });
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
