import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { GitHubSourceActionInfo, PipelineWithAwaiter } from './PipelineWithAwaiter';

type EcsStackProps = {
    apiName: string;
    containerPort: number;
    authUserPoolIdParamName: string;
    authAppClientIdWebParamName: string;
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
            authUserPoolIdParamName,
            authAppClientIdWebParamName,
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

        const paramVpcLinkId = new cdk.CfnParameter(this, 'NetworkStackVpcLinkId', {
            type: 'String'
        });

        const paramCloudMapNamespaceId = new cdk.CfnParameter(this, 'NetworkStackCloudMapNamespaceId', {
            type: 'String'
        });

        const paramUserPoolId = new cdk.CfnParameter(this, authUserPoolIdParamName, {
            type: 'String'
        });

        const paramAppClientIdWeb = new cdk.CfnParameter(this, authAppClientIdWebParamName, {
            type: 'String'
        });

        const vpcId = paramVpcId.valueAsString;
        const subnets = paramSubnetIds.valueAsList;

        //#region CloudMap
        const cloudmapService = new cloudmap.CfnService(this, "CloudmapService", {
            name: apiName,
            dnsConfig: {
                dnsRecords: [{
                    ttl: 60,
                    type: cloudmap.DnsRecordType.SRV,
                }],
                namespaceId: paramCloudMapNamespaceId.valueAsString,
                routingPolicy: cloudmap.RoutingPolicy.MULTIVALUE,
            }
        });
        //#endregion

        //#region ECS
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
                cidrIp: '0.0.0.0/0', // TODO: Restrict to vpc subnets
            }]
        });
        const service = new ecs.CfnService(this, "Service", {
            serviceName: `${apiName}Service`,
            cluster: paramClusterName.valueAsString,
            launchType: 'FARGATE',
            desiredCount: subnets.length, // TODO: check this assumption
            serviceRegistries: [{
                containerName: container.containerName,
                containerPort,
                registryArn: cloudmapService.attrArn,
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
        //#endregion

        //#region Pipeline with awaiter
        const pipeline = new PipelineWithAwaiter(this, 'ApiPipeline', {
            container,
            repository,
            service,
            bucket: s3.Bucket.fromBucketName(this, 'Bucket', deploymentBucket),
            s3SourceActionKey: paramZipPath.valueAsString,
            githubSourceActionInfo
        })

        pipeline.node.addDependency(service);
        //#endregion

        //#region Api Gateway
        const api = new apigw2.CfnApi(this, "Api", {
            name: apiName,
            protocolType: 'HTTP',
            corsConfiguration: {
                allowHeaders: ["*"],
                allowOrigins: ["*"],
                allowMethods: Object.values(apigw2.HttpMethod).filter(
                    (m) => m !== apigw2.HttpMethod.ANY
                ),
            },
        });

        new apigw2.CfnStage(this, 'Stage', {
            apiId: cdk.Fn.ref(api.logicalId),
            stageName: '$default',
            autoDeploy: true,
        });

        const integration = new apigw2.CfnIntegration(this, 'ANYIntegration', {
            apiId: cdk.Fn.ref(api.logicalId),
            integrationType: apigw2.HttpIntegrationType.HTTP_PROXY,
            connectionId: paramVpcLinkId.valueAsString,
            connectionType: apigw2.HttpConnectionType.VPC_LINK,
            integrationMethod: 'ANY',
            integrationUri: cloudmapService.attrArn,
            payloadFormatVersion: '1.0',
        });

        const authorizer = new apigw2.CfnAuthorizer(this, 'Authorizer', {
            name: `${apiName}Authorizer`,
            apiId: cdk.Fn.ref(api.logicalId),
            authorizerType: 'JWT',
            jwtConfiguration: {
                audience: [paramAppClientIdWeb.valueAsString],
                issuer: cdk.Fn.join('', [
                    'https://cognito-idp.',
                    cdk.Aws.REGION,
                    '.amazonaws.com/',
                    paramUserPoolId.valueAsString
                ])
            },
            identitySource: ['$request.header.Authorization'],
        });

        new apigw2.CfnRoute(this, 'DefaultRoute', {
            apiId: cdk.Fn.ref(api.logicalId),
            routeKey: '$default',
            target: cdk.Fn.join('', [
                'integrations/',
                cdk.Fn.ref(integration.logicalId),
            ]),
            authorizationScopes: [], // TODO: ask them?
            authorizationType: 'JWT',
            authorizerId: cdk.Fn.ref(authorizer.logicalId)
        });

        new apigw2.CfnRoute(this, 'OptionsRoute', {
            apiId: cdk.Fn.ref(api.logicalId),
            routeKey: 'OPTIONS /{proxy+}',
            target: cdk.Fn.join('', [
                'integrations/',
                cdk.Fn.ref(integration.logicalId),
            ]),
        });

        //#endregion

        new cdk.CfnOutput(this, "ServiceArn", { value: cdk.Fn.ref(service.logicalId) });
        new cdk.CfnOutput(this, "ApiName", { value: api.name });
        new cdk.CfnOutput(this, "RootUrl", { value: api.attrApiEndpoint });
    }
}
