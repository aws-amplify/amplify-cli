"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class IamInstanceProfileSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.IamInstanceProfileSpecification = IamInstanceProfileSpecification;
class InstanceNetworkInterfaceSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceNetworkInterfaceSpecification = InstanceNetworkInterfaceSpecification;
class SpotFleetTagSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotFleetTagSpecification = SpotFleetTagSpecification;
class PrivateIpAddressSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
class SpotFleetLaunchSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotFleetLaunchSpecification = SpotFleetLaunchSpecification;
class SpotPlacement {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotPlacement = SpotPlacement;
class SpotFleetRequestConfigData {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotFleetRequestConfigData = SpotFleetRequestConfigData;
class EbsBlockDevice {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsBlockDevice = EbsBlockDevice;
class InstanceIpv6Address {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceIpv6Address = InstanceIpv6Address;
class GroupIdentifier {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GroupIdentifier = GroupIdentifier;
class SpotFleetMonitoring {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotFleetMonitoring = SpotFleetMonitoring;
class BlockDeviceMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockDeviceMapping = BlockDeviceMapping;
class SpotFleet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::SpotFleet', properties);
    }
}
SpotFleet.IamInstanceProfileSpecification = IamInstanceProfileSpecification;
SpotFleet.InstanceNetworkInterfaceSpecification = InstanceNetworkInterfaceSpecification;
SpotFleet.SpotFleetTagSpecification = SpotFleetTagSpecification;
SpotFleet.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
SpotFleet.SpotFleetLaunchSpecification = SpotFleetLaunchSpecification;
SpotFleet.SpotPlacement = SpotPlacement;
SpotFleet.SpotFleetRequestConfigData = SpotFleetRequestConfigData;
SpotFleet.EbsBlockDevice = EbsBlockDevice;
SpotFleet.InstanceIpv6Address = InstanceIpv6Address;
SpotFleet.GroupIdentifier = GroupIdentifier;
SpotFleet.SpotFleetMonitoring = SpotFleetMonitoring;
SpotFleet.BlockDeviceMapping = BlockDeviceMapping;
exports.default = SpotFleet;
