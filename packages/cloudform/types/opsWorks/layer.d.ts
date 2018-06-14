import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ShutdownEventConfiguration {
    DelayUntilElbConnectionsDrained?: Value<boolean>;
    ExecutionTimeout?: Value<number>;
    constructor(properties: ShutdownEventConfiguration);
}
export declare class VolumeConfiguration {
    Iops?: Value<number>;
    MountPoint?: Value<string>;
    NumberOfDisks?: Value<number>;
    RaidLevel?: Value<number>;
    Size?: Value<number>;
    VolumeType?: Value<string>;
    constructor(properties: VolumeConfiguration);
}
export declare class AutoScalingThresholds {
    CpuThreshold?: Value<number>;
    IgnoreMetricsTime?: Value<number>;
    InstanceCount?: Value<number>;
    LoadThreshold?: Value<number>;
    MemoryThreshold?: Value<number>;
    ThresholdsWaitTime?: Value<number>;
    constructor(properties: AutoScalingThresholds);
}
export declare class Recipes {
    Configure?: List<Value<string>>;
    Deploy?: List<Value<string>>;
    Setup?: List<Value<string>>;
    Shutdown?: List<Value<string>>;
    Undeploy?: List<Value<string>>;
    constructor(properties: Recipes);
}
export declare class LifecycleEventConfiguration {
    ShutdownEventConfiguration?: ShutdownEventConfiguration;
    constructor(properties: LifecycleEventConfiguration);
}
export declare class LoadBasedAutoScaling {
    DownScaling?: AutoScalingThresholds;
    Enable?: Value<boolean>;
    UpScaling?: AutoScalingThresholds;
    constructor(properties: LoadBasedAutoScaling);
}
export interface LayerProperties {
    Attributes?: {
        [key: string]: Value<string>;
    };
    AutoAssignElasticIps: Value<boolean>;
    AutoAssignPublicIps: Value<boolean>;
    CustomInstanceProfileArn?: Value<string>;
    CustomJson?: any;
    CustomRecipes?: Recipes;
    CustomSecurityGroupIds?: List<Value<string>>;
    EnableAutoHealing: Value<boolean>;
    InstallUpdatesOnBoot?: Value<boolean>;
    LifecycleEventConfiguration?: LifecycleEventConfiguration;
    LoadBasedAutoScaling?: LoadBasedAutoScaling;
    Name: Value<string>;
    Packages?: List<Value<string>>;
    Shortname: Value<string>;
    StackId: Value<string>;
    Tags?: ResourceTag[];
    Type: Value<string>;
    UseEbsOptimizedInstances?: Value<boolean>;
    VolumeConfigurations?: List<VolumeConfiguration>;
}
export default class Layer extends ResourceBase {
    static ShutdownEventConfiguration: typeof ShutdownEventConfiguration;
    static VolumeConfiguration: typeof VolumeConfiguration;
    static AutoScalingThresholds: typeof AutoScalingThresholds;
    static Recipes: typeof Recipes;
    static LifecycleEventConfiguration: typeof LifecycleEventConfiguration;
    static LoadBasedAutoScaling: typeof LoadBasedAutoScaling;
    constructor(properties?: LayerProperties);
}
