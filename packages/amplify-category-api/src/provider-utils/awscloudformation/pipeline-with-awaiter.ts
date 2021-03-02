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
import * as fs from 'fs-extra';
import * as path from 'path';
import { DEPLOYMENT_MECHANISM } from './base-api-stack';
import { getGitHubOwnerRepoFromPath } from './utils/github';

type PipelineAwaiterProps = {
  pipeline: codepipeline.Pipeline;
  artifactBucketName?: string;
  artifactKey?: string;
  deploymentMechanism: DEPLOYMENT_MECHANISM;
};

export type GitHubSourceActionInfo = {
  path: string;
  tokenSecretArn: string;
};

// TODO update when CDK is updated to newer version that supports NODEJS_14_X
const lambdaRuntimeNodeVersion = lambda.Runtime.NODEJS_12_X;

const lambdasDir = path.resolve(__dirname, '../../../resources/awscloudformation/lambdas');

class PipelineAwaiter extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: PipelineAwaiterProps) {
    const { pipeline, artifactBucketName, artifactKey, deploymentMechanism } = props;

    const { pipelineArn, pipelineName } = pipeline;

    const pipelineOnEventCodeFilePath = path.join(lambdasDir, 'pipeline-on-event.js');
    const onEventHandlerCode = fs.readFileSync(pipelineOnEventCodeFilePath, 'utf8');

    const onEventHandler = new lambda.Function(scope, `${id}CustomEventHandler`, {
      runtime: lambdaRuntimeNodeVersion,
      handler: 'index.handler',
      code: lambda.Code.fromInline(onEventHandlerCode),
      timeout: cdk.Duration.seconds(15),
    });

    const pipelineCodeFilePath = path.join(lambdasDir, 'pipeline.js');
    const isCompleteHandlerCode = fs.readFileSync(pipelineCodeFilePath, 'utf8');

    const isCompleteHandler = new lambda.Function(scope, `${id}CustomCompleteHandler`, {
      runtime: lambdaRuntimeNodeVersion,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(15),
      code: lambda.Code.fromInline(isCompleteHandlerCode),
    });
    isCompleteHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codepipeline:GetPipeline', 'codepipeline:ListPipelineExecutions'],
        resources: [pipelineArn],
      }),
    );
    isCompleteHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudformation:DescribeStacks'],
        resources: [cdk.Stack.of(scope).stackId],
      }),
    );

    const myProvider = new custom.Provider(scope, `${id}MyProvider`, {
      onEventHandler,
      isCompleteHandler,
      queryInterval: cdk.Duration.seconds(10),
    });

    new cdk.CustomResource(scope, `Deployment${id}`, {
      serviceToken: myProvider.serviceToken,
      properties: {
        artifactBucketName,
        artifactKey,
        pipelineName,
        deploymentMechanism,
      },
    });

    super(scope, id);
  }
}

export class PipelineWithAwaiter extends cdk.Construct {
  pipelineName: string;
  constructor(
    scope: cdk.Construct,
    id: string,
    {
      skipWait = false,
      bucket,
      s3SourceActionKey,
      service,
      deploymentMechanism,
      gitHubSourceActionInfo,
      containersInfo,
      desiredCount,
      envName,
    }: {
      skipWait?: boolean;
      bucket: s3.IBucket;
      s3SourceActionKey?: string;
      deploymentMechanism: DEPLOYMENT_MECHANISM;
      gitHubSourceActionInfo?: GitHubSourceActionInfo;
      service: ecs.CfnService;
      containersInfo: {
        container: ecs.ContainerDefinition;
        repository: ecr.IRepository;
      }[];
      desiredCount: number;
      envName: string;
    },
  ) {
    super(scope, id);

    const sourceOutput = new codepipeline.Artifact('SourceArtifact');
    const buildOutput = new codepipeline.Artifact('BuildArtifact');

    const codeBuildProject = new codebuild.PipelineProject(scope, `${id}CodeBuildProject`, {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        // See: https://docs.aws.amazon.com/codebuild/latest/userguide/troubleshooting.html#troubleshooting-cannot-connect-to-docker-daemon
        privileged: true,
      },
    });

