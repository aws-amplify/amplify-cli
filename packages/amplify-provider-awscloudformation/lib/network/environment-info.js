"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentNetworkInfo = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const netmask_1 = require("netmask");
const configuration_manager_1 = require("../configuration-manager");
const stack_1 = require("./stack");
const SUBNETS = 3;
async function getEnvironmentNetworkInfo(context, params) {
    const { stackName, vpcName, vpcCidr, subnetsCount = SUBNETS, subnetMask } = params;
    const [, vpcMask] = vpcCidr.split('/');
    let cred = {};
    try {
        cred = await (0, configuration_manager_1.loadConfiguration)(context);
    }
    catch (e) {
    }
    const ec2 = new aws_sdk_1.EC2({ ...cred });
    const { AvailabilityZones } = await ec2.describeAvailabilityZones().promise();
    if (subnetsCount > AvailabilityZones.length) {
        const subnets = subnetsCount;
        const AZs = AvailabilityZones.length;
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `The requested number of subnets exceeds the number of AZs for the region. ${amplify_cli_core_1.JSONUtilities.stringify({
                subnets,
                azs: AZs,
            })}`,
        });
    }
    const { Vpcs } = await ec2
        .describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: [vpcName] }],
    })
        .promise();
    if (Vpcs.length === 0) {
    }
    if (Vpcs.length > 1) {
    }
    const [vpc = {}] = Vpcs;
    const { VpcId: vpcId } = vpc;
    if (vpcId && !vpc.CidrBlock.endsWith(vpcMask)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Not the right mask',
        });
    }
    const { InternetGateways } = await ec2
        .describeInternetGateways({
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
    })
        .promise();
    if (vpcId && InternetGateways.length === 0) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `No attached and available Internet Gateway in VPC ${vpcId}`,
        });
    }
    const [{ InternetGatewayId: internetGatewayId = undefined } = {}] = InternetGateways;
    const { Subnets } = await ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }).promise();
    const availabilityZonesIterator = new (class {
        constructor(availabilityZones) {
            this.availabilityZones = availabilityZones;
            this.counter = 0;
        }
        [Symbol.iterator]() {
            return this;
        }
        next() {
            return {
                value: this.availabilityZones[this.counter++ % this.availabilityZones.length],
                done: false,
            };
        }
    })(AvailabilityZones.map(({ ZoneName }) => ZoneName));
    const envCidrs = new Map();
    const existingVpcSubnets = new Set();
    Subnets.forEach(({ Tags, CidrBlock, AvailabilityZone }) => {
        const isFromEnv = Tags.find(({ Key, Value }) => Key === stack_1.RESOURCE_TAG && Value === stackName);
        if (isFromEnv) {
            envCidrs.set(AvailabilityZone, CidrBlock);
        }
        existingVpcSubnets.add(CidrBlock);
    });
    if (envCidrs.size < subnetsCount) {
        const vpcBlock = new netmask_1.Netmask(vpc.CidrBlock || vpcCidr);
        const [, vpcMask] = vpcBlock.toString().split('/');
        let subnetBlock = new netmask_1.Netmask(vpcBlock.toString().replace(vpcMask, subnetMask));
        while (vpcBlock.contains(subnetBlock.base) && envCidrs.size < subnetsCount) {
            if (!existingVpcSubnets.has(subnetBlock.toString())) {
                let x;
                do {
                    x = availabilityZonesIterator.next();
                } while (envCidrs.has(x.value));
                envCidrs.set(x.value, subnetBlock.toString());
            }
            subnetBlock = subnetBlock.next();
        }
    }
    if (envCidrs.size < subnetsCount) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
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
exports.getEnvironmentNetworkInfo = getEnvironmentNetworkInfo;
//# sourceMappingURL=environment-info.js.map