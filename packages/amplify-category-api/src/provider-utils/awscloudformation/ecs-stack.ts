import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import { GitHubSourceActionInfo, PipelineWithAwaiter } from './PipelineWithAwaiter';

type EcsStackProps = {
    apiName: string;
    containerPort: number;
    authFullName: string;
    githubSourceActionInfo?: GitHubSourceActionInfo;
    deploymentMechanism: string;
    deploymentBucket: string;
};

export class EcsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: EcsStackProps) {
        super(scope, id);

        const {
            apiName,
            containerPort,
            authFullName,
            deploymentMechanism,
            githubSourceActionInfo,
            deploymentBucket
        } = props;

        // Unused, needed for now
        new cdk.CfnParameter(this, 'env', {
            type: 'String'
        });

        const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', { type: 'String' });

        // TODO: use some sort of constant like NETWORK_STACK_LOGICAL_ID for 'NetworkStack'
        const paramVpcId = new cdk.CfnParameter(this, 'NetworkStackVpcId', {
            type: 'String'
        });

        const paramSubnetIds = new cdk.CfnParameter(this, 'NetworkStackSubnetIds', {
            type: 'CommaDelimitedList'
        });

        const paramClusterName = new cdk.CfnParameter(this, 'NetworkStackClusterName', {
            type: 'String'
        });

        const paramAuthFullName = new cdk.CfnParameter(this, authFullName, {
            type: 'String'
        });

        const vpcId = paramVpcId.valueAsString;
        const subnets = paramSubnetIds.valueAsList;

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

        // Needed because the image will be pulled from ecr repository later
        repository.grantPull(task.obtainExecutionRole());

        const container = task.addContainer(`Container${apiName}`, {
            image: ecs.ContainerImage.fromRegistry('alpine')
        });

        container.addPortMappings({
            containerPort,
            protocol: ecs.Protocol.TCP,
        });

        // TODO: WAF

        const loadBalancerSG = new ec2.CfnSecurityGroup(this, "LoadBalancerSG", {
            vpcId,
            groupDescription: 'Allow access from the internet',
            securityGroupIngress: [{
                ipProtocol: 'tcp',
                fromPort: 80,
                toPort: 80,
                cidrIp: '0.0.0.0/0',
            }]
        });
        const loadBalancer = new elb.CfnLoadBalancer(this, 'LoadBalancer', {
            type: 'application',
            subnets: subnets,
            securityGroups: [loadBalancerSG.attrGroupId]
        });

        const targetGroup = new elb.CfnTargetGroup(this, "TargetGroup", {
            vpcId,
            targetType: 'ip',
            protocol: 'HTTP',
            port: containerPort,
        });

        const listener = new elb.CfnListener(this, "Listener", {
            defaultActions: [{
                type: 'forward',
                targetGroupArn: cdk.Fn.ref(targetGroup.logicalId),
            }],
            loadBalancerArn: cdk.Fn.ref(loadBalancer.logicalId),
            port: 80, // TODO: SSL - 443?
            protocol: 'HTTP',
            // certificates // TODO: SSL?
        });

        const serviceSecurityGroup = new ec2.CfnSecurityGroup(this, "ServiceSG", {
            vpcId,
            groupDescription: 'Service SecurityGroup',
            securityGroupEgress: [{
                description: "Allow all outbound traffic by default",
                cidrIp: '0.0.0.0/0',
                ipProtocol: '-1',
            }],
            securityGroupIngress: [{
                ipProtocol: 'tcp',
                fromPort: containerPort,
                toPort: containerPort,
                sourceSecurityGroupId: loadBalancerSG.attrGroupId,
            }]
        });

