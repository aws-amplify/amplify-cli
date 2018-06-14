"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class TemplateInner {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TemplateInner = TemplateInner;
class Template extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SES::Template', properties);
    }
}
Template.Template = TemplateInner;
exports.default = Template;
