"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class InstanceAssociationOutputLocation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceAssociationOutputLocation = InstanceAssociationOutputLocation;
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
class S3OutputLocation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3OutputLocation = S3OutputLocation;
class Association extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SSM::Association', properties);
    }
}
Association.InstanceAssociationOutputLocation = InstanceAssociationOutputLocation;
Association.Target = Target;
Association.ParameterValues = ParameterValues;
Association.S3OutputLocation = S3OutputLocation;
exports.default = Association;
