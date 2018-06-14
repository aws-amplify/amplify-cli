"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class MethodResponse {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MethodResponse = MethodResponse;
class Integration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Integration = Integration;
class IntegrationResponse {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.IntegrationResponse = IntegrationResponse;
class Method extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApiGateway::Method', properties);
    }
}
Method.MethodResponse = MethodResponse;
Method.Integration = Integration;
Method.IntegrationResponse = IntegrationResponse;
exports.default = Method;
