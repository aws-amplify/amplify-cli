"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class RunCommandParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RunCommandParameters = RunCommandParameters;
class Target {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Target = Target;
class RunCommandTarget {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RunCommandTarget = RunCommandTarget;
class InputTransformer {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputTransformer = InputTransformer;
class KinesisParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisParameters = KinesisParameters;
class EcsParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EcsParameters = EcsParameters;
class Rule extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Events::Rule', properties);
    }
}
Rule.RunCommandParameters = RunCommandParameters;
Rule.Target = Target;
Rule.RunCommandTarget = RunCommandTarget;
Rule.InputTransformer = InputTransformer;
Rule.KinesisParameters = KinesisParameters;
Rule.EcsParameters = EcsParameters;
exports.default = Rule;
