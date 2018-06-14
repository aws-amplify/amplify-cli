"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class VpcConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VpcConfig = VpcConfig;
class DeadLetterConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DeadLetterConfig = DeadLetterConfig;
class TracingConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TracingConfig = TracingConfig;
class Code {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Code = Code;
class Environment {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Environment = Environment;
class Function extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Lambda::Function', properties);
    }
}
Function.VpcConfig = VpcConfig;
Function.DeadLetterConfig = DeadLetterConfig;
Function.TracingConfig = TracingConfig;
Function.Code = Code;
Function.Environment = Environment;
exports.default = Function;
