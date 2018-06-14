"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Location {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Location = Location;
class DocumentationPart extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApiGateway::DocumentationPart', properties);
    }
}
DocumentationPart.Location = Location;
exports.default = DocumentationPart;
