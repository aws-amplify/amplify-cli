"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class PrivateIpAdd {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PrivateIpAdd = PrivateIpAdd;
class LaunchTemplateData {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LaunchTemplateData = LaunchTemplateData;
class InstanceMarketOptions {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceMarketOptions = InstanceMarketOptions;
class CreditSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CreditSpecification = CreditSpecification;
class Monitoring {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Monitoring = Monitoring;
class Placement {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Placement = Placement;
class BlockDeviceMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockDeviceMapping = BlockDeviceMapping;
class SpotOptions {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotOptions = SpotOptions;
class ElasticGpuSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ElasticGpuSpecification = ElasticGpuSpecification;
class TagSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TagSpecification = TagSpecification;
class Ipv6Add {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Ipv6Add = Ipv6Add;
class IamInstanceProfile {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.IamInstanceProfile = IamInstanceProfile;
class NetworkInterface {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NetworkInterface = NetworkInterface;
class Ebs {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Ebs = Ebs;
class LaunchTemplate extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::LaunchTemplate', properties);
    }
}
LaunchTemplate.PrivateIpAdd = PrivateIpAdd;
LaunchTemplate.LaunchTemplateData = LaunchTemplateData;
LaunchTemplate.InstanceMarketOptions = InstanceMarketOptions;
LaunchTemplate.CreditSpecification = CreditSpecification;
LaunchTemplate.Monitoring = Monitoring;
LaunchTemplate.Placement = Placement;
LaunchTemplate.BlockDeviceMapping = BlockDeviceMapping;
LaunchTemplate.SpotOptions = SpotOptions;
LaunchTemplate.ElasticGpuSpecification = ElasticGpuSpecification;
LaunchTemplate.TagSpecification = TagSpecification;
LaunchTemplate.Ipv6Add = Ipv6Add;
LaunchTemplate.IamInstanceProfile = IamInstanceProfile;
LaunchTemplate.NetworkInterface = NetworkInterface;
LaunchTemplate.Ebs = Ebs;
exports.default = LaunchTemplate;
