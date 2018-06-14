/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class LoadBalancer {
    ContainerName?: Value<string>
    ContainerPort: Value<number>
    LoadBalancerName?: Value<string>
    TargetGroupArn?: Value<string>

    constructor(properties: LoadBalancer) {
        Object.assign(this, properties)
    }
}

export class PlacementStrategy {
    Field?: Value<string>
    Type: Value<string>

    constructor(properties: PlacementStrategy) {
        Object.assign(this, properties)
    }
}

export class ServiceRegistry {
    Port?: Value<number>
    RegistryArn?: Value<string>

    constructor(properties: ServiceRegistry) {
        Object.assign(this, properties)
    }
}

export class DeploymentConfiguration {
    MaximumPercent?: Value<number>
    MinimumHealthyPercent?: Value<number>

    constructor(properties: DeploymentConfiguration) {
        Object.assign(this, properties)
    }
}

export class PlacementConstraint {
    Expression?: Value<string>
    Type: Value<string>

    constructor(properties: PlacementConstraint) {
        Object.assign(this, properties)
    }
}

export class AwsVpcConfiguration {
    AssignPublicIp?: Value<string>
    SecurityGroups?: List<Value<string>>
    Subnets: List<Value<string>>

    constructor(properties: AwsVpcConfiguration) {
        Object.assign(this, properties)
    }
}

export class NetworkConfiguration {
    AwsvpcConfiguration?: AwsVpcConfiguration

    constructor(properties: NetworkConfiguration) {
        Object.assign(this, properties)
    }
}

export interface ServiceProperties {
    Cluster?: Value<string>
    DeploymentConfiguration?: DeploymentConfiguration
    DesiredCount?: Value<number>
    HealthCheckGracePeriodSeconds?: Value<number>
    LaunchType?: Value<string>
    LoadBalancers?: List<LoadBalancer>
    NetworkConfiguration?: NetworkConfiguration
    PlacementConstraints?: List<PlacementConstraint>
    PlacementStrategies?: List<PlacementStrategy>
    PlatformVersion?: Value<string>
    Role?: Value<string>
    ServiceName?: Value<string>
    ServiceRegistries?: List<ServiceRegistry>
    TaskDefinition: Value<string>
}

export default class Service extends ResourceBase {
    static LoadBalancer = LoadBalancer
    static PlacementStrategy = PlacementStrategy
    static ServiceRegistry = ServiceRegistry
    static DeploymentConfiguration = DeploymentConfiguration
    static PlacementConstraint = PlacementConstraint
    static AwsVpcConfiguration = AwsVpcConfiguration
    static NetworkConfiguration = NetworkConfiguration

    constructor(properties?: ServiceProperties) {
        super('AWS::ECS::Service', properties)
    }
}
