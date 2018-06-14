"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class GeoLocation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GeoLocation = GeoLocation;
class AliasTarget {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AliasTarget = AliasTarget;
class RecordSet extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Route53::RecordSet', properties);
    }
}
RecordSet.GeoLocation = GeoLocation;
RecordSet.AliasTarget = AliasTarget;
exports.default = RecordSet;
