"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ScheduledAction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScheduledAction = ScheduledAction;
class ScalableTargetAction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalableTargetAction = ScalableTargetAction;
class ScalableTarget extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ApplicationAutoScaling::ScalableTarget', properties);
    }
}
ScalableTarget.ScheduledAction = ScheduledAction;
ScalableTarget.ScalableTargetAction = ScalableTargetAction;
exports.default = ScalableTarget;
