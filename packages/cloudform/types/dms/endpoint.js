"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class S3Settings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3Settings = S3Settings;
class MongoDbSettings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MongoDbSettings = MongoDbSettings;
class DynamoDbSettings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DynamoDbSettings = DynamoDbSettings;
class Endpoint extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::DMS::Endpoint', properties);
    }
}
Endpoint.S3Settings = S3Settings;
Endpoint.MongoDbSettings = MongoDbSettings;
Endpoint.DynamoDbSettings = DynamoDbSettings;
exports.default = Endpoint;
