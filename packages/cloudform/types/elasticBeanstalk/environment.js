"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class OptionSetting {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.OptionSetting = OptionSetting;
class Tier {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Tier = Tier;
class Environment extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticBeanstalk::Environment', properties);
    }
}
Environment.OptionSetting = OptionSetting;
Environment.Tier = Tier;
exports.default = Environment;
