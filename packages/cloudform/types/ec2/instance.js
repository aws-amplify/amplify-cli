"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ElasticGpuSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ElasticGpuSpecification = ElasticGpuSpecification;
class NetworkInterface {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NetworkInterface = NetworkInterface;
class InstanceIpv6Address {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceIpv6Address = InstanceIpv6Address;
class Volume {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Volume = Volume;
class AssociationParameter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AssociationParameter = AssociationParameter;
class Ebs {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Ebs = Ebs;
class NoDevice {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NoDevice = NoDevice;
class SsmAssociation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SsmAssociation = SsmAssociation;
class CreditSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CreditSpecification = CreditSpecification;
class BlockDeviceMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockDeviceMapping = BlockDeviceMapping;
class PrivateIpAddressSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
class Instance extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::Instance', properties);
    }
}
Instance.ElasticGpuSpecification = ElasticGpuSpecification;
Instance.NetworkInterface = NetworkInterface;
Instance.InstanceIpv6Address = InstanceIpv6Address;
Instance.Volume = Volume;
Instance.AssociationParameter = AssociationParameter;
Instance.Ebs = Ebs;
Instance.NoDevice = NoDevice;
Instance.SsmAssociation = SsmAssociation;
Instance.CreditSpecification = CreditSpecification;
Instance.BlockDeviceMapping = BlockDeviceMapping;
Instance.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
exports.default = Instance;
