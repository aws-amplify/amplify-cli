import * as iam from '@aws-cdk/aws-iam';
import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as s3 from '@aws-cdk/aws-s3';
import * as logs from '@aws-cdk/aws-logs';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { GitHubSourceActionInfo, PipelineWithAwaiter } from './PipelineWithAwaiter';
import Container from './docker-compose/ecs-objects/Container';
import { Duration } from '@aws-cdk/core';
import { NETWORK_STACK_LOGICAL_ID } from '../../category-constants';

export enum DEPLOYMENT_MECHANISM {
  /**
   * on every amplify push
   */
  FULLY_MANAGED = 'FULLY_MANAGED',
  /**
   * on every github push
   */
  INDENPENDENTLY_MANAGED = 'INDENPENDENTLY_MANAGED',
  /**
   * manually push by the customer to ECR
   */
  SELF_MANAGED = 'SELF_MANAGED',
}

type EcsStackProps = {
  envName: string;
  categoryName: string;
  apiName: string;
  taskPorts: number[];
  dependsOn: {
    category: string;
    resourceName: string;
    attributes: string[];
  }[];
  taskEnvironmentVariables?: Record<string, any>;
  githubSourceActionInfo?: GitHubSourceActionInfo;
  deploymentMechanism: DEPLOYMENT_MECHANISM;
  deploymentBucket: string;
  containers: Container[];
  isInitialDeploy: boolean;
  desiredCount: number;
  policies?: iam.PolicyStatement[];
};

