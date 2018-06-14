"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class BlockDeviceMapping {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockDeviceMapping = BlockDeviceMapping;
class BlockDevice {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BlockDevice = BlockDevice;
class LaunchConfiguration extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::AutoScaling::LaunchConfiguration', properties);
    }
}
LaunchConfiguration.BlockDeviceMapping = BlockDeviceMapping;
LaunchConfiguration.BlockDevice = BlockDevice;
exports.default = LaunchConfiguration;