        const service = new ecs.CfnService(this, "Service", {
            serviceName: `${apiName}Service`,
            cluster: paramClusterName.valueAsString,
            launchType: 'FARGATE',
            desiredCount: subnets.length, // TODO: check this assumption
            loadBalancers: [{
                containerName: container.containerName, // TODO: Why this? defined in function
                containerPort,
                targetGroupArn: cdk.Fn.ref(targetGroup.logicalId),
            }],
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: 'ENABLED',
                    securityGroups: [serviceSecurityGroup.attrGroupId],
                    subnets,
                }
            },
            taskDefinition: task.taskDefinitionArn,
        });
        service.addDependsOn(listener);

        // Pipeline with awaiter

        const pipeline = new PipelineWithAwaiter(this, 'ApiPipeline', {
            container,
            repository,
            service,
            bucket: s3.Bucket.fromBucketName(this, 'Bucket', deploymentBucket),
            s3SourceActionKey: paramZipPath.valueAsString,
            githubSourceActionInfo
        })

        pipeline.node.addDependency(service);

        const api = new apigw.CfnRestApi(this, "Api", {
            name: apiName
        });

        // TODO: cloudwatch role for api

        const optionsMethod = new apigw.CfnMethod(this, "OptionsMethod", {
            httpMethod: 'OPTIONS',
            resourceId: api.attrRootResourceId,
            restApiId: cdk.Fn.ref(api.logicalId),
            authorizationType: 'NONE',
            integration: {
                type: 'MOCK',
                integrationResponses: [{
                    statusCode: "204",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                        "method.response.header.Access-Control-Allow-Origin": "'*'",
                        "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'"
                    }
                }],
                requestTemplates: {
                    "application/json": "{ statusCode: 200 }"
                }
            },
            methodResponses: [{
                statusCode: "204",
                responseParameters: {
                    "method.response.header.Access-Control-Allow-Headers": true,
                    "method.response.header.Access-Control-Allow-Origin": true,
                    "method.response.header.Access-Control-Allow-Methods": true,
                }
            }]
        });

        const authorizer = new apigw.CfnAuthorizer(this, "Authorizer", {
            restApiId: cdk.Fn.ref(api.logicalId),
            type: 'COGNITO_USER_POOLS',
            identitySource: "method.request.header.Authorization",
            name: 'DefaultAuthorizer',
            providerArns: [cdk.Fn.join('', [
                'arn:',
                cdk.Aws.PARTITION,
                ":cognito-idp:",
                cdk.Aws.REGION,
                ':',
                cdk.Aws.ACCOUNT_ID,
                ":userpool/",
                paramAuthFullName.valueAsString
            ])]
        });

        const anyMethod = new apigw.CfnMethod(this, "AnyMethod", {
            httpMethod: 'ANY',
            resourceId: api.attrRootResourceId,
            restApiId: cdk.Fn.ref(api.logicalId),
            authorizationScopes: ["aws.cognito.signin.user.admin"],
            authorizationType: 'COGNITO_USER_POOLS',
            authorizerId: cdk.Fn.ref(authorizer.logicalId),
            integration: {
                integrationHttpMethod: 'ANY',
                type: 'HTTP_PROXY',
                uri: cdk.Fn.join(':', [
                    cdk.Fn.join('', [
                        'http://',
                        loadBalancer.attrDnsName // TODO: Only NLB!!! :(
                    ]),
                    `80`,
                ])
            }
        });

        const deployment = new apigw.CfnDeployment(this, "Deployment", {
            restApiId: cdk.Fn.ref(api.logicalId),
        });
        deployment.addDependsOn(optionsMethod);
        deployment.addDependsOn(anyMethod);

        const stage = new apigw.CfnStage(this, "Stage", {
            restApiId: cdk.Fn.ref(api.logicalId),
            stageName: 'prod', // TODO: check if this should be env param
            deploymentId: cdk.Fn.ref(deployment.logicalId),
        });

        new cdk.CfnOutput(this, "ServiceArn", {
            value: cdk.Fn.ref(service.logicalId)
        });
        new cdk.CfnOutput(this, "ApiName", {
            value: apiName
        });
        new cdk.CfnOutput(this, "RootUrl", {
            value: cdk.Fn.join('', [
                "https://",
                cdk.Fn.ref(api.logicalId),
                ".execute-api.",
                cdk.Aws.REGION,
                ".",
                cdk.Aws.URL_SUFFIX,
                "/",
                cdk.Fn.ref(stage.logicalId),
                "/"
            ])
        });
    }
}
