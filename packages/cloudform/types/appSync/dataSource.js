"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class LambdaConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LambdaConfig = LambdaConfig;
class DynamoDBConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DynamoDBConfig = DynamoDBConfig;
class ElasticsearchConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ElasticsearchConfig = ElasticsearchConfig;
class DataSource extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::AppSync::DataSource', properties);
    }
}
DataSource.LambdaConfig = LambdaConfig;
DataSource.DynamoDBConfig = DynamoDBConfig;
DataSource.ElasticsearchConfig = ElasticsearchConfig;
exports.default = DataSource;
