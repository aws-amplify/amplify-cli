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
import { ContainerStackProps, PipelineWithAwaiter } from './PipelineWithAwaiter';

const rootAssetDir = path.resolve(path.join(__dirname, '../../../../resources/awscloudformation'));

export class ContainerStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ContainerStackProps) {
        const { deploymentBucket, containerPort, awaiterZipPath, githubPath, githubTokenSecretsManagerArn } = props;

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
            githubPath,
            githubTokenSecretsManagerArn
        });

        // Outputs
        new cdk.CfnOutput(this, 'TaskDefinitionArn', {
            value: task.taskDefinitionArn,
        });
    }
}

