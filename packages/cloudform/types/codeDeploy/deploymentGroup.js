"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class LoadBalancerInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoadBalancerInfo = LoadBalancerInfo;
class RevisionLocation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RevisionLocation = RevisionLocation;
class S3Location {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3Location = S3Location;
class TriggerConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TriggerConfig = TriggerConfig;
class TagFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TagFilter = TagFilter;
class GitHubLocation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.GitHubLocation = GitHubLocation;
class TargetGroupInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TargetGroupInfo = TargetGroupInfo;
class ELBInfo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ELBInfo = ELBInfo;
class AlarmConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AlarmConfiguration = AlarmConfiguration;
class DeploymentStyle {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DeploymentStyle = DeploymentStyle;
class Alarm {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Alarm = Alarm;
class EC2TagFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EC2TagFilter = EC2TagFilter;
class AutoRollbackConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AutoRollbackConfiguration = AutoRollbackConfiguration;
class Deployment {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Deployment = Deployment;
class DeploymentGroup extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::CodeDeploy::DeploymentGroup', properties);
    }
}
DeploymentGroup.LoadBalancerInfo = LoadBalancerInfo;
DeploymentGroup.RevisionLocation = RevisionLocation;
DeploymentGroup.S3Location = S3Location;
DeploymentGroup.TriggerConfig = TriggerConfig;
DeploymentGroup.TagFilter = TagFilter;
DeploymentGroup.GitHubLocation = GitHubLocation;
DeploymentGroup.TargetGroupInfo = TargetGroupInfo;
DeploymentGroup.ELBInfo = ELBInfo;
DeploymentGroup.AlarmConfiguration = AlarmConfiguration;
DeploymentGroup.DeploymentStyle = DeploymentStyle;
DeploymentGroup.Alarm = Alarm;
DeploymentGroup.EC2TagFilter = EC2TagFilter;
DeploymentGroup.AutoRollbackConfiguration = AutoRollbackConfiguration;
DeploymentGroup.Deployment = Deployment;
exports.default = DeploymentGroup;
