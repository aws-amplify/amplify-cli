/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class LifecycleHookSpecification {
    DefaultResult?: Value<string>
    HeartbeatTimeout?: Value<number>
    LifecycleHookName: Value<string>
    LifecycleTransition: Value<string>
    NotificationMetadata?: Value<string>
    NotificationTargetARN?: Value<string>
    RoleARN?: Value<string>

    constructor(properties: LifecycleHookSpecification) {
        Object.assign(this, properties)
    }
}

export class NotificationConfiguration {
    NotificationTypes?: List<Value<string>>
    TopicARN: Value<string>

    constructor(properties: NotificationConfiguration) {
        Object.assign(this, properties)
    }
}

export class MetricsCollection {
    Granularity: Value<string>
    Metrics?: List<Value<string>>

    constructor(properties: MetricsCollection) {
        Object.assign(this, properties)
    }
}

export class TagProperty {
    Key: Value<string>
    PropagateAtLaunch: Value<boolean>
    Value: Value<string>

    constructor(properties: TagProperty) {
        Object.assign(this, properties)
    }
}

export interface AutoScalingGroupProperties {
    AutoScalingGroupName?: Value<string>
    AvailabilityZones?: List<Value<string>>
    Cooldown?: Value<string>
    DesiredCapacity?: Value<string>
    HealthCheckGracePeriod?: Value<number>
    HealthCheckType?: Value<string>
    InstanceId?: Value<string>
    LaunchConfigurationName?: Value<string>
    LifecycleHookSpecificationList?: List<LifecycleHookSpecification>
    LoadBalancerNames?: List<Value<string>>
    MaxSize: Value<string>
    MetricsCollection?: List<MetricsCollection>
    MinSize: Value<string>
    NotificationConfigurations?: List<NotificationConfiguration>
    PlacementGroup?: Value<string>
    Tags?: ResourceTag[]
    TargetGroupARNs?: List<Value<string>>
    TerminationPolicies?: List<Value<string>>
    VPCZoneIdentifier?: List<Value<string>>
}

export default class AutoScalingGroup extends ResourceBase {
    static LifecycleHookSpecification = LifecycleHookSpecification
    static NotificationConfiguration = NotificationConfiguration
    static MetricsCollection = MetricsCollection
    static TagProperty = TagProperty

    constructor(properties?: AutoScalingGroupProperties) {
        super('AWS::AutoScaling::AutoScalingGroup', properties)
    }
}
