"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ConnectionInput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ConnectionInput = ConnectionInput;
class PhysicalConnectionRequirements {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PhysicalConnectionRequirements = PhysicalConnectionRequirements;
class Connection extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Connection', properties);
    }
}
Connection.ConnectionInput = ConnectionInput;
Connection.PhysicalConnectionRequirements = PhysicalConnectionRequirements;
exports.default = Connection;
