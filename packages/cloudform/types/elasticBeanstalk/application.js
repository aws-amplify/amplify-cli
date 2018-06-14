"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ApplicationResourceLifecycleConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ApplicationResourceLifecycleConfig = ApplicationResourceLifecycleConfig;
class ApplicationVersionLifecycleConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ApplicationVersionLifecycleConfig = ApplicationVersionLifecycleConfig;
class MaxCountRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaxCountRule = MaxCountRule;
class MaxAgeRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MaxAgeRule = MaxAgeRule;
class Application extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ElasticBeanstalk::Application', properties);
    }
}
Application.ApplicationResourceLifecycleConfig = ApplicationResourceLifecycleConfig;
Application.ApplicationVersionLifecycleConfig = ApplicationVersionLifecycleConfig;
Application.MaxCountRule = MaxCountRule;
Application.MaxAgeRule = MaxAgeRule;
exports.default = Application;
