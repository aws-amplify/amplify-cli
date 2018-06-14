"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class EventSelector {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EventSelector = EventSelector;
class DataResource {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DataResource = DataResource;
class Trail extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CloudTrail::Trail', properties);
    }
}
Trail.EventSelector = EventSelector;
Trail.DataResource = DataResource;
exports.default = Trail;
