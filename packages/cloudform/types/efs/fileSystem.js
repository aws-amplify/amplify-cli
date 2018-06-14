"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ElasticFileSystemTag {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ElasticFileSystemTag = ElasticFileSystemTag;
class FileSystem extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EFS::FileSystem', properties);
    }
}
FileSystem.ElasticFileSystemTag = ElasticFileSystemTag;
exports.default = FileSystem;
