export declare const ElasticBeanstalk: {
    ConfigurationTemplate: typeof ElasticBeanstalkConfigurationTemplate;
    Application: typeof ElasticBeanstalkApplication;
    Environment: typeof ElasticBeanstalkEnvironment;
    ApplicationVersion: typeof ElasticBeanstalkApplicationVersion;
};
import ElasticBeanstalkConfigurationTemplate from './elasticBeanstalk/configurationTemplate';
import ElasticBeanstalkApplication from './elasticBeanstalk/application';
import ElasticBeanstalkEnvironment from './elasticBeanstalk/environment';
import ElasticBeanstalkApplicationVersion from './elasticBeanstalk/applicationVersion';
export declare const AppSync: {
    DataSource: typeof AppSyncDataSource;
    Resolver: typeof AppSyncResolver;
    GraphQLSchema: typeof AppSyncGraphQLSchema;
    GraphQLApi: typeof AppSyncGraphQLApi;
    ApiKey: typeof AppSyncApiKey;
};
import AppSyncDataSource from './appSync/dataSource';
import AppSyncResolver from './appSync/resolver';
import AppSyncGraphQLSchema from './appSync/graphQlSchema';
import AppSyncGraphQLApi from './appSync/graphQlApi';
import AppSyncApiKey from './appSync/apiKey';
export declare const EC2: {
    RouteTable: typeof EC2RouteTable;
    VPCPeeringConnection: typeof EC2VPCPeeringConnection;
    PlacementGroup: typeof EC2PlacementGroup;
    NetworkAclEntry: typeof EC2NetworkAclEntry;
    InternetGateway: typeof EC2InternetGateway;
    LaunchTemplate: typeof EC2LaunchTemplate;
    Volume: typeof EC2Volume;
    SpotFleet: typeof EC2SpotFleet;
    VPNConnectionRoute: typeof EC2VPNConnectionRoute;
    NetworkInterfacePermission: typeof EC2NetworkInterfacePermission;
    EIP: typeof EC2EIP;
    SecurityGroupIngress: typeof EC2SecurityGroupIngress;
    SubnetRouteTableAssociation: typeof EC2SubnetRouteTableAssociation;
    Route: typeof EC2Route;
    FlowLog: typeof EC2FlowLog;
    SecurityGroupEgress: typeof EC2SecurityGroupEgress;
    NetworkInterface: typeof EC2NetworkInterface;
    SubnetNetworkAclAssociation: typeof EC2SubnetNetworkAclAssociation;
    SubnetCidrBlock: typeof EC2SubnetCidrBlock;
    NatGateway: typeof EC2NatGateway;
    SecurityGroup: typeof EC2SecurityGroup;
    Subnet: typeof EC2Subnet;
    VPC: typeof EC2VPC;
    Instance: typeof EC2Instance;
    DHCPOptions: typeof EC2DHCPOptions;
    NetworkAcl: typeof EC2NetworkAcl;
    VPNGatewayRoutePropagation: typeof EC2VPNGatewayRoutePropagation;
    EgressOnlyInternetGateway: typeof EC2EgressOnlyInternetGateway;
    NetworkInterfaceAttachment: typeof EC2NetworkInterfaceAttachment;
    CustomerGateway: typeof EC2CustomerGateway;
    TrunkInterfaceAssociation: typeof EC2TrunkInterfaceAssociation;
    VolumeAttachment: typeof EC2VolumeAttachment;
    Host: typeof EC2Host;
    EIPAssociation: typeof EC2EIPAssociation;
    VPNGateway: typeof EC2VPNGateway;
    VPCEndpoint: typeof EC2VPCEndpoint;
    VPCGatewayAttachment: typeof EC2VPCGatewayAttachment;
    VPNConnection: typeof EC2VPNConnection;
    VPCCidrBlock: typeof EC2VPCCidrBlock;
    VPCDHCPOptionsAssociation: typeof EC2VPCDHCPOptionsAssociation;
};
import EC2RouteTable from './ec2/routeTable';
import EC2VPCPeeringConnection from './ec2/vpcPeeringConnection';
import EC2PlacementGroup from './ec2/placementGroup';
import EC2NetworkAclEntry from './ec2/networkAclEntry';
import EC2InternetGateway from './ec2/internetGateway';
import EC2LaunchTemplate from './ec2/launchTemplate';
import EC2Volume from './ec2/volume';
import EC2SpotFleet from './ec2/spotFleet';
import EC2VPNConnectionRoute from './ec2/vpnConnectionRoute';
import EC2NetworkInterfacePermission from './ec2/networkInterfacePermission';
import EC2EIP from './ec2/eip';
import EC2SecurityGroupIngress from './ec2/securityGroupIngress';
import EC2SubnetRouteTableAssociation from './ec2/subnetRouteTableAssociation';
import EC2Route from './ec2/route';
import EC2FlowLog from './ec2/flowLog';
import EC2SecurityGroupEgress from './ec2/securityGroupEgress';
import EC2NetworkInterface from './ec2/networkInterface';
import EC2SubnetNetworkAclAssociation from './ec2/subnetNetworkAclAssociation';
import EC2SubnetCidrBlock from './ec2/subnetCidrBlock';
import EC2NatGateway from './ec2/natGateway';
import EC2SecurityGroup from './ec2/securityGroup';
import EC2Subnet from './ec2/subnet';
import EC2VPC from './ec2/vpc';
import EC2Instance from './ec2/instance';
import EC2DHCPOptions from './ec2/dhcpOptions';
import EC2NetworkAcl from './ec2/networkAcl';
import EC2VPNGatewayRoutePropagation from './ec2/vpnGatewayRoutePropagation';
import EC2EgressOnlyInternetGateway from './ec2/egressOnlyInternetGateway';
import EC2NetworkInterfaceAttachment from './ec2/networkInterfaceAttachment';
import EC2CustomerGateway from './ec2/customerGateway';
import EC2TrunkInterfaceAssociation from './ec2/trunkInterfaceAssociation';
import EC2VolumeAttachment from './ec2/volumeAttachment';
import EC2Host from './ec2/host';
import EC2EIPAssociation from './ec2/eipAssociation';
import EC2VPNGateway from './ec2/vpnGateway';
import EC2VPCEndpoint from './ec2/vpcEndpoint';
import EC2VPCGatewayAttachment from './ec2/vpcGatewayAttachment';
import EC2VPNConnection from './ec2/vpnConnection';
import EC2VPCCidrBlock from './ec2/vpcCidrBlock';
import EC2VPCDHCPOptionsAssociation from './ec2/vpcdhcpOptionsAssociation';
export declare const ServiceCatalog: {
    PortfolioShare: typeof ServiceCatalogPortfolioShare;
    TagOptionAssociation: typeof ServiceCatalogTagOptionAssociation;
    LaunchTemplateConstraint: typeof ServiceCatalogLaunchTemplateConstraint;
    TagOption: typeof ServiceCatalogTagOption;
    PortfolioPrincipalAssociation: typeof ServiceCatalogPortfolioPrincipalAssociation;
    CloudFormationProvisionedProduct: typeof ServiceCatalogCloudFormationProvisionedProduct;
    LaunchRoleConstraint: typeof ServiceCatalogLaunchRoleConstraint;
    CloudFormationProduct: typeof ServiceCatalogCloudFormationProduct;
    PortfolioProductAssociation: typeof ServiceCatalogPortfolioProductAssociation;
    Portfolio: typeof ServiceCatalogPortfolio;
    AcceptedPortfolioShare: typeof ServiceCatalogAcceptedPortfolioShare;
    LaunchNotificationConstraint: typeof ServiceCatalogLaunchNotificationConstraint;
};
import ServiceCatalogPortfolioShare from './serviceCatalog/portfolioShare';
import ServiceCatalogTagOptionAssociation from './serviceCatalog/tagOptionAssociation';
import ServiceCatalogLaunchTemplateConstraint from './serviceCatalog/launchTemplateConstraint';
import ServiceCatalogTagOption from './serviceCatalog/tagOption';
import ServiceCatalogPortfolioPrincipalAssociation from './serviceCatalog/portfolioPrincipalAssociation';
import ServiceCatalogCloudFormationProvisionedProduct from './serviceCatalog/cloudFormationProvisionedProduct';
import ServiceCatalogLaunchRoleConstraint from './serviceCatalog/launchRoleConstraint';
import ServiceCatalogCloudFormationProduct from './serviceCatalog/cloudFormationProduct';
import ServiceCatalogPortfolioProductAssociation from './serviceCatalog/portfolioProductAssociation';
import ServiceCatalogPortfolio from './serviceCatalog/portfolio';
import ServiceCatalogAcceptedPortfolioShare from './serviceCatalog/acceptedPortfolioShare';
import ServiceCatalogLaunchNotificationConstraint from './serviceCatalog/launchNotificationConstraint';
export declare const Cognito: {
    IdentityPoolRoleAttachment: typeof CognitoIdentityPoolRoleAttachment;
    UserPoolGroup: typeof CognitoUserPoolGroup;
    IdentityPool: typeof CognitoIdentityPool;
    UserPoolUser: typeof CognitoUserPoolUser;
    UserPool: typeof CognitoUserPool;
    UserPoolClient: typeof CognitoUserPoolClient;
    UserPoolUserToGroupAttachment: typeof CognitoUserPoolUserToGroupAttachment;
};
import CognitoIdentityPoolRoleAttachment from './cognito/identityPoolRoleAttachment';
import CognitoUserPoolGroup from './cognito/userPoolGroup';
import CognitoIdentityPool from './cognito/identityPool';
import CognitoUserPoolUser from './cognito/userPoolUser';
import CognitoUserPool from './cognito/userPool';
import CognitoUserPoolClient from './cognito/userPoolClient';
import CognitoUserPoolUserToGroupAttachment from './cognito/userPoolUserToGroupAttachment';
export declare const Events: {
    Rule: typeof EventsRule;
};
import EventsRule from './events/rule';
export declare const WAF: {
    IPSet: typeof WAFIPSet;
    SizeConstraintSet: typeof WAFSizeConstraintSet;
    Rule: typeof WAFRule;
    ByteMatchSet: typeof WAFByteMatchSet;
    SqlInjectionMatchSet: typeof WAFSqlInjectionMatchSet;
    WebACL: typeof WAFWebACL;
    XssMatchSet: typeof WAFXssMatchSet;
};
import WAFIPSet from './waf/ipSet';
import WAFSizeConstraintSet from './waf/sizeConstraintSet';
import WAFRule from './waf/rule';
import WAFByteMatchSet from './waf/byteMatchSet';
import WAFSqlInjectionMatchSet from './waf/sqlInjectionMatchSet';
import WAFWebACL from './waf/webAcl';
import WAFXssMatchSet from './waf/xssMatchSet';
export declare const IAM: {
    Group: typeof IAMGroup;
    Policy: typeof IAMPolicy;
    Role: typeof IAMRole;
    UserToGroupAddition: typeof IAMUserToGroupAddition;
    InstanceProfile: typeof IAMInstanceProfile;
    AccessKey: typeof IAMAccessKey;
    User: typeof IAMUser;
    ManagedPolicy: typeof IAMManagedPolicy;
};
import IAMGroup from './iam/group';
import IAMPolicy from './iam/policy';
import IAMRole from './iam/role';
import IAMUserToGroupAddition from './iam/userToGroupAddition';
import IAMInstanceProfile from './iam/instanceProfile';
import IAMAccessKey from './iam/accessKey';
import IAMUser from './iam/user';
import IAMManagedPolicy from './iam/managedPolicy';
export declare const CodePipeline: {
    CustomActionType: typeof CodePipelineCustomActionType;
    Pipeline: typeof CodePipelinePipeline;
};
import CodePipelineCustomActionType from './codePipeline/customActionType';
import CodePipelinePipeline from './codePipeline/pipeline';
export declare const Elasticsearch: {
    Domain: typeof ElasticsearchDomain;
};
import ElasticsearchDomain from './elasticsearch/domain';
export declare const ApiGateway: {
    RequestValidator: typeof ApiGatewayRequestValidator;
    Deployment: typeof ApiGatewayDeployment;
    Authorizer: typeof ApiGatewayAuthorizer;
    DomainName: typeof ApiGatewayDomainName;
    DocumentationPart: typeof ApiGatewayDocumentationPart;
    ApiKey: typeof ApiGatewayApiKey;
    Model: typeof ApiGatewayModel;
    Resource: typeof ApiGatewayResource;
    Account: typeof ApiGatewayAccount;
    RestApi: typeof ApiGatewayRestApi;
    UsagePlan: typeof ApiGatewayUsagePlan;
    BasePathMapping: typeof ApiGatewayBasePathMapping;
    Stage: typeof ApiGatewayStage;
    VpcLink: typeof ApiGatewayVpcLink;
    GatewayResponse: typeof ApiGatewayGatewayResponse;
    ClientCertificate: typeof ApiGatewayClientCertificate;
    Method: typeof ApiGatewayMethod;
    DocumentationVersion: typeof ApiGatewayDocumentationVersion;
    UsagePlanKey: typeof ApiGatewayUsagePlanKey;
};
import ApiGatewayRequestValidator from './apiGateway/requestValidator';
import ApiGatewayDeployment from './apiGateway/deployment';
import ApiGatewayAuthorizer from './apiGateway/authorizer';
import ApiGatewayDomainName from './apiGateway/domainName';
import ApiGatewayDocumentationPart from './apiGateway/documentationPart';
import ApiGatewayApiKey from './apiGateway/apiKey';
import ApiGatewayModel from './apiGateway/model';
import ApiGatewayResource from './apiGateway/resource';
import ApiGatewayAccount from './apiGateway/account';
import ApiGatewayRestApi from './apiGateway/restApi';
import ApiGatewayUsagePlan from './apiGateway/usagePlan';
import ApiGatewayBasePathMapping from './apiGateway/basePathMapping';
import ApiGatewayStage from './apiGateway/stage';
import ApiGatewayVpcLink from './apiGateway/vpcLink';
import ApiGatewayGatewayResponse from './apiGateway/gatewayResponse';
import ApiGatewayClientCertificate from './apiGateway/clientCertificate';
import ApiGatewayMethod from './apiGateway/method';
import ApiGatewayDocumentationVersion from './apiGateway/documentationVersion';
import ApiGatewayUsagePlanKey from './apiGateway/usagePlanKey';
export declare const WAFRegional: {
    SizeConstraintSet: typeof WAFRegionalSizeConstraintSet;
    SqlInjectionMatchSet: typeof WAFRegionalSqlInjectionMatchSet;
    XssMatchSet: typeof WAFRegionalXssMatchSet;
    ByteMatchSet: typeof WAFRegionalByteMatchSet;
    WebACLAssociation: typeof WAFRegionalWebACLAssociation;
    WebACL: typeof WAFRegionalWebACL;
    Rule: typeof WAFRegionalRule;
    IPSet: typeof WAFRegionalIPSet;
};
import WAFRegionalSizeConstraintSet from './wafRegional/sizeConstraintSet';
import WAFRegionalSqlInjectionMatchSet from './wafRegional/sqlInjectionMatchSet';
import WAFRegionalXssMatchSet from './wafRegional/xssMatchSet';
import WAFRegionalByteMatchSet from './wafRegional/byteMatchSet';
import WAFRegionalWebACLAssociation from './wafRegional/webAclAssociation';
import WAFRegionalWebACL from './wafRegional/webAcl';
import WAFRegionalRule from './wafRegional/rule';
import WAFRegionalIPSet from './wafRegional/ipSet';
export declare const WorkSpaces: {
    Workspace: typeof WorkSpacesWorkspace;
};
import WorkSpacesWorkspace from './workSpaces/workspace';
export declare const RDS: {
    DBSecurityGroupIngress: typeof RDSDBSecurityGroupIngress;
    DBCluster: typeof RDSDBCluster;
    DBSubnetGroup: typeof RDSDBSubnetGroup;
    OptionGroup: typeof RDSOptionGroup;
    DBParameterGroup: typeof RDSDBParameterGroup;
    EventSubscription: typeof RDSEventSubscription;
    DBInstance: typeof RDSDBInstance;
    DBSecurityGroup: typeof RDSDBSecurityGroup;
    DBClusterParameterGroup: typeof RDSDBClusterParameterGroup;
};
import RDSDBSecurityGroupIngress from './rds/dbSecurityGroupIngress';
import RDSDBCluster from './rds/dbCluster';
import RDSDBSubnetGroup from './rds/dbSubnetGroup';
import RDSOptionGroup from './rds/optionGroup';
import RDSDBParameterGroup from './rds/dbParameterGroup';
import RDSEventSubscription from './rds/eventSubscription';
import RDSDBInstance from './rds/dbInstance';
import RDSDBSecurityGroup from './rds/dbSecurityGroup';
import RDSDBClusterParameterGroup from './rds/dbClusterParameterGroup';
export declare const EMR: {
    InstanceFleetConfig: typeof EMRInstanceFleetConfig;
    Cluster: typeof EMRCluster;
    InstanceGroupConfig: typeof EMRInstanceGroupConfig;
    Step: typeof EMRStep;
    SecurityConfiguration: typeof EMRSecurityConfiguration;
};
import EMRInstanceFleetConfig from './emr/instanceFleetConfig';
import EMRCluster from './emr/cluster';
import EMRInstanceGroupConfig from './emr/instanceGroupConfig';
import EMRStep from './emr/step';
import EMRSecurityConfiguration from './emr/securityConfiguration';
export declare const Logs: any;
export declare const Kinesis: {
    Stream: typeof KinesisStream;
};
import KinesisStream from './kinesis/stream';
export declare const AutoScaling: {
    LaunchConfiguration: typeof AutoScalingLaunchConfiguration;
    LifecycleHook: typeof AutoScalingLifecycleHook;
    ScalingPolicy: typeof AutoScalingScalingPolicy;
    AutoScalingGroup: typeof AutoScalingAutoScalingGroup;
    ScheduledAction: typeof AutoScalingScheduledAction;
};
import AutoScalingLaunchConfiguration from './autoScaling/launchConfiguration';
import AutoScalingLifecycleHook from './autoScaling/lifecycleHook';
import AutoScalingScalingPolicy from './autoScaling/scalingPolicy';
import AutoScalingAutoScalingGroup from './autoScaling/autoScalingGroup';
import AutoScalingScheduledAction from './autoScaling/scheduledAction';
export declare const SQS: {
    Queue: typeof SQSQueue;
    QueuePolicy: typeof SQSQueuePolicy;
};
import SQSQueue from './sqs/queue';
import SQSQueuePolicy from './sqs/queuePolicy';
export declare const AutoScalingPlans: {
    ScalingPlan: typeof AutoScalingPlansScalingPlan;
};
import AutoScalingPlansScalingPlan from './autoScalingPlans/scalingPlan';
export declare const Route53: {
    RecordSet: typeof Route53RecordSet;
    HostedZone: typeof Route53HostedZone;
    RecordSetGroup: typeof Route53RecordSetGroup;
    HealthCheck: typeof Route53HealthCheck;
};
import Route53RecordSet from './route53/recordSet';
import Route53HostedZone from './route53/hostedZone';
import Route53RecordSetGroup from './route53/recordSetGroup';
import Route53HealthCheck from './route53/healthCheck';
export declare const CloudWatch: {
    Dashboard: typeof CloudWatchDashboard;
    Alarm: typeof CloudWatchAlarm;
};
import CloudWatchDashboard from './cloudWatch/dashboard';
import CloudWatchAlarm from './cloudWatch/alarm';
export declare const ECS: {
    Cluster: typeof ECSCluster;
    Service: typeof ECSService;
    TaskDefinition: typeof ECSTaskDefinition;
};
import ECSCluster from './ecs/cluster';
import ECSService from './ecs/service';
import ECSTaskDefinition from './ecs/taskDefinition';
export declare const ElasticLoadBalancingV2: {
    ListenerCertificate: typeof ElasticLoadBalancingV2ListenerCertificate;
    LoadBalancer: typeof ElasticLoadBalancingV2LoadBalancer;
    Listener: typeof ElasticLoadBalancingV2Listener;
    ListenerRule: typeof ElasticLoadBalancingV2ListenerRule;
    TargetGroup: typeof ElasticLoadBalancingV2TargetGroup;
};
import ElasticLoadBalancingV2ListenerCertificate from './elasticLoadBalancingV2/listenerCertificate';
import ElasticLoadBalancingV2LoadBalancer from './elasticLoadBalancingV2/loadBalancer';
import ElasticLoadBalancingV2Listener from './elasticLoadBalancingV2/listener';
import ElasticLoadBalancingV2ListenerRule from './elasticLoadBalancingV2/listenerRule';
import ElasticLoadBalancingV2TargetGroup from './elasticLoadBalancingV2/targetGroup';
export declare const Neptune: {
    DBParameterGroup: typeof NeptuneDBParameterGroup;
    DBClusterParameterGroup: typeof NeptuneDBClusterParameterGroup;
    DBCluster: typeof NeptuneDBCluster;
    DBSubnetGroup: typeof NeptuneDBSubnetGroup;
    DBInstance: typeof NeptuneDBInstance;
};
import NeptuneDBParameterGroup from './neptune/dbParameterGroup';
import NeptuneDBClusterParameterGroup from './neptune/dbClusterParameterGroup';
import NeptuneDBCluster from './neptune/dbCluster';
import NeptuneDBSubnetGroup from './neptune/dbSubnetGroup';
import NeptuneDBInstance from './neptune/dbInstance';
export declare const StepFunctions: {
    Activity: typeof StepFunctionsActivity;
    StateMachine: typeof StepFunctionsStateMachine;
};
import StepFunctionsActivity from './stepFunctions/activity';
import StepFunctionsStateMachine from './stepFunctions/stateMachine';
export declare const KinesisAnalytics: {
    ApplicationOutput: typeof KinesisAnalyticsApplicationOutput;
    ApplicationReferenceDataSource: typeof KinesisAnalyticsApplicationReferenceDataSource;
    Application: typeof KinesisAnalyticsApplication;
};
import KinesisAnalyticsApplicationOutput from './kinesisAnalytics/applicationOutput';
import KinesisAnalyticsApplicationReferenceDataSource from './kinesisAnalytics/applicationReferenceDataSource';
import KinesisAnalyticsApplication from './kinesisAnalytics/application';
export declare const OpsWorks: {
    Volume: typeof OpsWorksVolume;
    App: typeof OpsWorksApp;
    Layer: typeof OpsWorksLayer;
    Stack: typeof OpsWorksStack;
    ElasticLoadBalancerAttachment: typeof OpsWorksElasticLoadBalancerAttachment;
    Instance: typeof OpsWorksInstance;
    UserProfile: typeof OpsWorksUserProfile;
};
import OpsWorksVolume from './opsWorks/volume';
import OpsWorksApp from './opsWorks/app';
import OpsWorksLayer from './opsWorks/layer';
import OpsWorksStack from './opsWorks/stack';
import OpsWorksElasticLoadBalancerAttachment from './opsWorks/elasticLoadBalancerAttachment';
import OpsWorksInstance from './opsWorks/instance';
import OpsWorksUserProfile from './opsWorks/userProfile';
export declare const CloudFront: {
    StreamingDistribution: typeof CloudFrontStreamingDistribution;
    Distribution: typeof CloudFrontDistribution;
    CloudFrontOriginAccessIdentity: typeof CloudFrontCloudFrontOriginAccessIdentity;
};
import CloudFrontStreamingDistribution from './cloudFront/streamingDistribution';
import CloudFrontDistribution from './cloudFront/distribution';
import CloudFrontCloudFrontOriginAccessIdentity from './cloudFront/cloudFrontOriginAccessIdentity';
export declare const GameLift: {
    Alias: typeof GameLiftAlias;
    Build: typeof GameLiftBuild;
    Fleet: typeof GameLiftFleet;
};
import GameLiftAlias from './gameLift/alias';
import GameLiftBuild from './gameLift/build';
import GameLiftFleet from './gameLift/fleet';
export declare const GuardDuty: {
    Filter: typeof GuardDutyFilter;
    ThreatIntelSet: typeof GuardDutyThreatIntelSet;
    Member: typeof GuardDutyMember;
    Detector: typeof GuardDutyDetector;
    IPSet: typeof GuardDutyIPSet;
    Master: typeof GuardDutyMaster;
};
import GuardDutyFilter from './guardDuty/filter';
import GuardDutyThreatIntelSet from './guardDuty/threatIntelSet';
import GuardDutyMember from './guardDuty/member';
import GuardDutyDetector from './guardDuty/detector';
import GuardDutyIPSet from './guardDuty/ipSet';
import GuardDutyMaster from './guardDuty/master';
export declare const DirectoryService: {
    MicrosoftAD: typeof DirectoryServiceMicrosoftAD;
    SimpleAD: typeof DirectoryServiceSimpleAD;
};
import DirectoryServiceMicrosoftAD from './directoryService/microsoftAd';
import DirectoryServiceSimpleAD from './directoryService/simpleAd';
export declare const SNS: {
    Subscription: typeof SNSSubscription;
    Topic: typeof SNSTopic;
    TopicPolicy: typeof SNSTopicPolicy;
};
import SNSSubscription from './sns/subscription';
import SNSTopic from './sns/topic';
import SNSTopicPolicy from './sns/topicPolicy';
export declare const EFS: {
    MountTarget: typeof EFSMountTarget;
    FileSystem: typeof EFSFileSystem;
};
import EFSMountTarget from './efs/mountTarget';
import EFSFileSystem from './efs/fileSystem';
export declare const SSM: {
    Document: typeof SSMDocument;
    PatchBaseline: typeof SSMPatchBaseline;
    Parameter: typeof SSMParameter;
    Association: typeof SSMAssociation;
    MaintenanceWindowTask: typeof SSMMaintenanceWindowTask;
};
import SSMDocument from './ssm/document';
import SSMPatchBaseline from './ssm/patchBaseline';
import SSMParameter from './ssm/parameter';
import SSMAssociation from './ssm/association';
import SSMMaintenanceWindowTask from './ssm/maintenanceWindowTask';
export declare const Config: {
    DeliveryChannel: typeof ConfigDeliveryChannel;
    ConfigurationRecorder: typeof ConfigConfigurationRecorder;
    ConfigRule: typeof ConfigConfigRule;
};
import ConfigDeliveryChannel from './config/deliveryChannel';
import ConfigConfigurationRecorder from './config/configurationRecorder';
import ConfigConfigRule from './config/configRule';
export declare const KMS: {
    Key: typeof KMSKey;
    Alias: typeof KMSAlias;
};
import KMSKey from './kms/key';
import KMSAlias from './kms/alias';
export declare const Redshift: {
    Cluster: typeof RedshiftCluster;
    ClusterParameterGroup: typeof RedshiftClusterParameterGroup;
    ClusterSecurityGroupIngress: typeof RedshiftClusterSecurityGroupIngress;
    ClusterSubnetGroup: typeof RedshiftClusterSubnetGroup;
    ClusterSecurityGroup: typeof RedshiftClusterSecurityGroup;
};
import RedshiftCluster from './redshift/cluster';
import RedshiftClusterParameterGroup from './redshift/clusterParameterGroup';
import RedshiftClusterSecurityGroupIngress from './redshift/clusterSecurityGroupIngress';
import RedshiftClusterSubnetGroup from './redshift/clusterSubnetGroup';
import RedshiftClusterSecurityGroup from './redshift/clusterSecurityGroup';
export declare const Lambda: {
    EventSourceMapping: typeof LambdaEventSourceMapping;
    Alias: typeof LambdaAlias;
    Function: typeof LambdaFunction;
    Version: typeof LambdaVersion;
    Permission: typeof LambdaPermission;
};
import LambdaEventSourceMapping from './lambda/eventSourceMapping';
import LambdaAlias from './lambda/alias';
import LambdaFunction from './lambda/function';
import LambdaVersion from './lambda/version';
import LambdaPermission from './lambda/permission';
export declare const CertificateManager: {
    Certificate: typeof CertificateManagerCertificate;
};
import CertificateManagerCertificate from './certificateManager/certificate';
export declare const Inspector: {
    ResourceGroup: typeof InspectorResourceGroup;
    AssessmentTemplate: typeof InspectorAssessmentTemplate;
    AssessmentTarget: typeof InspectorAssessmentTarget;
};
import InspectorResourceGroup from './inspector/resourceGroup';
import InspectorAssessmentTemplate from './inspector/assessmentTemplate';
import InspectorAssessmentTarget from './inspector/assessmentTarget';
export declare const Batch: {
    JobDefinition: typeof BatchJobDefinition;
    JobQueue: typeof BatchJobQueue;
    ComputeEnvironment: typeof BatchComputeEnvironment;
};
import BatchJobDefinition from './batch/jobDefinition';
import BatchJobQueue from './batch/jobQueue';
import BatchComputeEnvironment from './batch/computeEnvironment';
export declare const IoT: {
    Thing: typeof IoTThing;
    Policy: typeof IoTPolicy;
    TopicRule: typeof IoTTopicRule;
    PolicyPrincipalAttachment: typeof IoTPolicyPrincipalAttachment;
    ThingPrincipalAttachment: typeof IoTThingPrincipalAttachment;
    Certificate: typeof IoTCertificate;
};
import IoTThing from './iot/thing';
import IoTPolicy from './iot/policy';
import IoTTopicRule from './iot/topicRule';
import IoTPolicyPrincipalAttachment from './iot/policyPrincipalAttachment';
import IoTThingPrincipalAttachment from './iot/thingPrincipalAttachment';
import IoTCertificate from './iot/certificate';
export declare const ElasticLoadBalancing: {
    LoadBalancer: typeof ElasticLoadBalancingLoadBalancer;
};
import ElasticLoadBalancingLoadBalancer from './elasticLoadBalancing/loadBalancer';
export declare const DMS: {
    Certificate: typeof DMSCertificate;
    ReplicationSubnetGroup: typeof DMSReplicationSubnetGroup;
    EventSubscription: typeof DMSEventSubscription;
    Endpoint: typeof DMSEndpoint;
    ReplicationTask: typeof DMSReplicationTask;
    ReplicationInstance: typeof DMSReplicationInstance;
};
import DMSCertificate from './dms/certificate';
import DMSReplicationSubnetGroup from './dms/replicationSubnetGroup';
import DMSEventSubscription from './dms/eventSubscription';
import DMSEndpoint from './dms/endpoint';
import DMSReplicationTask from './dms/replicationTask';
import DMSReplicationInstance from './dms/replicationInstance';
export declare const Glue: {
    Table: typeof GlueTable;
    Connection: typeof GlueConnection;
    Partition: typeof GluePartition;
    Job: typeof GlueJob;
    Database: typeof GlueDatabase;
    DevEndpoint: typeof GlueDevEndpoint;
    Trigger: typeof GlueTrigger;
    Crawler: typeof GlueCrawler;
    Classifier: typeof GlueClassifier;
};
import GlueTable from './glue/table';
import GlueConnection from './glue/connection';
import GluePartition from './glue/partition';
import GlueJob from './glue/job';
import GlueDatabase from './glue/database';
import GlueDevEndpoint from './glue/devEndpoint';
import GlueTrigger from './glue/trigger';
import GlueCrawler from './glue/crawler';
import GlueClassifier from './glue/classifier';
export declare const ElastiCache: {
    SecurityGroup: typeof ElastiCacheSecurityGroup;
    SubnetGroup: typeof ElastiCacheSubnetGroup;
    SecurityGroupIngress: typeof ElastiCacheSecurityGroupIngress;
    ReplicationGroup: typeof ElastiCacheReplicationGroup;
    ParameterGroup: typeof ElastiCacheParameterGroup;
    CacheCluster: typeof ElastiCacheCacheCluster;
};
import ElastiCacheSecurityGroup from './elastiCache/securityGroup';
import ElastiCacheSubnetGroup from './elastiCache/subnetGroup';
import ElastiCacheSecurityGroupIngress from './elastiCache/securityGroupIngress';
import ElastiCacheReplicationGroup from './elastiCache/replicationGroup';
import ElastiCacheParameterGroup from './elastiCache/parameterGroup';
import ElastiCacheCacheCluster from './elastiCache/cacheCluster';
export declare const CodeDeploy: {
    DeploymentGroup: typeof CodeDeployDeploymentGroup;
    DeploymentConfig: typeof CodeDeployDeploymentConfig;
    Application: typeof CodeDeployApplication;
};
import CodeDeployDeploymentGroup from './codeDeploy/deploymentGroup';
import CodeDeployDeploymentConfig from './codeDeploy/deploymentConfig';
import CodeDeployApplication from './codeDeploy/application';
export declare const SES: {
    ReceiptFilter: typeof SESReceiptFilter;
    ReceiptRule: typeof SESReceiptRule;
    ConfigurationSetEventDestination: typeof SESConfigurationSetEventDestination;
    Template: typeof SESTemplate;
    ConfigurationSet: typeof SESConfigurationSet;
    ReceiptRuleSet: typeof SESReceiptRuleSet;
};
import SESReceiptFilter from './ses/receiptFilter';
import SESReceiptRule from './ses/receiptRule';
import SESConfigurationSetEventDestination from './ses/configurationSetEventDestination';
import SESTemplate from './ses/template';
import SESConfigurationSet from './ses/configurationSet';
import SESReceiptRuleSet from './ses/receiptRuleSet';
export declare const CodeBuild: {
    Project: typeof CodeBuildProject;
};
import CodeBuildProject from './codeBuild/project';
export declare const Budgets: {
    Budget: typeof BudgetsBudget;
};
import BudgetsBudget from './budgets/budget';
export declare const DAX: {
    SubnetGroup: typeof DAXSubnetGroup;
    ParameterGroup: typeof DAXParameterGroup;
    Cluster: typeof DAXCluster;
};
import DAXSubnetGroup from './dax/subnetGroup';
import DAXParameterGroup from './dax/parameterGroup';
import DAXCluster from './dax/cluster';
export declare const DataPipeline: {
    Pipeline: typeof DataPipelinePipeline;
};
import DataPipelinePipeline from './dataPipeline/pipeline';
export declare const CloudTrail: {
    Trail: typeof CloudTrailTrail;
};
import CloudTrailTrail from './cloudTrail/trail';
export declare const CloudFormation: {
    WaitCondition: typeof CloudFormationWaitCondition;
    Stack: typeof CloudFormationStack;
    WaitConditionHandle: typeof CloudFormationWaitConditionHandle;
    CustomResource: typeof CloudFormationCustomResource;
};
import CloudFormationWaitCondition from './cloudFormation/waitCondition';
import CloudFormationStack from './cloudFormation/stack';
import CloudFormationWaitConditionHandle from './cloudFormation/waitConditionHandle';
import CloudFormationCustomResource from './cloudFormation/customResource';
export declare const Cloud9: {
    EnvironmentEC2: typeof Cloud9EnvironmentEC2;
};
import Cloud9EnvironmentEC2 from './cloud9/environmentEc2';
export declare const ServiceDiscovery: {
    Instance: typeof ServiceDiscoveryInstance;
    Service: typeof ServiceDiscoveryService;
    PrivateDnsNamespace: typeof ServiceDiscoveryPrivateDnsNamespace;
    PublicDnsNamespace: typeof ServiceDiscoveryPublicDnsNamespace;
};
import ServiceDiscoveryInstance from './serviceDiscovery/instance';
import ServiceDiscoveryService from './serviceDiscovery/service';
import ServiceDiscoveryPrivateDnsNamespace from './serviceDiscovery/privateDnsNamespace';
import ServiceDiscoveryPublicDnsNamespace from './serviceDiscovery/publicDnsNamespace';
export declare const ApplicationAutoScaling: {
    ScalingPolicy: typeof ApplicationAutoScalingScalingPolicy;
    ScalableTarget: typeof ApplicationAutoScalingScalableTarget;
};
import ApplicationAutoScalingScalingPolicy from './applicationAutoScaling/scalingPolicy';
import ApplicationAutoScalingScalableTarget from './applicationAutoScaling/scalableTarget';
export declare const CodeCommit: {
    Repository: typeof CodeCommitRepository;
};
import CodeCommitRepository from './codeCommit/repository';
export declare const S3: {
    Bucket: typeof S3Bucket;
    BucketPolicy: typeof S3BucketPolicy;
};
import S3Bucket from './s3/bucket';
import S3BucketPolicy from './s3/bucketPolicy';
export declare const KinesisFirehose: {
    DeliveryStream: typeof KinesisFirehoseDeliveryStream;
};
import KinesisFirehoseDeliveryStream from './kinesisFirehose/deliveryStream';
export declare const SDB: {
    Domain: typeof SDBDomain;
};
import SDBDomain from './sdb/domain';
export declare const ECR: {
    Repository: typeof ECRRepository;
};
import ECRRepository from './ecr/repository';
export declare const DynamoDB: {
    Table: typeof DynamoDBTable;
};
import DynamoDBTable from './dynamoDb/table';
export declare const Athena: {
    NamedQuery: typeof AthenaNamedQuery;
};
import AthenaNamedQuery from './athena/namedQuery';
declare const _default: {
    ElasticBeanstalk: {
        ConfigurationTemplate: typeof ElasticBeanstalkConfigurationTemplate;
        Application: typeof ElasticBeanstalkApplication;
        Environment: typeof ElasticBeanstalkEnvironment;
        ApplicationVersion: typeof ElasticBeanstalkApplicationVersion;
    };
    AppSync: {
        DataSource: typeof AppSyncDataSource;
        Resolver: typeof AppSyncResolver;
        GraphQLSchema: typeof AppSyncGraphQLSchema;
        GraphQLApi: typeof AppSyncGraphQLApi;
        ApiKey: typeof AppSyncApiKey;
    };
    EC2: {
        RouteTable: typeof EC2RouteTable;
        VPCPeeringConnection: typeof EC2VPCPeeringConnection;
        PlacementGroup: typeof EC2PlacementGroup;
        NetworkAclEntry: typeof EC2NetworkAclEntry;
        InternetGateway: typeof EC2InternetGateway;
        LaunchTemplate: typeof EC2LaunchTemplate;
        Volume: typeof EC2Volume;
        SpotFleet: typeof EC2SpotFleet;
        VPNConnectionRoute: typeof EC2VPNConnectionRoute;
        NetworkInterfacePermission: typeof EC2NetworkInterfacePermission;
        EIP: typeof EC2EIP;
        SecurityGroupIngress: typeof EC2SecurityGroupIngress;
        SubnetRouteTableAssociation: typeof EC2SubnetRouteTableAssociation;
        Route: typeof EC2Route;
        FlowLog: typeof EC2FlowLog;
        SecurityGroupEgress: typeof EC2SecurityGroupEgress;
        NetworkInterface: typeof EC2NetworkInterface;
        SubnetNetworkAclAssociation: typeof EC2SubnetNetworkAclAssociation;
        SubnetCidrBlock: typeof EC2SubnetCidrBlock;
        NatGateway: typeof EC2NatGateway;
        SecurityGroup: typeof EC2SecurityGroup;
        Subnet: typeof EC2Subnet;
        VPC: typeof EC2VPC;
        Instance: typeof EC2Instance;
        DHCPOptions: typeof EC2DHCPOptions;
        NetworkAcl: typeof EC2NetworkAcl;
        VPNGatewayRoutePropagation: typeof EC2VPNGatewayRoutePropagation;
        EgressOnlyInternetGateway: typeof EC2EgressOnlyInternetGateway;
        NetworkInterfaceAttachment: typeof EC2NetworkInterfaceAttachment;
        CustomerGateway: typeof EC2CustomerGateway;
        TrunkInterfaceAssociation: typeof EC2TrunkInterfaceAssociation;
        VolumeAttachment: typeof EC2VolumeAttachment;
        Host: typeof EC2Host;
        EIPAssociation: typeof EC2EIPAssociation;
        VPNGateway: typeof EC2VPNGateway;
        VPCEndpoint: typeof EC2VPCEndpoint;
        VPCGatewayAttachment: typeof EC2VPCGatewayAttachment;
        VPNConnection: typeof EC2VPNConnection;
        VPCCidrBlock: typeof EC2VPCCidrBlock;
        VPCDHCPOptionsAssociation: typeof EC2VPCDHCPOptionsAssociation;
    };
    ServiceCatalog: {
        PortfolioShare: typeof ServiceCatalogPortfolioShare;
        TagOptionAssociation: typeof ServiceCatalogTagOptionAssociation;
        LaunchTemplateConstraint: typeof ServiceCatalogLaunchTemplateConstraint;
        TagOption: typeof ServiceCatalogTagOption;
        PortfolioPrincipalAssociation: typeof ServiceCatalogPortfolioPrincipalAssociation;
        CloudFormationProvisionedProduct: typeof ServiceCatalogCloudFormationProvisionedProduct;
        LaunchRoleConstraint: typeof ServiceCatalogLaunchRoleConstraint;
        CloudFormationProduct: typeof ServiceCatalogCloudFormationProduct;
        PortfolioProductAssociation: typeof ServiceCatalogPortfolioProductAssociation;
        Portfolio: typeof ServiceCatalogPortfolio;
        AcceptedPortfolioShare: typeof ServiceCatalogAcceptedPortfolioShare;
        LaunchNotificationConstraint: typeof ServiceCatalogLaunchNotificationConstraint;
    };
    Cognito: {
        IdentityPoolRoleAttachment: typeof CognitoIdentityPoolRoleAttachment;
        UserPoolGroup: typeof CognitoUserPoolGroup;
        IdentityPool: typeof CognitoIdentityPool;
        UserPoolUser: typeof CognitoUserPoolUser;
        UserPool: typeof CognitoUserPool;
        UserPoolClient: typeof CognitoUserPoolClient;
        UserPoolUserToGroupAttachment: typeof CognitoUserPoolUserToGroupAttachment;
    };
    Events: {
        Rule: typeof EventsRule;
    };
    WAF: {
        IPSet: typeof WAFIPSet;
        SizeConstraintSet: typeof WAFSizeConstraintSet;
        Rule: typeof WAFRule;
        ByteMatchSet: typeof WAFByteMatchSet;
        SqlInjectionMatchSet: typeof WAFSqlInjectionMatchSet;
        WebACL: typeof WAFWebACL;
        XssMatchSet: typeof WAFXssMatchSet;
    };
    IAM: {
        Group: typeof IAMGroup;
        Policy: typeof IAMPolicy;
        Role: typeof IAMRole;
        UserToGroupAddition: typeof IAMUserToGroupAddition;
        InstanceProfile: typeof IAMInstanceProfile;
        AccessKey: typeof IAMAccessKey;
        User: typeof IAMUser;
        ManagedPolicy: typeof IAMManagedPolicy;
    };
    CodePipeline: {
        CustomActionType: typeof CodePipelineCustomActionType;
        Pipeline: typeof CodePipelinePipeline;
    };
    Elasticsearch: {
        Domain: typeof ElasticsearchDomain;
    };
    ApiGateway: {
        RequestValidator: typeof ApiGatewayRequestValidator;
        Deployment: typeof ApiGatewayDeployment;
        Authorizer: typeof ApiGatewayAuthorizer;
        DomainName: typeof ApiGatewayDomainName;
        DocumentationPart: typeof ApiGatewayDocumentationPart;
        ApiKey: typeof ApiGatewayApiKey;
        Model: typeof ApiGatewayModel;
        Resource: typeof ApiGatewayResource;
        Account: typeof ApiGatewayAccount;
        RestApi: typeof ApiGatewayRestApi;
        UsagePlan: typeof ApiGatewayUsagePlan;
        BasePathMapping: typeof ApiGatewayBasePathMapping;
        Stage: typeof ApiGatewayStage;
        VpcLink: typeof ApiGatewayVpcLink;
        GatewayResponse: typeof ApiGatewayGatewayResponse;
        ClientCertificate: typeof ApiGatewayClientCertificate;
        Method: typeof ApiGatewayMethod;
        DocumentationVersion: typeof ApiGatewayDocumentationVersion;
        UsagePlanKey: typeof ApiGatewayUsagePlanKey;
    };
    WAFRegional: {
        SizeConstraintSet: typeof WAFRegionalSizeConstraintSet;
        SqlInjectionMatchSet: typeof WAFRegionalSqlInjectionMatchSet;
        XssMatchSet: typeof WAFRegionalXssMatchSet;
        ByteMatchSet: typeof WAFRegionalByteMatchSet;
        WebACLAssociation: typeof WAFRegionalWebACLAssociation;
        WebACL: typeof WAFRegionalWebACL;
        Rule: typeof WAFRegionalRule;
        IPSet: typeof WAFRegionalIPSet;
    };
    WorkSpaces: {
        Workspace: typeof WorkSpacesWorkspace;
    };
    RDS: {
        DBSecurityGroupIngress: typeof RDSDBSecurityGroupIngress;
        DBCluster: typeof RDSDBCluster;
        DBSubnetGroup: typeof RDSDBSubnetGroup;
        OptionGroup: typeof RDSOptionGroup;
        DBParameterGroup: typeof RDSDBParameterGroup;
        EventSubscription: typeof RDSEventSubscription;
        DBInstance: typeof RDSDBInstance;
        DBSecurityGroup: typeof RDSDBSecurityGroup;
        DBClusterParameterGroup: typeof RDSDBClusterParameterGroup;
    };
    EMR: {
        InstanceFleetConfig: typeof EMRInstanceFleetConfig;
        Cluster: typeof EMRCluster;
        InstanceGroupConfig: typeof EMRInstanceGroupConfig;
        Step: typeof EMRStep;
        SecurityConfiguration: typeof EMRSecurityConfiguration;
    };
    Logs: any;
    Kinesis: {
        Stream: typeof KinesisStream;
    };
    AutoScaling: {
        LaunchConfiguration: typeof AutoScalingLaunchConfiguration;
        LifecycleHook: typeof AutoScalingLifecycleHook;
        ScalingPolicy: typeof AutoScalingScalingPolicy;
        AutoScalingGroup: typeof AutoScalingAutoScalingGroup;
        ScheduledAction: typeof AutoScalingScheduledAction;
    };
    SQS: {
        Queue: typeof SQSQueue;
        QueuePolicy: typeof SQSQueuePolicy;
    };
    AutoScalingPlans: {
        ScalingPlan: typeof AutoScalingPlansScalingPlan;
    };
    Route53: {
        RecordSet: typeof Route53RecordSet;
        HostedZone: typeof Route53HostedZone;
        RecordSetGroup: typeof Route53RecordSetGroup;
        HealthCheck: typeof Route53HealthCheck;
    };
    CloudWatch: {
        Dashboard: typeof CloudWatchDashboard;
        Alarm: typeof CloudWatchAlarm;
    };
    ECS: {
        Cluster: typeof ECSCluster;
        Service: typeof ECSService;
        TaskDefinition: typeof ECSTaskDefinition;
    };
    ElasticLoadBalancingV2: {
        ListenerCertificate: typeof ElasticLoadBalancingV2ListenerCertificate;
        LoadBalancer: typeof ElasticLoadBalancingV2LoadBalancer;
        Listener: typeof ElasticLoadBalancingV2Listener;
        ListenerRule: typeof ElasticLoadBalancingV2ListenerRule;
        TargetGroup: typeof ElasticLoadBalancingV2TargetGroup;
    };
    Neptune: {
        DBParameterGroup: typeof NeptuneDBParameterGroup;
        DBClusterParameterGroup: typeof NeptuneDBClusterParameterGroup;
        DBCluster: typeof NeptuneDBCluster;
        DBSubnetGroup: typeof NeptuneDBSubnetGroup;
        DBInstance: typeof NeptuneDBInstance;
    };
    StepFunctions: {
        Activity: typeof StepFunctionsActivity;
        StateMachine: typeof StepFunctionsStateMachine;
    };
    KinesisAnalytics: {
        ApplicationOutput: typeof KinesisAnalyticsApplicationOutput;
        ApplicationReferenceDataSource: typeof KinesisAnalyticsApplicationReferenceDataSource;
        Application: typeof KinesisAnalyticsApplication;
    };
    OpsWorks: {
        Volume: typeof OpsWorksVolume;
        App: typeof OpsWorksApp;
        Layer: typeof OpsWorksLayer;
        Stack: typeof OpsWorksStack;
        ElasticLoadBalancerAttachment: typeof OpsWorksElasticLoadBalancerAttachment;
        Instance: typeof OpsWorksInstance;
        UserProfile: typeof OpsWorksUserProfile;
    };
    CloudFront: {
        StreamingDistribution: typeof CloudFrontStreamingDistribution;
        Distribution: typeof CloudFrontDistribution;
        CloudFrontOriginAccessIdentity: typeof CloudFrontCloudFrontOriginAccessIdentity;
    };
    GameLift: {
        Alias: typeof GameLiftAlias;
        Build: typeof GameLiftBuild;
        Fleet: typeof GameLiftFleet;
    };
    GuardDuty: {
        Filter: typeof GuardDutyFilter;
        ThreatIntelSet: typeof GuardDutyThreatIntelSet;
        Member: typeof GuardDutyMember;
        Detector: typeof GuardDutyDetector;
        IPSet: typeof GuardDutyIPSet;
        Master: typeof GuardDutyMaster;
    };
    DirectoryService: {
        MicrosoftAD: typeof DirectoryServiceMicrosoftAD;
        SimpleAD: typeof DirectoryServiceSimpleAD;
    };
    SNS: {
        Subscription: typeof SNSSubscription;
        Topic: typeof SNSTopic;
        TopicPolicy: typeof SNSTopicPolicy;
    };
    EFS: {
        MountTarget: typeof EFSMountTarget;
        FileSystem: typeof EFSFileSystem;
    };
    SSM: {
        Document: typeof SSMDocument;
        PatchBaseline: typeof SSMPatchBaseline;
        Parameter: typeof SSMParameter;
        Association: typeof SSMAssociation;
        MaintenanceWindowTask: typeof SSMMaintenanceWindowTask;
    };
    Config: {
        DeliveryChannel: typeof ConfigDeliveryChannel;
        ConfigurationRecorder: typeof ConfigConfigurationRecorder;
        ConfigRule: typeof ConfigConfigRule;
    };
    KMS: {
        Key: typeof KMSKey;
        Alias: typeof KMSAlias;
    };
    Redshift: {
        Cluster: typeof RedshiftCluster;
        ClusterParameterGroup: typeof RedshiftClusterParameterGroup;
        ClusterSecurityGroupIngress: typeof RedshiftClusterSecurityGroupIngress;
        ClusterSubnetGroup: typeof RedshiftClusterSubnetGroup;
        ClusterSecurityGroup: typeof RedshiftClusterSecurityGroup;
    };
    Lambda: {
        EventSourceMapping: typeof LambdaEventSourceMapping;
        Alias: typeof LambdaAlias;
        Function: typeof LambdaFunction;
        Version: typeof LambdaVersion;
        Permission: typeof LambdaPermission;
    };
    CertificateManager: {
        Certificate: typeof CertificateManagerCertificate;
    };
    Inspector: {
        ResourceGroup: typeof InspectorResourceGroup;
        AssessmentTemplate: typeof InspectorAssessmentTemplate;
        AssessmentTarget: typeof InspectorAssessmentTarget;
    };
    Batch: {
        JobDefinition: typeof BatchJobDefinition;
        JobQueue: typeof BatchJobQueue;
        ComputeEnvironment: typeof BatchComputeEnvironment;
    };
    IoT: {
        Thing: typeof IoTThing;
        Policy: typeof IoTPolicy;
        TopicRule: typeof IoTTopicRule;
        PolicyPrincipalAttachment: typeof IoTPolicyPrincipalAttachment;
        ThingPrincipalAttachment: typeof IoTThingPrincipalAttachment;
        Certificate: typeof IoTCertificate;
    };
    ElasticLoadBalancing: {
        LoadBalancer: typeof ElasticLoadBalancingLoadBalancer;
    };
    DMS: {
        Certificate: typeof DMSCertificate;
        ReplicationSubnetGroup: typeof DMSReplicationSubnetGroup;
        EventSubscription: typeof DMSEventSubscription;
        Endpoint: typeof DMSEndpoint;
        ReplicationTask: typeof DMSReplicationTask;
        ReplicationInstance: typeof DMSReplicationInstance;
    };
    Glue: {
        Table: typeof GlueTable;
        Connection: typeof GlueConnection;
        Partition: typeof GluePartition;
        Job: typeof GlueJob;
        Database: typeof GlueDatabase;
        DevEndpoint: typeof GlueDevEndpoint;
        Trigger: typeof GlueTrigger;
        Crawler: typeof GlueCrawler;
        Classifier: typeof GlueClassifier;
    };
    ElastiCache: {
        SecurityGroup: typeof ElastiCacheSecurityGroup;
        SubnetGroup: typeof ElastiCacheSubnetGroup;
        SecurityGroupIngress: typeof ElastiCacheSecurityGroupIngress;
        ReplicationGroup: typeof ElastiCacheReplicationGroup;
        ParameterGroup: typeof ElastiCacheParameterGroup;
        CacheCluster: typeof ElastiCacheCacheCluster;
    };
    CodeDeploy: {
        DeploymentGroup: typeof CodeDeployDeploymentGroup;
        DeploymentConfig: typeof CodeDeployDeploymentConfig;
        Application: typeof CodeDeployApplication;
    };
    SES: {
        ReceiptFilter: typeof SESReceiptFilter;
        ReceiptRule: typeof SESReceiptRule;
        ConfigurationSetEventDestination: typeof SESConfigurationSetEventDestination;
        Template: typeof SESTemplate;
        ConfigurationSet: typeof SESConfigurationSet;
        ReceiptRuleSet: typeof SESReceiptRuleSet;
    };
    CodeBuild: {
        Project: typeof CodeBuildProject;
    };
    Budgets: {
        Budget: typeof BudgetsBudget;
    };
    DAX: {
        SubnetGroup: typeof DAXSubnetGroup;
        ParameterGroup: typeof DAXParameterGroup;
        Cluster: typeof DAXCluster;
    };
    DataPipeline: {
        Pipeline: typeof DataPipelinePipeline;
    };
    CloudTrail: {
        Trail: typeof CloudTrailTrail;
    };
    CloudFormation: {
        WaitCondition: typeof CloudFormationWaitCondition;
        Stack: typeof CloudFormationStack;
        WaitConditionHandle: typeof CloudFormationWaitConditionHandle;
        CustomResource: typeof CloudFormationCustomResource;
    };
    Cloud9: {
        EnvironmentEC2: typeof Cloud9EnvironmentEC2;
    };
    ServiceDiscovery: {
        Instance: typeof ServiceDiscoveryInstance;
        Service: typeof ServiceDiscoveryService;
        PrivateDnsNamespace: typeof ServiceDiscoveryPrivateDnsNamespace;
        PublicDnsNamespace: typeof ServiceDiscoveryPublicDnsNamespace;
    };
    ApplicationAutoScaling: {
        ScalingPolicy: typeof ApplicationAutoScalingScalingPolicy;
        ScalableTarget: typeof ApplicationAutoScalingScalableTarget;
    };
    CodeCommit: {
        Repository: typeof CodeCommitRepository;
    };
    S3: {
        Bucket: typeof S3Bucket;
        BucketPolicy: typeof S3BucketPolicy;
    };
    KinesisFirehose: {
        DeliveryStream: typeof KinesisFirehoseDeliveryStream;
    };
    SDB: {
        Domain: typeof SDBDomain;
    };
    ECR: {
        Repository: typeof ECRRepository;
    };
    DynamoDB: {
        Table: typeof DynamoDBTable;
    };
    Athena: {
        NamedQuery: typeof AthenaNamedQuery;
    };
};
export default _default;
