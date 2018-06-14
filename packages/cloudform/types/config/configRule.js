"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Scope {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Scope = Scope;
class Source {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Source = Source;
class SourceDetail {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SourceDetail = SourceDetail;
class ConfigRule extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Config::ConfigRule', properties);
    }
}
ConfigRule.Scope = Scope;
ConfigRule.Source = Source;
ConfigRule.SourceDetail = SourceDetail;
exports.default = ConfigRule;
