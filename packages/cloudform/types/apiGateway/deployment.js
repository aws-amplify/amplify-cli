"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class MethodSetting {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MethodSetting = MethodSetting;
class StageDescription {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StageDescription = StageDescription;
class Deployment extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApiGateway::Deployment', properties);
    }
}
Deployment.MethodSetting = MethodSetting;
Deployment.StageDescription = StageDescription;
exports.default = Deployment;
