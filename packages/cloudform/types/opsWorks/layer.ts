/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class ShutdownEventConfiguration {
    DelayUntilElbConnectionsDrained?: Value<boolean>
    ExecutionTimeout?: Value<number>

    constructor(properties: ShutdownEventConfiguration) {
        Object.assign(this, properties)
    }
}

export class VolumeConfiguration {
    Iops?: Value<number>
    MountPoint?: Value<string>
    NumberOfDisks?: Value<number>
    RaidLevel?: Value<number>
    Size?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: VolumeConfiguration) {
        Object.assign(this, properties)
    }
}

export class AutoScalingThresholds {
    CpuThreshold?: Value<number>
    IgnoreMetricsTime?: Value<number>
    InstanceCount?: Value<number>
    LoadThreshold?: Value<number>
    MemoryThreshold?: Value<number>
    ThresholdsWaitTime?: Value<number>

    constructor(properties: AutoScalingThresholds) {
        Object.assign(this, properties)
    }
}

export class Recipes {
    Configure?: List<Value<string>>
    Deploy?: List<Value<string>>
    Setup?: List<Value<string>>
    Shutdown?: List<Value<string>>
    Undeploy?: List<Value<string>>

    constructor(properties: Recipes) {
        Object.assign(this, properties)
    }
}

export class LifecycleEventConfiguration {
    ShutdownEventConfiguration?: ShutdownEventConfiguration

    constructor(properties: LifecycleEventConfiguration) {
        Object.assign(this, properties)
    }
}

export class LoadBasedAutoScaling {
    DownScaling?: AutoScalingThresholds
    Enable?: Value<boolean>
    UpScaling?: AutoScalingThresholds

    constructor(properties: LoadBasedAutoScaling) {
        Object.assign(this, properties)
    }
}

export interface LayerProperties {
    Attributes?: {[key: string]: Value<string>}
    AutoAssignElasticIps: Value<boolean>
    AutoAssignPublicIps: Value<boolean>
    CustomInstanceProfileArn?: Value<string>
    CustomJson?: any
    CustomRecipes?: Recipes
    CustomSecurityGroupIds?: List<Value<string>>
    EnableAutoHealing: Value<boolean>
    InstallUpdatesOnBoot?: Value<boolean>
    LifecycleEventConfiguration?: LifecycleEventConfiguration
    LoadBasedAutoScaling?: LoadBasedAutoScaling
    Name: Value<string>
    Packages?: List<Value<string>>
    Shortname: Value<string>
    StackId: Value<string>
    Tags?: ResourceTag[]
    Type: Value<string>
    UseEbsOptimizedInstances?: Value<boolean>
    VolumeConfigurations?: List<VolumeConfiguration>
}

export default class Layer extends ResourceBase {
    static ShutdownEventConfiguration = ShutdownEventConfiguration
    static VolumeConfiguration = VolumeConfiguration
    static AutoScalingThresholds = AutoScalingThresholds
    static Recipes = Recipes
    static LifecycleEventConfiguration = LifecycleEventConfiguration
    static LoadBasedAutoScaling = LoadBasedAutoScaling

    constructor(properties?: LayerProperties) {
        super('AWS::OpsWorks::Layer', properties)
    }
}
