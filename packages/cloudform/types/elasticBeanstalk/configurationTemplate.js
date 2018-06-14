"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class SourceConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SourceConfiguration = SourceConfiguration;
class ConfigurationOptionSetting {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ConfigurationOptionSetting = ConfigurationOptionSetting;
class ConfigurationTemplate extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticBeanstalk::ConfigurationTemplate', properties);
    }
}
ConfigurationTemplate.SourceConfiguration = SourceConfiguration;
ConfigurationTemplate.ConfigurationOptionSetting = ConfigurationOptionSetting;
exports.default = ConfigurationTemplate;
