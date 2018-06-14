"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class FieldToMatch {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.FieldToMatch = FieldToMatch;
class SizeConstraint {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SizeConstraint = SizeConstraint;
class SizeConstraintSet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::WAF::SizeConstraintSet', properties);
    }
}
SizeConstraintSet.FieldToMatch = FieldToMatch;
SizeConstraintSet.SizeConstraint = SizeConstraint;
exports.default = SizeConstraintSet;
