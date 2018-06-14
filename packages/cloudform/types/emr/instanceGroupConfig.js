"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class EbsBlockDeviceConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
class Configuration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Configuration = Configuration;
class MetricDimension {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MetricDimension = MetricDimension;
class SimpleScalingPolicyConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration;
class ScalingRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingRule = ScalingRule;
class ScalingAction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingAction = ScalingAction;
class ScalingTrigger {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingTrigger = ScalingTrigger;
class ScalingConstraints {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingConstraints = ScalingConstraints;
class CloudWatchAlarmDefinition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CloudWatchAlarmDefinition = CloudWatchAlarmDefinition;
class VolumeSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VolumeSpecification = VolumeSpecification;
class AutoScalingPolicy {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AutoScalingPolicy = AutoScalingPolicy;
class EbsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsConfiguration = EbsConfiguration;
class InstanceGroupConfig extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EMR::InstanceGroupConfig', properties);
    }
}
InstanceGroupConfig.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
InstanceGroupConfig.Configuration = Configuration;
InstanceGroupConfig.MetricDimension = MetricDimension;
InstanceGroupConfig.SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration;
InstanceGroupConfig.ScalingRule = ScalingRule;
InstanceGroupConfig.ScalingAction = ScalingAction;
InstanceGroupConfig.ScalingTrigger = ScalingTrigger;
InstanceGroupConfig.ScalingConstraints = ScalingConstraints;
InstanceGroupConfig.CloudWatchAlarmDefinition = CloudWatchAlarmDefinition;
InstanceGroupConfig.VolumeSpecification = VolumeSpecification;
InstanceGroupConfig.AutoScalingPolicy = AutoScalingPolicy;
InstanceGroupConfig.EbsConfiguration = EbsConfiguration;
exports.default = InstanceGroupConfig;
