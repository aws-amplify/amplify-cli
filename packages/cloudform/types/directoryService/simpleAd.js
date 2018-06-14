"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class VpcSettings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VpcSettings = VpcSettings;
class SimpleAD extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::DirectoryService::SimpleAD', properties);
    }
}
SimpleAD.VpcSettings = VpcSettings;
exports.default = SimpleAD;
