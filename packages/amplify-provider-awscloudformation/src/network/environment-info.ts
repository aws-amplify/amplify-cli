import { EC2 } from "aws-sdk";
import { Netmask } from "netmask";

const SUBNETS = 3;
type GetEnvironmentNetworkInfoParams = {
    stackName: string,
    region: string,
    vpcName: string,
    vpcCidr: string,
    subnetMask: number
    subnetsCount: number,
};

export async function getEnvironmentNetworkInfo(params: GetEnvironmentNetworkInfoParams) {
    const {
        stackName,
        region,
        vpcName,
        vpcCidr,
        subnetsCount = SUBNETS,
        subnetMask,
    } = params;

    const [, vpcMask] = vpcCidr.split('/');

    const ec2 = new EC2({ region });

    const { AvailabilityZones } = await ec2.describeAvailabilityZones().promise();

    if (subnetsCount > AvailabilityZones.length) {
        const subnets = subnetsCount;
        const AZs = AvailabilityZones.length;

        throw new Error(`The requested number of subnets exceeds the number of AZs for the region. ${JSON.stringify({ region, subnets, azs: AZs })}`);
    }

    const { Vpcs } = await ec2
        .describeVpcs({
            Filters: [{ Name: "tag:Name", Values: [vpcName] }],
        })
        .promise();

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
        throw new Error("Not the right mask"); // Should never happen
    }

    /*****************************************************************************/

    const { InternetGateways } = await ec2
        .describeInternetGateways({
            Filters: [
                {
                    Name: "attachment.vpc-id",
                    Values: [vpcId],
                },
                {
                    Name: "attachment.state",
                    Values: ["available"],
                },
            ],
        })
        .promise();

    if (vpcId && InternetGateways.length === 0) {
        throw new Error(`No attached and available Internet Gateway in VPC ${vpcId}`);
    }

    const [{ InternetGatewayId: internetGatewayId = undefined } = {}] = InternetGateways;

    /*****************************************************************************/

    const { Subnets } = await ec2
        .describeSubnets({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] })
        .promise();

    const availabilityZonesIterator = new class implements IterableIterator<string> {
        private iter = 0;

        constructor(private availabilityZones: string[]) { }

        [Symbol.iterator](): IterableIterator<string> {
            return this;
        }

        next(): IteratorResult<string> {
            return {
                value: this.availabilityZones[(this.iter++) % this.availabilityZones.length],
                done: false,
            }
        }
    }(AvailabilityZones.map(({ ZoneName }) => ZoneName));

    const envCidrs = new Map<string, string>();
    const existingVpcSubnets = new Set<string>();

    Subnets
        .forEach(({ Tags, CidrBlock, AvailabilityZone }) => {
            const isFromEnv = Tags.find(({ Key, Value }) => Key === 'amplify-env' && Value === stackName);

            if (isFromEnv) {
                envCidrs.set(AvailabilityZone, CidrBlock);
            }

            existingVpcSubnets.add(CidrBlock);
        });

    if (envCidrs.size < subnetsCount) {
        const vpcBlock = new Netmask(vpc.CidrBlock || vpcCidr);
        const [, vpcMask] = vpcBlock.toString().split('/');

        let subnetBlock = new Netmask(
            vpcBlock.toString().replace(vpcMask, subnetMask)
        );

        while (vpcBlock.contains(subnetBlock.base) && envCidrs.size < subnetsCount) {
            if (!existingVpcSubnets.has(subnetBlock.toString())) {
                let x: IteratorResult<string>;
                do {
                    x = availabilityZonesIterator.next()
                } while (envCidrs.has(x.value));

                envCidrs.set(x.value, subnetBlock.toString());
            }

            subnetBlock = subnetBlock.next();
        }
    }

    if (envCidrs.size < subnetsCount) {
        throw new Error("Not enough CIDRs available in VPC");
    }

    const result = {
        vpcId,
        internetGatewayId,
        subnetCidrs: envCidrs,
    };

    return result;
};
