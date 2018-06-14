"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ParameterAttribute {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ParameterAttribute = ParameterAttribute;
class PipelineTag {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PipelineTag = PipelineTag;
class ParameterObject {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ParameterObject = ParameterObject;
class PipelineObject {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PipelineObject = PipelineObject;
class ParameterValue {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ParameterValue = ParameterValue;
class Field {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Field = Field;
class Pipeline extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::DataPipeline::Pipeline', properties);
    }
}
Pipeline.ParameterAttribute = ParameterAttribute;
Pipeline.PipelineTag = PipelineTag;
Pipeline.ParameterObject = ParameterObject;
Pipeline.PipelineObject = PipelineObject;
Pipeline.ParameterValue = ParameterValue;
Pipeline.Field = Field;
exports.default = Pipeline;
