"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class HadoopJarStepConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HadoopJarStepConfig = HadoopJarStepConfig;
class KeyValue {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KeyValue = KeyValue;
class Step extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EMR::Step', properties);
    }
}
Step.HadoopJarStepConfig = HadoopJarStepConfig;
Step.KeyValue = KeyValue;
exports.default = Step;
