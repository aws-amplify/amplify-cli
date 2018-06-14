"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class LoadBalancerAttribute {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoadBalancerAttribute = LoadBalancerAttribute;
class SubnetMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SubnetMapping = SubnetMapping;
class LoadBalancer extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticLoadBalancingV2::LoadBalancer', properties);
    }
}
LoadBalancer.LoadBalancerAttribute = LoadBalancerAttribute;
LoadBalancer.SubnetMapping = SubnetMapping;
exports.default = LoadBalancer;
