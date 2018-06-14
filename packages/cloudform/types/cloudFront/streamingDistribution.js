"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class TrustedSigners {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TrustedSigners = TrustedSigners;
class S3Origin {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3Origin = S3Origin;
class Logging {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Logging = Logging;
class StreamingDistributionConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StreamingDistributionConfig = StreamingDistributionConfig;
class StreamingDistribution extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CloudFront::StreamingDistribution', properties);
    }
}
StreamingDistribution.TrustedSigners = TrustedSigners;
StreamingDistribution.S3Origin = S3Origin;
StreamingDistribution.Logging = Logging;
StreamingDistribution.StreamingDistributionConfig = StreamingDistributionConfig;
exports.default = StreamingDistribution;