export class EcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    const {
      envName,
      categoryName,
      apiName,
      taskPorts,
      dependsOn,
      deploymentMechanism,
      githubSourceActionInfo,
      deploymentBucket,
      containers,
      isInitialDeploy,
      desiredCount,
      policies = [],
      taskEnvironmentVariables = {},
    } = props;

    // Unused, needed for now
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
    });

    const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', {
      type: 'String',
      // Required only for FULLY_MANAGED
      default: deploymentMechanism === DEPLOYMENT_MECHANISM.FULLY_MANAGED ? undefined : '',
    });

    const parameters: Map<string, cdk.CfnParameter> = new Map();

    const authParams: {
      UserPoolId?: cdk.CfnParameter;
      AppClientIDWeb?: cdk.CfnParameter;
    } = {};

    const paramTypes: Record<string, string> = {
      NetworkStackSubnetIds: 'CommaDelimitedList',
    };

    dependsOn.forEach(({ category, resourceName, attributes }) => {
      attributes.forEach(attrib => {
        const paramName = [category, resourceName, attrib].join('');

        const type = paramTypes[paramName] ?? 'String';
        const param = new cdk.CfnParameter(this, paramName, { type });

        parameters.set(paramName, param);

        if (category === 'auth') {
          authParams[attrib as keyof typeof authParams] = param;
        }
      });
    });

    const paramVpcId = parameters.get(`${NETWORK_STACK_LOGICAL_ID}VpcId`);
    const paramVpcCidrBlock = parameters.get(`${NETWORK_STACK_LOGICAL_ID}VpcCidrBlock`);
    const paramSubnetIds = parameters.get(`${NETWORK_STACK_LOGICAL_ID}SubnetIds`);
    const paramClusterName = parameters.get(`${NETWORK_STACK_LOGICAL_ID}ClusterName`);
    const paramVpcLinkId = parameters.get(`${NETWORK_STACK_LOGICAL_ID}VpcLinkId`);
    const paramCloudMapNamespaceId = parameters.get(`${NETWORK_STACK_LOGICAL_ID}CloudMapNamespaceId`);

    const { UserPoolId: paramUserPoolId, AppClientIDWeb: paramAppClientIdWeb } = authParams;

    const isUnAuthCondition = new cdk.CfnCondition(this, 'cosaCondition', {
      expression: cdk.Fn.conditionAnd(
        cdk.Fn.conditionEquals(authParams.UserPoolId ?? '', ''),
        cdk.Fn.conditionEquals(authParams.AppClientIDWeb ?? '', ''),
      ),
    });

    const isAuthCondition = new cdk.CfnCondition(this, 'notCosaCondition', {
      expression: cdk.Fn.conditionNot(isUnAuthCondition),
    });

    const vpcId = paramVpcId.valueAsString;
    const subnets = paramSubnetIds.valueAsList;

    //#region CloudMap
    const cloudmapService = new cloudmap.CfnService(this, 'CloudmapService', {
      name: apiName,
      dnsConfig: {
        dnsRecords: [
          {
            ttl: 60,
            type: cloudmap.DnsRecordType.SRV,
          },
        ],
        namespaceId: paramCloudMapNamespaceId.valueAsString,
        routingPolicy: cloudmap.RoutingPolicy.MULTIVALUE,
      },
    });
    //#endregion

    //#region ECS
    // Task (role, definition, execution role, policy)
    const task = new ecs.TaskDefinition(this, 'TaskDefinition', {
      compatibility: ecs.Compatibility.FARGATE,
      memoryMiB: '1024',
      cpu: '512',
      family: apiName,
    });
    (task.node.defaultChild as ecs.CfnTaskDefinition).overrideLogicalId('TaskDefinition');
    policies.forEach(policy => {
      task.addToTaskRolePolicy(policy);
    });

    const serviceRegistries: ecs.CfnService.ServiceRegistryProperty[] = [];

    const containersInfo: {
      container: ecs.ContainerDefinition;
      repository: ecr.Repository;
    }[] = [];

    containers.forEach(
      ({
        name,
        image,
        build,
        portMappings,
        logConfiguration,
        environment,
        entrypoint: entryPoint,
        command,
        working_dir: workingDirectory,
        healthcheck: healthCheck,
      }) => {
        const logGroup = new logs.LogGroup(this, `${name}ContainerLogGroup`, {
          logGroupName: `/ecs/${envName}-${apiName}-${name}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const {
          logDriver,
          options: {
            'awslogs-stream-prefix': streamPrefix,
            // "awslogs-group": logGroup,
            // awslogs-region intentionally ignored since it will use the stack's region by default
          } = {},
        } = logConfiguration;

        const logging: ecs.LogDriver =
          logDriver === 'awslogs'
            ? ecs.LogDriver.awsLogs({
                streamPrefix,
                logGroup: logs.LogGroup.fromLogGroupName(this, `${name}logGroup`, logGroup.logGroupName),
              })
            : undefined;

        let repository: ecr.Repository;
        if (build) {
          const logicalId = `${name}Repository`;

          repository = new ecr.Repository(this, logicalId, {
            repositoryName: `${envName}-${categoryName}-${apiName}-${name}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: ????
            lifecycleRules: [
              {
                maxImageAge: Duration.days(7),
              },
            ],
          });
          (repository.node.defaultChild as ecr.CfnRepository).overrideLogicalId(logicalId);

          // Needed because the image will be pulled from ecr repository later
          repository.grantPull(task.obtainExecutionRole());
        }

        const container = task.addContainer(name, {
          image: repository ? ecs.ContainerImage.fromEcrRepository(repository) : ecs.ContainerImage.fromRegistry(image),
          logging,
          environment: {
            ...taskEnvironmentVariables,
            ...environment,
          },
          entryPoint,
          command,
          workingDirectory,
          healthCheck: healthCheck && {
            command: healthCheck.command,
            interval: cdk.Duration.seconds(healthCheck.interval ?? 30),
            retries: healthCheck.retries,
            timeout: cdk.Duration.seconds(healthCheck.timeout ?? 5),
            startPeriod: cdk.Duration.seconds(healthCheck.start_period ?? 0),
          },
        });

        if (build) {
          containersInfo.push({
            container,
            repository,
          });
        }

        // TODO: should we use hostPort too? check network mode
        portMappings?.forEach(({ containerPort, protocol, hostPort }) => {
          container.addPortMappings({
            containerPort,
            protocol: ecs.Protocol.TCP,
          });

          serviceRegistries.push({
            containerName: container.containerName,
            containerPort,
            registryArn: cloudmapService.attrArn,
          });
        });
      },
    );

    const serviceSecurityGroup = new ec2.CfnSecurityGroup(this, 'ServiceSG', {
      vpcId,
      groupDescription: 'Service SecurityGroup',
      securityGroupEgress: [
        {
          description: 'Allow all outbound traffic by default',
          cidrIp: '0.0.0.0/0',
          ipProtocol: '-1',
        },
      ],
      securityGroupIngress: taskPorts.map(servicePort => ({
        ipProtocol: 'tcp',
        fromPort: servicePort,
        toPort: servicePort,
        cidrIp: paramVpcCidrBlock.valueAsString,
      })),
    });

    const service = new ecs.CfnService(this, 'Service', {
      serviceName: `${apiName}-service`,
      cluster: paramClusterName.valueAsString,
      launchType: 'FARGATE',
      desiredCount: isInitialDeploy ? 0 : desiredCount, // This is later adjusted by the PreDeploy action in the codepipeline
      serviceRegistries,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'ENABLED',
          securityGroups: [serviceSecurityGroup.attrGroupId],
          subnets,
        },
      },
      taskDefinition: task.taskDefinitionArn,
    });
    //#endregion

    //#region Pipeline with awaiter

    const pipeline = new PipelineWithAwaiter(this, 'ApiPipeline', {
      containersInfo,
      service,
      bucket: s3.Bucket.fromBucketName(this, 'Bucket', deploymentBucket),
      s3SourceActionKey: paramZipPath.valueAsString,
      deploymentMechanism,
      githubSourceActionInfo,
      desiredCount,
    });

    pipeline.node.addDependency(service);
    //#endregion

    //#region Api Gateway
    const api = new apigw2.CfnApi(this, 'Api', {
      name: apiName,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: Object.values(apigw2.HttpMethod).filter(m => m !== apigw2.HttpMethod.ANY),
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
        audience: [paramAppClientIdWeb && paramAppClientIdWeb.valueAsString],
        issuer: cdk.Fn.join('', [
          'https://cognito-idp.',
          cdk.Aws.REGION,
          '.amazonaws.com/',
          paramUserPoolId && paramUserPoolId.valueAsString,
        ]),
      },
      identitySource: ['$request.header.Authorization'],
    });

    authorizer.cfnOptions.condition = isAuthCondition;

    const routeWithAuth = new apigw2.CfnRoute(this, 'DefaultRouteWithAuth', {
      apiId: cdk.Fn.ref(api.logicalId),
      routeKey: '$default',
      target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
      authorizationScopes: [], // TODO: ask them?
      authorizationType: 'JWT',
      authorizerId: cdk.Fn.ref(authorizer.logicalId),
    });

    routeWithAuth.cfnOptions.condition = isAuthCondition;

    const routeWithoutAuth = new apigw2.CfnRoute(this, 'DefaultRouteNoAuth', {
      apiId: cdk.Fn.ref(api.logicalId),
      routeKey: '$default',
      target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
    });

    routeWithoutAuth.cfnOptions.condition = isUnAuthCondition;

    new apigw2.CfnRoute(this, 'OptionsRoute', {
      apiId: cdk.Fn.ref(api.logicalId),
      routeKey: 'OPTIONS /{proxy+}',
      target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
    });

    //#endregion

    new cdk.CfnOutput(this, 'ServiceArn', { value: cdk.Fn.ref(service.logicalId) });
    new cdk.CfnOutput(this, 'ApiName', { value: api.name });
    new cdk.CfnOutput(this, 'RootUrl', { value: api.attrApiEndpoint });
  }
}
