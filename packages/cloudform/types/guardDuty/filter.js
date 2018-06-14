"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class FindingCriteria {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.FindingCriteria = FindingCriteria;
class Condition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Condition = Condition;
class Filter extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::GuardDuty::Filter', properties);
    }
}
Filter.FindingCriteria = FindingCriteria;
Filter.Condition = Condition;
exports.default = Filter;
