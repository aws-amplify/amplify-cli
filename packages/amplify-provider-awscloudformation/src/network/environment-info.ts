import { AmplifyError, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import {
  EC2Client,
  DescribeAvailabilityZonesCommand,
  DescribeVpcsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import { Netmask } from 'netmask';
import { loadConfiguration } from '../configuration-manager';
import { RESOURCE_TAG } from './stack';

const SUBNETS = 3;
type GetEnvironmentNetworkInfoParams = {
  stackName: string;
  vpcName: string;
  vpcCidr: string;
  subnetMask: number;
  subnetsCount: number;
};

/**
 *
 */
export async function getEnvironmentNetworkInfo(context, params: GetEnvironmentNetworkInfoParams) {
  const { stackName, vpcName, vpcCidr, subnetsCount = SUBNETS, subnetMask } = params;

  const [, vpcMask] = vpcCidr.split('/');

  let cred = {};
  try {
    cred = await loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }

  const ec2Client = new EC2Client(cred);

  const { AvailabilityZones } = await ec2Client.send(new DescribeAvailabilityZonesCommand({}));

  if (subnetsCount > AvailabilityZones.length) {
    const subnets = subnetsCount;
    const AZs = AvailabilityZones.length;

    throw new AmplifyError('ConfigurationError', {
      message: `The requested number of subnets exceeds the number of AZs for the region. ${JSONUtilities.stringify({
        subnets,
        azs: AZs,
      })}`,
    });
  }

  const { Vpcs } = await ec2Client.send(
    new DescribeVpcsCommand({
      Filters: [{ Name: 'tag:Name', Values: [vpcName] }],
    }),
  );

  if (Vpcs.length === 0) {
    // we need a new one
  }

  if (Vpcs.length > 1) {
    // which one to pick?
    // btw, this shouldn't happen
  }

  const [vpc = {}] = Vpcs;

  const { VpcId: vpcId } = vpc;

  if (vpcId && !vpc.CidrBlock.endsWith(vpcMask)) {
    throw new AmplifyError('ConfigurationError', {
      message: 'Not the right mask',
    });
  }

  const { InternetGateways } = await ec2Client.send(
    new DescribeInternetGatewaysCommand({
      Filters: [
        {
          Name: 'attachment.vpc-id',
          Values: [vpcId],
        },
        {
          Name: 'attachment.state',
          Values: ['available'],
        },
      ],
    }),
  );

  if (vpcId && InternetGateways.length === 0) {
    throw new AmplifyError('ConfigurationError', {
      message: `No attached and available Internet Gateway in VPC ${vpcId}`,
    });
  }

  const [{ InternetGatewayId: internetGatewayId = undefined } = {}] = InternetGateways;

  const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));

  const availabilityZonesIterator = new (class implements IterableIterator<string> {
    private counter = 0;

    constructor(private availabilityZones: string[]) {}

    [Symbol.iterator](): IterableIterator<string> {
      return this;
    }

    next(): IteratorResult<string> {
      return {
        value: this.availabilityZones[this.counter++ % this.availabilityZones.length],
        done: false,
      };
    }
  })(AvailabilityZones.map(({ ZoneName }) => ZoneName));

  const envCidrs = new Map<string, string>();
  const existingVpcSubnets = new Set<string>();

  Subnets.forEach(({ Tags, CidrBlock, AvailabilityZone }) => {
    const isFromEnv = Tags.find(({ Key, Value }) => Key === RESOURCE_TAG && Value === stackName);

    if (isFromEnv) {
      envCidrs.set(AvailabilityZone, CidrBlock);
    }

    existingVpcSubnets.add(CidrBlock);
  });

  if (envCidrs.size < subnetsCount) {
    const vpcBlock = new Netmask(vpc.CidrBlock || vpcCidr);
    const [, vpcMask] = vpcBlock.toString().split('/');

    let subnetBlock = new Netmask(vpcBlock.toString().replace(vpcMask, subnetMask));

    while (vpcBlock.contains(subnetBlock.base) && envCidrs.size < subnetsCount) {
      if (!existingVpcSubnets.has(subnetBlock.toString())) {
        let x: IteratorResult<string>;
        do {
          x = availabilityZonesIterator.next();
        } while (envCidrs.has(x.value));

        envCidrs.set(x.value, subnetBlock.toString());
      }

      subnetBlock = subnetBlock.next();
    }
  }

  if (envCidrs.size < subnetsCount) {
    throw new AmplifyError('ConfigurationError', {
      message: 'Not enough CIDRs available in VPC',
    });
  }

  const result = {
    vpcId,
    internetGatewayId,
    subnetCidrs: envCidrs,
  };

  return result;
}
