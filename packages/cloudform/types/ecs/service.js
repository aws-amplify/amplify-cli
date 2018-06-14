"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class LoadBalancer {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoadBalancer = LoadBalancer;
class PlacementStrategy {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PlacementStrategy = PlacementStrategy;
class ServiceRegistry {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ServiceRegistry = ServiceRegistry;
class DeploymentConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DeploymentConfiguration = DeploymentConfiguration;
class PlacementConstraint {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.PlacementConstraint = PlacementConstraint;
class AwsVpcConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AwsVpcConfiguration = AwsVpcConfiguration;
class NetworkConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NetworkConfiguration = NetworkConfiguration;
class Service extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::ECS::Service', properties);
    }
}
Service.LoadBalancer = LoadBalancer;
Service.PlacementStrategy = PlacementStrategy;
Service.ServiceRegistry = ServiceRegistry;
Service.DeploymentConfiguration = DeploymentConfiguration;
Service.PlacementConstraint = PlacementConstraint;
Service.AwsVpcConfiguration = AwsVpcConfiguration;
Service.NetworkConfiguration = NetworkConfiguration;
exports.default = Service;
