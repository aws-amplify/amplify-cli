"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ContainerDefinition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ContainerDefinition = ContainerDefinition;
class LogConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LogConfiguration = LogConfiguration;
class Device {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Device = Device;
class KeyValuePair {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KeyValuePair = KeyValuePair;
class MountPoint {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MountPoint = MountPoint;
class VolumeFrom {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VolumeFrom = VolumeFrom;
class HostEntry {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HostEntry = HostEntry;
class KernelCapabilities {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.KernelCapabilities = KernelCapabilities;
class TaskDefinitionPlacementConstraint {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TaskDefinitionPlacementConstraint = TaskDefinitionPlacementConstraint;
class Volume {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Volume = Volume;
class HealthCheck {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HealthCheck = HealthCheck;
class PortMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PortMapping = PortMapping;
class Ulimit {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Ulimit = Ulimit;
class LinuxParameters {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LinuxParameters = LinuxParameters;
class HostVolumeProperties {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.HostVolumeProperties = HostVolumeProperties;
class TaskDefinition extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ECS::TaskDefinition', properties);
    }
}
TaskDefinition.ContainerDefinition = ContainerDefinition;
TaskDefinition.LogConfiguration = LogConfiguration;
TaskDefinition.Device = Device;
TaskDefinition.KeyValuePair = KeyValuePair;
TaskDefinition.MountPoint = MountPoint;
TaskDefinition.VolumeFrom = VolumeFrom;
TaskDefinition.HostEntry = HostEntry;
TaskDefinition.KernelCapabilities = KernelCapabilities;
TaskDefinition.TaskDefinitionPlacementConstraint = TaskDefinitionPlacementConstraint;
TaskDefinition.Volume = Volume;
TaskDefinition.HealthCheck = HealthCheck;
TaskDefinition.PortMapping = PortMapping;
TaskDefinition.Ulimit = Ulimit;
TaskDefinition.LinuxParameters = LinuxParameters;
TaskDefinition.HostVolumeProperties = HostVolumeProperties;
exports.default = TaskDefinition;
