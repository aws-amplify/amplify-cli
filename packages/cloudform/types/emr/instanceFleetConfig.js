"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class VolumeSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VolumeSpecification = VolumeSpecification;
class SpotProvisioningSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SpotProvisioningSpecification = SpotProvisioningSpecification;
class Configuration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Configuration = Configuration;
class EbsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsConfiguration = EbsConfiguration;
class InstanceTypeConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceTypeConfig = InstanceTypeConfig;
class InstanceFleetProvisioningSpecifications {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications;
class EbsBlockDeviceConfig {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
class InstanceFleetConfig extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EMR::InstanceFleetConfig', properties);
    }
}
InstanceFleetConfig.VolumeSpecification = VolumeSpecification;
InstanceFleetConfig.SpotProvisioningSpecification = SpotProvisioningSpecification;
InstanceFleetConfig.Configuration = Configuration;
InstanceFleetConfig.EbsConfiguration = EbsConfiguration;
InstanceFleetConfig.InstanceTypeConfig = InstanceTypeConfig;
InstanceFleetConfig.InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications;
InstanceFleetConfig.EbsBlockDeviceConfig = EbsBlockDeviceConfig;
exports.default = InstanceFleetConfig;
