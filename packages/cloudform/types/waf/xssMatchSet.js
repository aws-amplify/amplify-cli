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
class XssMatchTuple {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.XssMatchTuple = XssMatchTuple;
class XssMatchSet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::WAF::XssMatchSet', properties);
    }
}
XssMatchSet.FieldToMatch = FieldToMatch;
XssMatchSet.XssMatchTuple = XssMatchTuple;
exports.default = XssMatchSet;
