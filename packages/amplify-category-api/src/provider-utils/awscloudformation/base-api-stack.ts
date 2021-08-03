import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import * as ssm from '@aws-cdk/aws-secretsmanager';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { NETWORK_STACK_LOGICAL_ID } from '../../category-constants';
import Container from './docker-compose/ecs-objects/container';
import { GitHubSourceActionInfo, PipelineWithAwaiter } from './pipeline-with-awaiter';

const PIPELINE_AWAITER_ZIP = 'custom-resource-pipeline-awaiter.zip';

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

export type ContainersStackProps = Readonly<{
  skipWait?: boolean;
  envName: string;
  categoryName: string;
  apiName: string;
  deploymentBucketName: string;
  dependsOn: ReadonlyArray<{
    category: string;
    resourceName: string;
    attributes: string[];
  }>;
  taskEnvironmentVariables?: Record<string, any>;
  deploymentMechanism: DEPLOYMENT_MECHANISM;
  restrictAccess: boolean;
  policies?: ReadonlyArray<iam.PolicyStatement | Record<string, any>>;
  containers: ReadonlyArray<Container>;
  secretsArns?: ReadonlyMap<string, string>;
  exposedContainer: { name: string; port: number };
  taskPorts: number[];
  isInitialDeploy: boolean;
  desiredCount: number;
  createCloudMapService?: boolean;
  gitHubSourceActionInfo?: GitHubSourceActionInfo;
  existingEcrRepositories: Set<string>;
}>;
export abstract class ContainersStack extends cdk.Stack {
  protected readonly vpcId: string;
  private readonly vpcCidrBlock: string;
  protected readonly subnets: ReadonlyArray<string>;
  private readonly clusterName: string;
  private readonly zipPath: string;
  private readonly cloudMapNamespaceId: string;
  protected readonly vpcLinkId: string;
  private readonly pipelineWithAwaiter: PipelineWithAwaiter;
  protected readonly cloudMapService: cloudmap.CfnService | undefined;
  protected readonly ecsService: ecs.CfnService;
  protected readonly isAuthCondition: cdk.CfnCondition;
  protected readonly appClientId: string | undefined;
  protected readonly userPoolId: string | undefined;
  protected readonly ecsServiceSecurityGroup: ec2.CfnSecurityGroup;
  protected readonly parameters: ReadonlyMap<string, cdk.CfnParameter>;

  constructor(scope: cdk.Construct, id: string, private readonly props: ContainersStackProps) {
    super(scope, id);

    const {
      parameters,
      vpcId,
      vpcCidrBlock,
      subnets,
      clusterName,
      zipPath,
      cloudMapNamespaceId,
      vpcLinkId,
      isAuthCondition,
      appClientId,
      userPoolId,
    } = this.init();

    this.parameters = parameters;

    this.vpcId = vpcId;
    this.vpcCidrBlock = vpcCidrBlock;
    this.subnets = subnets;
    this.clusterName = clusterName;
    this.zipPath = zipPath;
    this.cloudMapNamespaceId = cloudMapNamespaceId;
    this.vpcLinkId = vpcLinkId;
    this.isAuthCondition = isAuthCondition;
    this.appClientId = appClientId;
    this.userPoolId = userPoolId;

    const { service, serviceSecurityGroup, containersInfo, cloudMapService } = this.ecs();

    this.cloudMapService = cloudMapService;
    this.ecsService = service;
    this.ecsServiceSecurityGroup = serviceSecurityGroup;

    const { gitHubSourceActionInfo, skipWait } = this.props;

    const { pipelineWithAwaiter } = this.pipeline({
      skipWait,
      service,
      containersInfo,
      gitHubSourceActionInfo,
    });

    this.pipelineWithAwaiter = pipelineWithAwaiter;

    new cdk.CfnOutput(this, 'ContainerNames', {
      value: cdk.Fn.join(
        ',',
        containersInfo.map(({ container: { containerName } }) => containerName),
      ),
    });
  }

