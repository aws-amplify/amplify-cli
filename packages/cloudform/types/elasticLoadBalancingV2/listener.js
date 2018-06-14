"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Action {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Action = Action;
class Certificate {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Certificate = Certificate;
class Listener extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticLoadBalancingV2::Listener', properties);
    }
}
Listener.Action = Action;
Listener.Certificate = Certificate;
exports.default = Listener;
