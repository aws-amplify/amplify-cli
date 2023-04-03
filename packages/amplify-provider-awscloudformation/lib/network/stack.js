"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkStack = exports.NETWORK_STACK_LOGICAL_ID = exports.RESOURCE_TAG = void 0;
const apigw2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const discovery = __importStar(require("aws-cdk-lib/aws-servicediscovery"));
const cdk = __importStar(require("aws-cdk-lib"));
exports.RESOURCE_TAG = 'amplify-env';
exports.NETWORK_STACK_LOGICAL_ID = 'NetworkStack';
class NetworkStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id);
        this.toCloudFormation = () => {
            const cfn = this._toCloudFormation();
            return cfn;
        };
        const { stackName, vpcId = '', vpcName, internetGatewayId = '', subnetCidrs = new Map() } = props;
        const { outputVpc, outputIgw, vpcCidrBlock } = createVpc(this, vpcId, vpcName, internetGatewayId);
        createAmplifyEnv(this, stackName, outputVpc, vpcCidrBlock, outputIgw, subnetCidrs);
    }
}
exports.NetworkStack = NetworkStack;
const createVpc = (scope, vpcId, vpcName, internetGatewayId) => {
    const vpcCidrBlock = '10.0.0.0/16';
    const condition = new cdk.CfnCondition(scope, 'UseNewVpcCondition', {
        expression: cdk.Fn.conditionAnd(cdk.Fn.conditionEquals(vpcId, ''), cdk.Fn.conditionEquals(internetGatewayId, '')),
    });
    const vpc = new ec2.Vpc(scope, vpcName, {
        cidr: vpcCidrBlock,
        subnetConfiguration: [],
    });
    vpc.node.defaultChild.tags.setTag('Name', vpcName);
    const cfnVpc = vpc.node.defaultChild;
    cfnVpc.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    cfnVpc.cfnOptions.condition = condition;
    const outputVpc = cdk.Fn.conditionIf(condition.logicalId, vpc.vpcId, vpcId);
    new cdk.CfnOutput(scope, 'VpcId', {
        value: outputVpc,
    });
    new cdk.CfnOutput(scope, 'VpcCidrBlock', {
        value: vpcCidrBlock,
    });
    const igw = new ec2.CfnInternetGateway(scope, 'InternetGateway');
    igw.tags.setTag('Name', `${scope.node.id}/${igw.logicalId}`);
    igw.cfnOptions.condition = condition;
    igw.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    const outputIgw = cdk.Fn.conditionIf(condition.logicalId, igw.ref, internetGatewayId);
    new cdk.CfnOutput(scope, 'Igw', {
        value: outputIgw,
    });
    const att = new ec2.CfnVPCGatewayAttachment(scope, 'VPCGatewayAttachment', {
        vpcId: vpc.vpcId,
        internetGatewayId: igw.ref,
    });
    att.cfnOptions.condition = condition;
    att.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    return {
        outputVpc,
        outputIgw,
        vpcCidrBlock,
    };
};
const createAmplifyEnv = (scope, envName, vpcId, vpcCidrBlock, igwId, subnetCidrs) => {
    const availabilityZones = [];
    const azSubnetMap = new cdk.CfnMapping(scope, 'AzsMap');
    subnetCidrs.forEach((cidr, az) => {
        availabilityZones.push(az);
        azSubnetMap.setValue(az, 'SubnetCidrBlock', cidr);
    });
    const vpc = ec2.Vpc.fromVpcAttributes(scope, 'vpc', { vpcId, availabilityZones });
    const cluster = new ecs.CfnCluster(scope, 'Cluster');
    new cdk.CfnOutput(scope, 'ClusterName', {
        value: cdk.Fn.ref(cluster.logicalId),
    });
    const subnets = [];
    const pubNacl = new ec2.NetworkAcl(scope, 'Nacl', {
        vpc,
    });
    pubNacl.addEntry('Egress', {
        cidr: ec2.AclCidr.anyIpv4(),
        ruleNumber: 100,
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.EGRESS,
        ruleAction: ec2.Action.ALLOW,
    });
    pubNacl.addEntry(`IngressVPC`, {
        cidr: ec2.AclCidr.ipv4(vpcCidrBlock),
        ruleNumber: 200,
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.DENY,
    });
    pubNacl.addEntry(`IngressInternet`, {
        cidr: ec2.AclCidr.anyIpv4(),
        ruleNumber: 300,
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
    });
    Array.from(subnetCidrs.keys())
        .sort()
        .forEach((az, i) => {
        const [, , azId] = az.split('-');
        const cidr = azSubnetMap.findInMap(az, 'SubnetCidrBlock');
        pubNacl.addEntry(`IngressEnv${azId}`, {
            cidr: ec2.AclCidr.ipv4(cidr),
            ruleNumber: 100 + i,
            traffic: ec2.AclTraffic.allTraffic(),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW,
        });
        const publicSubnetName = `PublicSubnet${azId}`;
        const publicSubnet = new ec2.PublicSubnet(scope, publicSubnetName, {
            vpcId,
            cidrBlock: cidr,
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
        });
        const cdfnPublicSubnet = publicSubnet.node.defaultChild;
        cdfnPublicSubnet.tags.setTag(exports.RESOURCE_TAG, envName);
        new ec2.CfnRoute(scope, `DefaultRoute${azId}`, {
            routeTableId: publicSubnet.routeTable.routeTableId,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igwId,
        });
        publicSubnet.associateNetworkAcl('', pubNacl);
        subnets.push(publicSubnet);
    });
    const subnetIds = subnets.map(({ subnetId }) => subnetId);
    new cdk.CfnOutput(scope, 'SubnetIds', {
        value: subnetIds.join(','),
    });
    const vpcLink = new apigw2.CfnVpcLink(scope, 'VpcLink', {
        name: `${envName}VpcLink`,
        subnetIds,
    });
    new cdk.CfnOutput(scope, 'VpcLinkId', { value: cdk.Fn.ref(vpcLink.logicalId) });
    const namespace = new discovery.PrivateDnsNamespace(scope, 'Namespace', {
        vpc,
        name: cdk.Fn.join('-', [envName, vpc.vpcId]),
    });
    new cdk.CfnOutput(scope, 'CloudMapNamespaceId', { value: namespace.namespaceId });
};
//# sourceMappingURL=stack.js.map