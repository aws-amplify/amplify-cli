"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class InstanceIpv6Address {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceIpv6Address = InstanceIpv6Address;
class PrivateIpAddressSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
class NetworkInterface extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::NetworkInterface', properties);
    }
}
NetworkInterface.InstanceIpv6Address = InstanceIpv6Address;
NetworkInterface.PrivateIpAddressSpecification = PrivateIpAddressSpecification;
exports.default = NetworkInterface;
