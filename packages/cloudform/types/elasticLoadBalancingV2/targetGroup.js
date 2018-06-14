"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class TargetGroupAttribute {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TargetGroupAttribute = TargetGroupAttribute;
class Matcher {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Matcher = Matcher;
class TargetDescription {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TargetDescription = TargetDescription;
class TargetGroup extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticLoadBalancingV2::TargetGroup', properties);
    }
}
TargetGroup.TargetGroupAttribute = TargetGroupAttribute;
TargetGroup.Matcher = Matcher;
TargetGroup.TargetDescription = TargetDescription;
exports.default = TargetGroup;
