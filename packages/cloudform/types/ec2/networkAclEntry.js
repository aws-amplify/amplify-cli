"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Icmp {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Icmp = Icmp;
class PortRange {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PortRange = PortRange;
class NetworkAclEntry extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::NetworkAclEntry', properties);
    }
}
NetworkAclEntry.Icmp = Icmp;
NetworkAclEntry.PortRange = PortRange;
exports.default = NetworkAclEntry;
