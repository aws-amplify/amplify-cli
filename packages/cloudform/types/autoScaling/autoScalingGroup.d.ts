import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class LifecycleHookSpecification {
    DefaultResult?: Value<string>;
    HeartbeatTimeout?: Value<number>;
    LifecycleHookName: Value<string>;
    LifecycleTransition: Value<string>;
    NotificationMetadata?: Value<string>;
    NotificationTargetARN?: Value<string>;
    RoleARN?: Value<string>;
    constructor(properties: LifecycleHookSpecification);
}
export declare class NotificationConfiguration {
    NotificationTypes?: List<Value<string>>;
    TopicARN: Value<string>;
    constructor(properties: NotificationConfiguration);
}
export declare class MetricsCollection {
    Granularity: Value<string>;
    Metrics?: List<Value<string>>;
    constructor(properties: MetricsCollection);
}
export declare class TagProperty {
    Key: Value<string>;
    PropagateAtLaunch: Value<boolean>;
    Value: Value<string>;
    constructor(properties: TagProperty);
}
export interface AutoScalingGroupProperties {
    AutoScalingGroupName?: Value<string>;
    AvailabilityZones?: List<Value<string>>;
    Cooldown?: Value<string>;
    DesiredCapacity?: Value<string>;
    HealthCheckGracePeriod?: Value<number>;
    HealthCheckType?: Value<string>;
    InstanceId?: Value<string>;
    LaunchConfigurationName?: Value<string>;
    LifecycleHookSpecificationList?: List<LifecycleHookSpecification>;
    LoadBalancerNames?: List<Value<string>>;
    MaxSize: Value<string>;
    MetricsCollection?: List<MetricsCollection>;
    MinSize: Value<string>;
    NotificationConfigurations?: List<NotificationConfiguration>;
    PlacementGroup?: Value<string>;
    Tags?: ResourceTag[];
    TargetGroupARNs?: List<Value<string>>;
    TerminationPolicies?: List<Value<string>>;
    VPCZoneIdentifier?: List<Value<string>>;
}
export default class AutoScalingGroup extends ResourceBase {
    static LifecycleHookSpecification: typeof LifecycleHookSpecification;
    static NotificationConfiguration: typeof NotificationConfiguration;
    static MetricsCollection: typeof MetricsCollection;
    static TagProperty: typeof TagProperty;
    constructor(properties?: AutoScalingGroupProperties);
}
