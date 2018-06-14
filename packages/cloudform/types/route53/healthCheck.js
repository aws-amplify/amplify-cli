"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class HealthCheckConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HealthCheckConfig = HealthCheckConfig;
class HealthCheckTag {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HealthCheckTag = HealthCheckTag;
class AlarmIdentifier {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AlarmIdentifier = AlarmIdentifier;
class HealthCheck extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Route53::HealthCheck', properties);
    }
}
HealthCheck.HealthCheckConfig = HealthCheckConfig;
HealthCheck.HealthCheckTag = HealthCheckTag;
HealthCheck.AlarmIdentifier = AlarmIdentifier;
exports.default = HealthCheck;
