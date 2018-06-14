"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class DnsConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DnsConfig = DnsConfig;
class DnsRecord {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DnsRecord = DnsRecord;
class HealthCheckConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HealthCheckConfig = HealthCheckConfig;
class Service extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ServiceDiscovery::Service', properties);
    }
}
Service.DnsConfig = DnsConfig;
Service.DnsRecord = DnsRecord;
Service.HealthCheckConfig = HealthCheckConfig;
exports.default = Service;
