"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ApiStage {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ApiStage = ApiStage;
class ThrottleSettings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ThrottleSettings = ThrottleSettings;
class QuotaSettings {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.QuotaSettings = QuotaSettings;
class UsagePlan extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApiGateway::UsagePlan', properties);
    }
}
UsagePlan.ApiStage = ApiStage;
UsagePlan.ThrottleSettings = ThrottleSettings;
UsagePlan.QuotaSettings = QuotaSettings;
exports.default = UsagePlan;
