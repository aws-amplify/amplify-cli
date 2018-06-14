"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class HostedZoneTag {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HostedZoneTag = HostedZoneTag;
class HostedZoneConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HostedZoneConfig = HostedZoneConfig;
class QueryLoggingConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.QueryLoggingConfig = QueryLoggingConfig;
class VPC {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VPC = VPC;
class HostedZone extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Route53::HostedZone', properties);
    }
}
HostedZone.HostedZoneTag = HostedZoneTag;
HostedZone.HostedZoneConfig = HostedZoneConfig;
HostedZone.QueryLoggingConfig = QueryLoggingConfig;
HostedZone.VPC = VPC;
exports.default = HostedZone;
