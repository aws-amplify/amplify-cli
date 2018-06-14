"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Action {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Action = Action;
class Condition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Condition = Condition;
class Predicate {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Predicate = Predicate;
class Trigger extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Glue::Trigger', properties);
    }
}
Trigger.Action = Action;
Trigger.Condition = Condition;
Trigger.Predicate = Predicate;
exports.default = Trigger;
