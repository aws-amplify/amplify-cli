"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class FieldToMatch {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.FieldToMatch = FieldToMatch;
class SqlInjectionMatchTuple {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SqlInjectionMatchTuple = SqlInjectionMatchTuple;
class SqlInjectionMatchSet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::WAFRegional::SqlInjectionMatchSet', properties);
    }
}
SqlInjectionMatchSet.FieldToMatch = FieldToMatch;
SqlInjectionMatchSet.SqlInjectionMatchTuple = SqlInjectionMatchTuple;
exports.default = SqlInjectionMatchSet;
