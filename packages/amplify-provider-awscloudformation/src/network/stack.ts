import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as discovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';

export const RESOURCE_TAG = 'amplify-env';

type NetworkStackProps = Readonly<{
  stackName: string;
  vpcName: string;
  vpcId: string;
  internetGatewayId: string;
  subnetCidrs: ReadonlyMap<string, string>;
}>;

export const NETWORK_STACK_LOGICAL_ID = 'NetworkStack';

export class NetworkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    const { stackName, vpcId = '', vpcName, internetGatewayId = '', subnetCidrs = new Map<string, string>() } = props;

    const { outputVpc, outputIgw, vpcCidrBlock } = createVpc(this, vpcId, vpcName, internetGatewayId);

    createAmplifyEnv(this, stackName, outputVpc as any, vpcCidrBlock, outputIgw as any, subnetCidrs);
  }

  toCloudFormation() {
    prepareApp(this);

    const cfn = this._toCloudFormation();

    return cfn;
  }
}

function createVpc(scope: cdk.Construct, vpcId: string, vpcName: string, internetGatewayId: string) {
  const vpcCidrBlock = '10.0.0.0/16';
  const condition = new cdk.CfnCondition(scope, 'UseNewVpcCondition', {
    expression: cdk.Fn.conditionAnd(cdk.Fn.conditionEquals(vpcId, ''), cdk.Fn.conditionEquals(internetGatewayId, '')),
  });

  const vpc = new ec2.Vpc(scope, vpcName, {
    cidr: vpcCidrBlock,
    subnetConfiguration: [],
  });
  (vpc.node.defaultChild as ec2.CfnVPC).tags.setTag('Name', vpcName);

  const cfnVpc = <ec2.CfnVPC>vpc.node.defaultChild;
  cfnVpc.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
  cfnVpc.cfnOptions.condition = condition;

  const outputVpc = cdk.Fn.conditionIf(condition.logicalId, vpc.vpcId, vpcId);
  new cdk.CfnOutput(scope, 'VpcId', {
    value: outputVpc as any,
  });
  new cdk.CfnOutput(scope, 'VpcCidrBlock', {
    value: vpcCidrBlock as any,
  });

  const igw = new ec2.CfnInternetGateway(scope, 'InternetGateway');
  igw.tags.setTag('Name', `${scope.node.id}/${igw.logicalId}`);
  igw.cfnOptions.condition = condition;
  igw.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;

  const outputIgw = cdk.Fn.conditionIf(condition.logicalId, igw.ref, internetGatewayId);
  new cdk.CfnOutput(scope, 'Igw', {
    value: outputIgw as any,
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
}

function createAmplifyEnv(
  scope: cdk.Construct,
  envName: string,
  vpcId: string,
  vpcCidrBlock: string,
  igwId: string,
  subnetCidrs: ReadonlyMap<string, string>,
) {
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

  const subnets: ec2.ISubnet[] = [];

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

      const cdfnPublicSubnet = publicSubnet.node.defaultChild as ec2.CfnSubnet;
      cdfnPublicSubnet.tags.setTag(RESOURCE_TAG, envName);

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
}
