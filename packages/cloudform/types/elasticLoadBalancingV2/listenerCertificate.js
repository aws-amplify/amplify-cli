"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Certificate {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Certificate = Certificate;
class ListenerCertificate extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticLoadBalancingV2::ListenerCertificate', properties);
    }
}
ListenerCertificate.Certificate = Certificate;
exports.default = ListenerCertificate;
