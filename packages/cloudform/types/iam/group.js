"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Policy {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Policy = Policy;
class Group extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::IAM::Group', properties);
    }
}
Group.Policy = Policy;
exports.default = Group;
