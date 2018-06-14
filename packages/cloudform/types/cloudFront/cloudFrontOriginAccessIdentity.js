"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class CloudFrontOriginAccessIdentityConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CloudFrontOriginAccessIdentityConfig = CloudFrontOriginAccessIdentityConfig;
class CloudFrontOriginAccessIdentity extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CloudFront::CloudFrontOriginAccessIdentity', properties);
    }
}
CloudFrontOriginAccessIdentity.CloudFrontOriginAccessIdentityConfig = CloudFrontOriginAccessIdentityConfig;
exports.default = CloudFrontOriginAccessIdentity;
