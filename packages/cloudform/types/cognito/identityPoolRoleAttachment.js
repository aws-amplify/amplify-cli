"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class RulesConfigurationType {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RulesConfigurationType = RulesConfigurationType;
class RoleMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RoleMapping = RoleMapping;
class MappingRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MappingRule = MappingRule;
class IdentityPoolRoleAttachment extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Cognito::IdentityPoolRoleAttachment', properties);
    }
}
IdentityPoolRoleAttachment.RulesConfigurationType = RulesConfigurationType;
IdentityPoolRoleAttachment.RoleMapping = RoleMapping;
IdentityPoolRoleAttachment.MappingRule = MappingRule;
exports.default = IdentityPoolRoleAttachment;
