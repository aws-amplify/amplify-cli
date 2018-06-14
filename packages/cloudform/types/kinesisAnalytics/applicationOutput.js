"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class KinesisFirehoseOutput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisFirehoseOutput = KinesisFirehoseOutput;
class KinesisStreamsOutput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KinesisStreamsOutput = KinesisStreamsOutput;
class Output {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Output = Output;
class LambdaOutput {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LambdaOutput = LambdaOutput;
class DestinationSchema {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DestinationSchema = DestinationSchema;
class ApplicationOutput extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::KinesisAnalytics::ApplicationOutput', properties);
    }
}
ApplicationOutput.KinesisFirehoseOutput = KinesisFirehoseOutput;
ApplicationOutput.KinesisStreamsOutput = KinesisStreamsOutput;
ApplicationOutput.Output = Output;
ApplicationOutput.LambdaOutput = LambdaOutput;
ApplicationOutput.DestinationSchema = DestinationSchema;
exports.default = ApplicationOutput;
