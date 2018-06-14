"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class InstanceGroupConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceGroupConfig = InstanceGroupConfig;
class SpotProvisioningSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotProvisioningSpecification = SpotProvisioningSpecification;
class BootstrapActionConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BootstrapActionConfig = BootstrapActionConfig;
class ScalingConstraints {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingConstraints = ScalingConstraints;
class InstanceFleetConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceFleetConfig = InstanceFleetConfig;
class JobFlowInstancesConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.JobFlowInstancesConfig = JobFlowInstancesConfig;
class ScalingAction {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingAction = ScalingAction;
class SimpleScalingPolicyConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration;
class Application {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Application = Application;
class EbsBlockDeviceConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
class PlacementType {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PlacementType = PlacementType;
class Configuration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Configuration = Configuration;
class ScriptBootstrapActionConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScriptBootstrapActionConfig = ScriptBootstrapActionConfig;
class CloudWatchAlarmDefinition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CloudWatchAlarmDefinition = CloudWatchAlarmDefinition;
class EbsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsConfiguration = EbsConfiguration;
class ScalingRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingRule = ScalingRule;
class InstanceTypeConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceTypeConfig = InstanceTypeConfig;
class MetricDimension {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MetricDimension = MetricDimension;
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
class InstanceFleetProvisioningSpecifications {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications;
class ScalingTrigger {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ScalingTrigger = ScalingTrigger;
class Cluster extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EMR::Cluster', properties);
    }
}
Cluster.InstanceGroupConfig = InstanceGroupConfig;
Cluster.SpotProvisioningSpecification = SpotProvisioningSpecification;
Cluster.BootstrapActionConfig = BootstrapActionConfig;
Cluster.ScalingConstraints = ScalingConstraints;
Cluster.InstanceFleetConfig = InstanceFleetConfig;
Cluster.JobFlowInstancesConfig = JobFlowInstancesConfig;
Cluster.ScalingAction = ScalingAction;
Cluster.SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration;
Cluster.Application = Application;
Cluster.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
Cluster.PlacementType = PlacementType;
Cluster.Configuration = Configuration;
Cluster.ScriptBootstrapActionConfig = ScriptBootstrapActionConfig;
Cluster.CloudWatchAlarmDefinition = CloudWatchAlarmDefinition;
Cluster.EbsConfiguration = EbsConfiguration;
Cluster.ScalingRule = ScalingRule;
Cluster.InstanceTypeConfig = InstanceTypeConfig;
Cluster.MetricDimension = MetricDimension;
Cluster.VolumeSpecification = VolumeSpecification;
Cluster.AutoScalingPolicy = AutoScalingPolicy;
Cluster.InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications;
Cluster.ScalingTrigger = ScalingTrigger;
exports.default = Cluster;
