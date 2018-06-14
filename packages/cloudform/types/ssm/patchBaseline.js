"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class RuleGroup {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RuleGroup = RuleGroup;
class PatchFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PatchFilter = PatchFilter;
class Rule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Rule = Rule;
class PatchFilterGroup {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PatchFilterGroup = PatchFilterGroup;
class PatchSource {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PatchSource = PatchSource;
class PatchBaseline extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SSM::PatchBaseline', properties);
    }
}
PatchBaseline.RuleGroup = RuleGroup;
PatchBaseline.PatchFilter = PatchFilter;
PatchBaseline.Rule = Rule;
PatchBaseline.PatchFilterGroup = PatchFilterGroup;
PatchBaseline.PatchSource = PatchSource;
exports.default = PatchBaseline;
