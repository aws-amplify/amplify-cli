"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ByteMatchTuple {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ByteMatchTuple = ByteMatchTuple;
class FieldToMatch {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.FieldToMatch = FieldToMatch;
class ByteMatchSet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::WAF::ByteMatchSet', properties);
    }
}
ByteMatchSet.ByteMatchTuple = ByteMatchTuple;
ByteMatchSet.FieldToMatch = FieldToMatch;
exports.default = ByteMatchSet;
