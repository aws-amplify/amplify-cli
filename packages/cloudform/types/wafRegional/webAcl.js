"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Rule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Rule = Rule;
class Action {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Action = Action;
class WebACL extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::WAFRegional::WebACL', properties);
    }
}
WebACL.Rule = Rule;
WebACL.Action = Action;
exports.default = WebACL;
