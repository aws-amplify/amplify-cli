"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class MappingParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MappingParameters = MappingParameters;
class CSVMappingParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CSVMappingParameters = CSVMappingParameters;
class KinesisStreamsInput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisStreamsInput = KinesisStreamsInput;
class Input {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Input = Input;
class InputSchema {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputSchema = InputSchema;
class RecordColumn {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RecordColumn = RecordColumn;
class RecordFormat {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RecordFormat = RecordFormat;
class KinesisFirehoseInput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisFirehoseInput = KinesisFirehoseInput;
class InputParallelism {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputParallelism = InputParallelism;
class InputProcessingConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputProcessingConfiguration = InputProcessingConfiguration;
class JSONMappingParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.JSONMappingParameters = JSONMappingParameters;
class InputLambdaProcessor {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InputLambdaProcessor = InputLambdaProcessor;
class Application extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::KinesisAnalytics::Application', properties);
    }
}
Application.MappingParameters = MappingParameters;
Application.CSVMappingParameters = CSVMappingParameters;
Application.KinesisStreamsInput = KinesisStreamsInput;
Application.Input = Input;
Application.InputSchema = InputSchema;
Application.RecordColumn = RecordColumn;
Application.RecordFormat = RecordFormat;
Application.KinesisFirehoseInput = KinesisFirehoseInput;
Application.InputParallelism = InputParallelism;
Application.InputProcessingConfiguration = InputProcessingConfiguration;
Application.JSONMappingParameters = JSONMappingParameters;
Application.InputLambdaProcessor = InputLambdaProcessor;
exports.default = Application;
