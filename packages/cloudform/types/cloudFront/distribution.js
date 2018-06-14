"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Cookies {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Cookies = Cookies;
class LambdaFunctionAssociation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LambdaFunctionAssociation = LambdaFunctionAssociation;
class CustomOriginConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CustomOriginConfig = CustomOriginConfig;
class ForwardedValues {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ForwardedValues = ForwardedValues;
class CacheBehavior {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CacheBehavior = CacheBehavior;
class DefaultCacheBehavior {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DefaultCacheBehavior = DefaultCacheBehavior;
class Restrictions {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Restrictions = Restrictions;
class Origin {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Origin = Origin;
class GeoRestriction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GeoRestriction = GeoRestriction;
class ViewerCertificate {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ViewerCertificate = ViewerCertificate;
class S3OriginConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3OriginConfig = S3OriginConfig;
class CustomErrorResponse {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CustomErrorResponse = CustomErrorResponse;
class Logging {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Logging = Logging;
class DistributionConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DistributionConfig = DistributionConfig;
class OriginCustomHeader {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OriginCustomHeader = OriginCustomHeader;
class Distribution extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CloudFront::Distribution', properties);
    }
}
Distribution.Cookies = Cookies;
Distribution.LambdaFunctionAssociation = LambdaFunctionAssociation;
Distribution.CustomOriginConfig = CustomOriginConfig;
Distribution.ForwardedValues = ForwardedValues;
Distribution.CacheBehavior = CacheBehavior;
Distribution.DefaultCacheBehavior = DefaultCacheBehavior;
Distribution.Restrictions = Restrictions;
Distribution.Origin = Origin;
Distribution.GeoRestriction = GeoRestriction;
Distribution.ViewerCertificate = ViewerCertificate;
Distribution.S3OriginConfig = S3OriginConfig;
Distribution.CustomErrorResponse = CustomErrorResponse;
Distribution.Logging = Logging;
Distribution.DistributionConfig = DistributionConfig;
Distribution.OriginCustomHeader = OriginCustomHeader;
exports.default = Distribution;
