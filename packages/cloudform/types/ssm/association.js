"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Target {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Target = Target;
class ParameterValues {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ParameterValues = ParameterValues;
class Association extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SSM::Association', properties);
    }
}
Association.Target = Target;
Association.ParameterValues = ParameterValues;
exports.default = Association;
