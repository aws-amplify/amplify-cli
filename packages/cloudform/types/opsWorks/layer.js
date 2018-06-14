"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class ShutdownEventConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ShutdownEventConfiguration = ShutdownEventConfiguration;
class VolumeConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VolumeConfiguration = VolumeConfiguration;
class AutoScalingThresholds {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AutoScalingThresholds = AutoScalingThresholds;
class Recipes {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Recipes = Recipes;
class LifecycleEventConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LifecycleEventConfiguration = LifecycleEventConfiguration;
class LoadBasedAutoScaling {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoadBasedAutoScaling = LoadBasedAutoScaling;
class Layer extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::OpsWorks::Layer', properties);
    }
}
Layer.ShutdownEventConfiguration = ShutdownEventConfiguration;
Layer.VolumeConfiguration = VolumeConfiguration;
Layer.AutoScalingThresholds = AutoScalingThresholds;
Layer.Recipes = Recipes;
Layer.LifecycleEventConfiguration = LifecycleEventConfiguration;
Layer.LoadBasedAutoScaling = LoadBasedAutoScaling;
exports.default = Layer;
