"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class OptionSetting {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OptionSetting = OptionSetting;
class OptionConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OptionConfiguration = OptionConfiguration;
class OptionGroup extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::RDS::OptionGroup', properties);
    }
}
OptionGroup.OptionSetting = OptionSetting;
OptionGroup.OptionConfiguration = OptionConfiguration;
exports.default = OptionGroup;
