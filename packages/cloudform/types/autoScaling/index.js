"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const launchConfiguration_1 = require("./launchConfiguration");
const lifecycleHook_1 = require("./lifecycleHook");
const scalingPolicy_1 = require("./scalingPolicy");
const autoScalingGroup_1 = require("./autoScalingGroup");
const scheduledAction_1 = require("./scheduledAction");
exports.default = {
    LaunchConfiguration: launchConfiguration_1.default,
    LifecycleHook: lifecycleHook_1.default,
    ScalingPolicy: scalingPolicy_1.default,
    AutoScalingGroup: autoScalingGroup_1.default,
    ScheduledAction: scheduledAction_1.default
};
