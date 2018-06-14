"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ApplicationSource {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ApplicationSource = ApplicationSource;
class ScalingInstruction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingInstruction = ScalingInstruction;
class TargetTrackingConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TargetTrackingConfiguration = TargetTrackingConfiguration;
class CustomizedScalingMetricSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CustomizedScalingMetricSpecification = CustomizedScalingMetricSpecification;
class MetricDimension {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MetricDimension = MetricDimension;
class PredefinedScalingMetricSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PredefinedScalingMetricSpecification = PredefinedScalingMetricSpecification;
class TagFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TagFilter = TagFilter;
class ScalingPlan extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::AutoScalingPlans::ScalingPlan', properties);
    }
}
ScalingPlan.ApplicationSource = ApplicationSource;
ScalingPlan.ScalingInstruction = ScalingInstruction;
ScalingPlan.TargetTrackingConfiguration = TargetTrackingConfiguration;
ScalingPlan.CustomizedScalingMetricSpecification = CustomizedScalingMetricSpecification;
ScalingPlan.MetricDimension = MetricDimension;
ScalingPlan.PredefinedScalingMetricSpecification = PredefinedScalingMetricSpecification;
ScalingPlan.TagFilter = TagFilter;
exports.default = ScalingPlan;