  private init() {
    const { restrictAccess, dependsOn, deploymentMechanism } = this.props;

    // Unused in this stack, but required by the root stack
    new cdk.CfnParameter(this, 'env', { type: 'String' });

    const paramDomain = new cdk.CfnParameter(this, 'domain', { type: 'String' });
    const paramRestrictAccess = new cdk.CfnParameter(this, 'restrictAccess', {
      type: 'String',
      allowedValues: ['true', 'false'],
    });

    const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', {
      type: 'String',
      // Required only for FULLY_MANAGED
      default: deploymentMechanism === DEPLOYMENT_MECHANISM.FULLY_MANAGED ? undefined : '',
    });

    const parameters: Map<string, cdk.CfnParameter> = new Map();

    parameters.set('ParamZipPath', paramZipPath);
    parameters.set('domain', paramDomain);
    parameters.set('restrictAccess', paramRestrictAccess);

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
    const paramCloudMapNamespaceId = parameters.get(`${NETWORK_STACK_LOGICAL_ID}CloudMapNamespaceId`);
    const paramVpcLinkId = parameters.get(`${NETWORK_STACK_LOGICAL_ID}VpcLinkId`);

    const { UserPoolId: paramUserPoolId, AppClientIDWeb: paramAppClientIdWeb } = authParams;

    const isAuthCondition = new cdk.CfnCondition(this, 'isAuthCondition', {
      expression: cdk.Fn.conditionAnd(
        cdk.Fn.conditionEquals(restrictAccess, true),
        cdk.Fn.conditionNot(cdk.Fn.conditionEquals(paramUserPoolId ?? '', '')),
        cdk.Fn.conditionNot(cdk.Fn.conditionEquals(paramAppClientIdWeb ?? '', '')),
      ),
    });

    return {
      parameters,
      vpcId: paramVpcId.valueAsString,
      vpcCidrBlock: paramVpcCidrBlock.valueAsString,
      subnets: paramSubnetIds.valueAsList,
      clusterName: paramClusterName.valueAsString,
      zipPath: paramZipPath.valueAsString,
      cloudMapNamespaceId: paramCloudMapNamespaceId.valueAsString,
      vpcLinkId: paramVpcLinkId.valueAsString,
      isAuthCondition,
      userPoolId: paramUserPoolId && paramUserPoolId.valueAsString,
      appClientId: paramAppClientIdWeb && paramAppClientIdWeb.valueAsString,
    };
  }

  private ecs() {
    const {
      envName,
      categoryName,
      apiName,
      policies,
      containers,
      secretsArns,
      taskEnvironmentVariables,
      exposedContainer,
      taskPorts,
      isInitialDeploy,
      desiredCount,
      createCloudMapService,
    } = this.props;

    let cloudMapService: cloudmap.CfnService = undefined;

    if (createCloudMapService) {
      cloudMapService = new cloudmap.CfnService(this, 'CloudmapService', {
        name: apiName,
        dnsConfig: {
          dnsRecords: [
            {
              ttl: 60,
              type: cloudmap.DnsRecordType.SRV,
            },
          ],
          namespaceId: this.cloudMapNamespaceId,
          routingPolicy: cloudmap.RoutingPolicy.MULTIVALUE,
        },
      });
    }

    const task = new ecs.TaskDefinition(this, 'TaskDefinition', {
      compatibility: ecs.Compatibility.FARGATE,
      memoryMiB: '1024',
      cpu: '512',
      family: `${envName}-${apiName}`,
    });
    (task.node.defaultChild as ecs.CfnTaskDefinition).overrideLogicalId('TaskDefinition');
    policies.forEach(policy => {
      const statement = isPolicyStatement(policy) ? policy : wrapJsonPoliciesInCdkPolicies(policy);

      task.addToTaskRolePolicy(statement);
    });

    const containersInfo: {
      container: ecs.ContainerDefinition;
      repository: ecr.IRepository;
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
        secrets: containerSecrets,
      }) => {
        const logGroup = new logs.LogGroup(this, `${name}ContainerLogGroup`, {
          logGroupName: `/ecs/${envName}-${apiName}-${name}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const { logDriver, options: { 'awslogs-stream-prefix': streamPrefix } = {} } = logConfiguration;

        const logging: ecs.LogDriver =
          logDriver === 'awslogs'
            ? ecs.LogDriver.awsLogs({
                streamPrefix,
                logGroup: logs.LogGroup.fromLogGroupName(this, `${name}logGroup`, logGroup.logGroupName),
              })
            : undefined;

        let repository: ecr.IRepository;
        if (build) {
          const logicalId = `${name}Repository`;

          const repositoryName = `${envName}-${categoryName}-${apiName}-${name}`;

          if (this.props.existingEcrRepositories.has(repositoryName)) {
            repository = ecr.Repository.fromRepositoryName(this, logicalId, repositoryName);
          } else {
            repository = new ecr.Repository(this, logicalId, {
              repositoryName: `${envName}-${categoryName}-${apiName}-${name}`,
              removalPolicy: cdk.RemovalPolicy.RETAIN,
              lifecycleRules: [
                {
                  rulePriority: 10,
                  maxImageCount: 1,
                  tagPrefixList: ['latest'],
                  tagStatus: ecr.TagStatus.TAGGED,
                },
                {
                  rulePriority: 100,
                  maxImageAge: cdk.Duration.days(7),
                  tagStatus: ecr.TagStatus.ANY,
                },
              ],
            });
            (repository.node.defaultChild as ecr.CfnRepository).overrideLogicalId(logicalId);
          }

          // Needed because the image will be pulled from ecr repository later
          repository.grantPull(task.obtainExecutionRole());
        }

        const secrets: ecs.ContainerDefinitionOptions['secrets'] = {};
        const environmentWithoutSecrets = environment || {};

        containerSecrets.forEach((s, i) => {
          if (secretsArns.has(s)) {
            secrets[s] = ecs.Secret.fromSecretsManager(ssm.Secret.fromSecretCompleteArn(this, `${name}secret${i + 1}`, secretsArns.get(s)));
          }

          delete environmentWithoutSecrets[s];
        });

        const container = task.addContainer(name, {
          image: repository ? ecs.ContainerImage.fromEcrRepository(repository) : ecs.ContainerImage.fromRegistry(image),
          logging,
          environment: {
            ...taskEnvironmentVariables,
            ...environmentWithoutSecrets,
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
          secrets,
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
        });
      },
    );

    const serviceSecurityGroup = new ec2.CfnSecurityGroup(this, 'ServiceSG', {
      vpcId: this.vpcId,
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
        cidrIp: this.vpcCidrBlock,
      })),
    });

    let serviceRegistries: ecs.CfnService.ServiceRegistryProperty[] = undefined;

    if (cloudMapService) {
      serviceRegistries = [
        {
          containerName: exposedContainer.name,
          containerPort: exposedContainer.port,
          registryArn: cloudMapService.attrArn,
        },
      ];
    }

    const service = new ecs.CfnService(this, 'Service', {
      serviceName: `${apiName}-service-${exposedContainer.name}-${exposedContainer.port}`,
      cluster: this.clusterName,
      launchType: 'FARGATE',
      desiredCount: isInitialDeploy ? 0 : desiredCount, // This is later adjusted by the Predeploy action in the codepipeline
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'ENABLED',
          securityGroups: [serviceSecurityGroup.attrGroupId],
          subnets: <string[]>this.subnets,
        },
      },
      taskDefinition: task.taskDefinitionArn,
      serviceRegistries,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.serviceName,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.clusterName,
    });

    return {
      service,
      serviceSecurityGroup,
      containersInfo,
      cloudMapService,
    };
  }

  private pipeline({
    skipWait = false,
    service,
    containersInfo,
    gitHubSourceActionInfo,
  }: {
    skipWait?: boolean;
    service: ecs.CfnService;
    containersInfo: {
      container: ecs.ContainerDefinition;
      repository: ecr.IRepository;
    }[];
    gitHubSourceActionInfo?: GitHubSourceActionInfo;
  }) {
    const { envName, deploymentBucketName, deploymentMechanism, desiredCount } = this.props;

    const s3SourceActionKey = this.zipPath;

    const bucket = s3.Bucket.fromBucketName(this, 'Bucket', deploymentBucketName);

    const pipelineWithAwaiter = new PipelineWithAwaiter(this, 'ApiPipeline', {
      skipWait,
      envName,
      containersInfo,
      service,
      bucket,
      s3SourceActionKey,
      deploymentMechanism,
      gitHubSourceActionInfo,
      desiredCount,
    });

    pipelineWithAwaiter.node.addDependency(service);

    return { pipelineWithAwaiter };
  }

  protected getPipelineName() {
    return this.pipelineWithAwaiter.getPipelineName();
  }

  getPipelineConsoleUrl(region: string) {
    const pipelineName = this.getPipelineName();
    return `https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineName}/view`;
  }

  toCloudFormation() {
    prepareApp(this);

    const cfn = this._toCloudFormation();

    Object.keys(cfn.Parameters).forEach(k => {
      if (k.startsWith('AssetParameters')) {
        let value = '';

        if (k.includes('Bucket')) {
          value = this.props.deploymentBucketName;
        } else if (k.includes('VersionKey')) {
          value = `${PIPELINE_AWAITER_ZIP}||`;
        }

        cfn.Parameters[k].Default = value;
      }
    });

    return cfn;
  }
}

/**
 * Wraps an array of JSON IAM statements in a {iam.PolicyStatement} array.
 * This allow us tu pass the statements in a way that CDK can use when synthesizing
 *
 * CDK looks for a toStatementJson function
 *
 * @param policy JSON object with IAM statements
 * @returns {iam.PolicyStatement} CDK compatible policy statement
 */
function wrapJsonPoliciesInCdkPolicies(policy: Record<string, any>): iam.PolicyStatement {
  return {
    toStatementJson() {
      return policy;
    },
  } as iam.PolicyStatement;
}

function isPolicyStatement(obj: any): obj is iam.PolicyStatement {
  if (obj && typeof (<iam.PolicyStatement>obj).toStatementJson === 'function') {
    return true;
  }

  return false;
}
