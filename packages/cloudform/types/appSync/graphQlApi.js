"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class OpenIDConnectConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OpenIDConnectConfig = OpenIDConnectConfig;
class LogConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LogConfig = LogConfig;
class UserPoolConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.UserPoolConfig = UserPoolConfig;
class GraphQLApi extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::AppSync::GraphQLApi', properties);
    }
}
GraphQLApi.OpenIDConnectConfig = OpenIDConnectConfig;
GraphQLApi.LogConfig = LogConfig;
GraphQLApi.UserPoolConfig = UserPoolConfig;
exports.default = GraphQLApi;