    if (gitHubSourceActionInfo && gitHubSourceActionInfo.tokenSecretArn) {
      codeBuildProject.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetRandomPassword',
            'secretsmanager:GetResourcePolicy',
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
            'secretsmanager:ListSecretVersionIds',
          ],
          resources: [gitHubSourceActionInfo.tokenSecretArn],
        }),
      );
    }

    codeBuildProject.role.addToPrincipalPolicy(
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

    const prebuildStages = createPreBuildStages(scope, {
      bucket,
      s3SourceActionKey,
      gitHubSourceActionInfo,
      roleName: 'UpdateSource',
      sourceOutput,
    });

    const environmentVariables = containersInfo.reduce(
      (acc, c) => {
        acc[`${c.container.containerName}_REPOSITORY_URI`] = {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: c.repository.repositoryUri,
        };

        return acc;
      },
      {
        AWS_ACCOUNT_ID: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: cdk.Aws.ACCOUNT_ID,
        },
      } as Record<string, codebuild.BuildEnvironmentVariable>,
    );

    const stagesWithDeploy = ([] as codepipeline.StageOptions[]).concat(prebuildStages, [
      {
        stageName: 'Build',
        actions: [
          new codepipelineactions.CodeBuildAction({
            actionName: 'Build',
            type: codepipelineactions.CodeBuildActionType.BUILD,
            project: codeBuildProject,
            input: sourceOutput,
            outputs: [buildOutput],
            environmentVariables,
          }),
        ],
      },
      {
        stageName: 'Predeploy',
        actions: [
          new codepipelineactions.LambdaInvokeAction({
            actionName: 'Predeploy',
            lambda: (() => {
              const preDeployCodeFilePath = path.join(lambdasDir, 'predeploy.js');
              const lambdaHandlerCode = fs.readFileSync(preDeployCodeFilePath, 'utf8');

              const action = new lambda.Function(scope, 'PreDeployLambda', {
                code: lambda.Code.fromInline(lambdaHandlerCode),
                handler: 'index.handler',
                runtime: lambdaRuntimeNodeVersion,
                environment: {
                  DESIRED_COUNT: `${desiredCount}`,
                  CLUSTER_NAME: service.cluster,
                  SERVICE_NAME: service.serviceName,
                },
                timeout: cdk.Duration.seconds(15),
              });

              action.addToRolePolicy(
                new iam.PolicyStatement({
                  actions: ['ecs:UpdateService'],
                  effect: iam.Effect.ALLOW,
                  resources: [cdk.Fn.ref(service.logicalId)],
                }),
              );

              return action;
            })(),
            inputs: [],
            outputs: [],
          }),
        ],
      },
      {
        stageName: 'Deploy',
        actions: [
          new codepipelineactions.EcsDeployAction({
            actionName: 'Deploy',
            service: new (class extends cdk.Construct implements ecs.IBaseService {
              cluster = {
                clusterName: service.cluster,
                env: {},
              } as ecs.ICluster;
              serviceArn = cdk.Fn.ref(service.serviceArn);
              serviceName = service.serviceName;
              stack = cdk.Stack.of(this);
              env = {} as any;
              node = service.node;
            })(this, 'tmpService'),
            input: buildOutput,
          }),
        ],
      },
    ]);

    this.pipelineName = `${envName}-${service.serviceName}`;

    const pipeline = new codepipeline.Pipeline(scope, `${id}Pipeline`, {
      pipelineName: this.pipelineName,
      crossAccountKeys: false,
      artifactBucket: bucket,
      stages: stagesWithDeploy,
    });

    pipeline.node.addDependency(service);

    if (!skipWait) {
      new PipelineAwaiter(scope, 'Awaiter', {
        pipeline,
        artifactBucketName: bucket.bucketName,
        artifactKey: s3SourceActionKey,
        deploymentMechanism,
      });
    }

    new cdk.CfnOutput(scope, 'PipelineName', { value: this.pipelineName });
  }

  getPipelineName(): string {
    return this.pipelineName;
  }
}

function createPreBuildStages(
  scope: cdk.Construct,
  {
    bucket,
    s3SourceActionKey,
    gitHubSourceActionInfo,
    sourceOutput,
    roleName,
  }: {
    bucket: s3.IBucket;
    s3SourceActionKey: string;
    gitHubSourceActionInfo?: GitHubSourceActionInfo;
    sourceOutput: codepipeline.Artifact;
    roleName: string;
  },
) {
  const stages: codepipeline.StageOptions[] = [];

  const stage = {
    stageName: 'Source',
    actions: [],
  };

  stages.push(stage);

  if (gitHubSourceActionInfo && gitHubSourceActionInfo.path) {
    const { path, tokenSecretArn } = gitHubSourceActionInfo;
    const { owner, repo, branch } = getGitHubOwnerRepoFromPath(path);

    const preBuildOutput = new codepipeline.Artifact('PreBuildArtifact');

    stage.actions = [
      new codepipelineactions.GitHubSourceAction({
        actionName: 'Source',
        oauthToken: cdk.SecretValue.secretsManager(tokenSecretArn),
        owner,
        repo,
        branch,
        output: preBuildOutput,
      }),
    ];

    stages.push({
      stageName: 'PreBuild',
      actions: [
        new codepipelineactions.LambdaInvokeAction({
          actionName: 'PreBuild',
          lambda: new lambda.Function(scope, 'PreBuildLambda', {
            code: lambda.S3Code.fromBucket(bucket, 'codepipeline-action-buildspec-generator-lambda.zip'),
            handler: 'index.handler',
            runtime: lambdaRuntimeNodeVersion,
            timeout: cdk.Duration.seconds(15),
          }),
          inputs: [preBuildOutput],
          outputs: [sourceOutput],
        }),
      ],
    });
  } else {
    stage.actions = [
      new codepipelineactions.S3SourceAction({
        actionName: 'Source',
        bucket,
        bucketKey: s3SourceActionKey,
        output: sourceOutput,
      }),
    ];
  }

  return stages;
}

export type ContainerStackProps = {
  deploymentBucket: string;
  containerPort: number;
  awaiterZipPath: string;
  gitHubPath?: string;
  gitHubTokenSecretsManagerArn: string;
};
