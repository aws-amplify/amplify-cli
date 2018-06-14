"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class CacheCluster extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElastiCache::CacheCluster', properties);
    }
}
exports.default = CacheCluster;
