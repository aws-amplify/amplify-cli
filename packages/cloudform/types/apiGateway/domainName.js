"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class EndpointConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EndpointConfiguration = EndpointConfiguration;
class DomainName extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApiGateway::DomainName', properties);
    }
}
DomainName.EndpointConfiguration = EndpointConfiguration;
exports.default = DomainName;
