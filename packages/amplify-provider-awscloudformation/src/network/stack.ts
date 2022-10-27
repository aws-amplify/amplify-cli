import * as apigw2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as discovery from 'aws-cdk-lib/aws-servicediscovery';
import * as cdk from 'aws-cdk-lib';
import { $TSAny } from 'amplify-cli-core';
import { Construct } from 'constructs';

export const RESOURCE_TAG = 'amplify-env';

type NetworkStackProps = Readonly<{
  stackName: string;
  vpcName: string;
  vpcId: string;
  internetGatewayId: string;
  subnetCidrs: ReadonlyMap<string, string>;
}>;

export const NETWORK_STACK_LOGICAL_ID = 'NetworkStack';

/**
 * Class to generate Network Stack for Amplify API Containers
 */
export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    const {
      stackName, vpcId = '', vpcName, internetGatewayId = '', subnetCidrs = new Map<string, string>(),
    } = props;

    const { outputVpc, outputIgw, vpcCidrBlock } = createVpc(this, vpcId, vpcName, internetGatewayId);

    createAmplifyEnv(this, stackName, outputVpc as $TSAny, vpcCidrBlock, outputIgw as $TSAny, subnetCidrs);
  }

  /**
   * generates cfn from stack
   */
  toCloudFormation = (): $TSAny => {
    const cfn = this._toCloudFormation();

    return cfn;
  }
}

const createVpc = (scope: Construct, vpcId: string, vpcName: string, internetGatewayId: string): $TSAny => {
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
  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'VpcId', {
    value: outputVpc as $TSAny,
  });
  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'VpcCidrBlock', {
    value: vpcCidrBlock as $TSAny,
  });

  const igw = new ec2.CfnInternetGateway(scope, 'InternetGateway');
  igw.tags.setTag('Name', `${scope.node.id}/${igw.logicalId}`);
  igw.cfnOptions.condition = condition;
  igw.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;

  const outputIgw = cdk.Fn.conditionIf(condition.logicalId, igw.ref, internetGatewayId);
  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'Igw', {
    value: outputIgw as $TSAny,
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

const createAmplifyEnv = (scope: Construct,
  envName: string,
  vpcId: string,
  vpcCidrBlock: string,
  igwId: string,
  subnetCidrs: ReadonlyMap<string, string>): $TSAny => {
  const availabilityZones = [];

  const azSubnetMap = new cdk.CfnMapping(scope, 'AzsMap');
  subnetCidrs.forEach((cidr, az) => {
    availabilityZones.push(az);
    azSubnetMap.setValue(az, 'SubnetCidrBlock', cidr);
  });

  const vpc = ec2.Vpc.fromVpcAttributes(scope, 'vpc', { vpcId, availabilityZones });

  const cluster = new ecs.CfnCluster(scope, 'Cluster');

  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'ClusterName', {
    value: cdk.Fn.ref(cluster.logicalId),
  });

  const subnets: ec2.ISubnet[] = [];

  // eslint-disable-next-line spellcheck/spell-checker
  const pubNacl = new ec2.NetworkAcl(scope, 'Nacl', {
    vpc,
  });
  // eslint-disable-next-line spellcheck/spell-checker
  pubNacl.addEntry('Egress', {
    // eslint-disable-next-line spellcheck/spell-checker
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 100,
    traffic: ec2.AclTraffic.allTraffic(),
    direction: ec2.TrafficDirection.EGRESS,
    ruleAction: ec2.Action.ALLOW,
  });

  // eslint-disable-next-line spellcheck/spell-checker
  pubNacl.addEntry(`IngressVPC`, {
    // eslint-disable-next-line spellcheck/spell-checker
    cidr: ec2.AclCidr.ipv4(vpcCidrBlock),
    ruleNumber: 200,
    traffic: ec2.AclTraffic.allTraffic(),
    direction: ec2.TrafficDirection.INGRESS,
    ruleAction: ec2.Action.DENY,
  });

  // eslint-disable-next-line spellcheck/spell-checker
  pubNacl.addEntry(`IngressInternet`, {
    // eslint-disable-next-line spellcheck/spell-checker
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

      // eslint-disable-next-line spellcheck/spell-checker
      pubNacl.addEntry(`IngressEnv${azId}`, {
        // eslint-disable-next-line spellcheck/spell-checker
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

      // eslint-disable-next-line spellcheck/spell-checker
      const cdfnPublicSubnet = publicSubnet.node.defaultChild as ec2.CfnSubnet;
      // eslint-disable-next-line spellcheck/spell-checker
      cdfnPublicSubnet.tags.setTag(RESOURCE_TAG, envName);

      // eslint-disable-next-line no-new
      new ec2.CfnRoute(scope, `DefaultRoute${azId}`, {
        routeTableId: publicSubnet.routeTable.routeTableId,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igwId,
      });

      // eslint-disable-next-line spellcheck/spell-checker
      publicSubnet.associateNetworkAcl('', pubNacl);

      subnets.push(publicSubnet);
    });

  const subnetIds = subnets.map(({ subnetId }) => subnetId);

  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'SubnetIds', {
    value: subnetIds.join(','),
  });

  const vpcLink = new apigw2.CfnVpcLink(scope, 'VpcLink', {
    name: `${envName}VpcLink`,
    subnetIds,
  });

  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'VpcLinkId', { value: cdk.Fn.ref(vpcLink.logicalId) });

  const namespace = new discovery.PrivateDnsNamespace(scope, 'Namespace', {
    vpc,
    name: cdk.Fn.join('-', [envName, vpc.vpcId]),
  });

  // eslint-disable-next-line no-new
  new cdk.CfnOutput(scope, 'CloudMapNamespaceId', { value: namespace.namespaceId });
};
