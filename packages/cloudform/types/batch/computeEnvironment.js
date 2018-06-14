"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ComputeResources {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ComputeResources = ComputeResources;
class ComputeEnvironment extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Batch::ComputeEnvironment', properties);
    }
}
ComputeEnvironment.ComputeResources = ComputeResources;
exports.default = ComputeEnvironment;
