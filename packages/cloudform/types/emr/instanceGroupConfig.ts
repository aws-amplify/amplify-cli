/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class EbsBlockDeviceConfig {
    VolumeSpecification: VolumeSpecification
    VolumesPerInstance?: Value<number>

    constructor(properties: EbsBlockDeviceConfig) {
        Object.assign(this, properties)
    }
}

export class Configuration {
    Classification?: Value<string>
    ConfigurationProperties?: {[key: string]: Value<string>}
    Configurations?: List<Configuration>

    constructor(properties: Configuration) {
        Object.assign(this, properties)
    }
}

export class MetricDimension {
    Key: Value<string>
    Value: Value<string>

    constructor(properties: MetricDimension) {
        Object.assign(this, properties)
    }
}

export class SimpleScalingPolicyConfiguration {
    AdjustmentType?: Value<string>
    CoolDown?: Value<number>
    ScalingAdjustment: Value<number>

    constructor(properties: SimpleScalingPolicyConfiguration) {
        Object.assign(this, properties)
    }
}

export class ScalingRule {
    Action: ScalingAction
    Description?: Value<string>
    Name: Value<string>
    Trigger: ScalingTrigger

    constructor(properties: ScalingRule) {
        Object.assign(this, properties)
    }
}

export class ScalingAction {
    Market?: Value<string>
    SimpleScalingPolicyConfiguration: SimpleScalingPolicyConfiguration

    constructor(properties: ScalingAction) {
        Object.assign(this, properties)
    }
}

export class ScalingTrigger {
    CloudWatchAlarmDefinition: CloudWatchAlarmDefinition

    constructor(properties: ScalingTrigger) {
        Object.assign(this, properties)
    }
}

export class ScalingConstraints {
    MaxCapacity: Value<number>
    MinCapacity: Value<number>

    constructor(properties: ScalingConstraints) {
        Object.assign(this, properties)
    }
}

export class CloudWatchAlarmDefinition {
    ComparisonOperator: Value<string>
    Dimensions?: List<MetricDimension>
    EvaluationPeriods?: Value<number>
    MetricName: Value<string>
    Namespace?: Value<string>
    Period: Value<number>
    Statistic?: Value<string>
    Threshold: Value<number>
    Unit?: Value<string>

    constructor(properties: CloudWatchAlarmDefinition) {
        Object.assign(this, properties)
    }
}

export class VolumeSpecification {
    Iops?: Value<number>
    SizeInGB: Value<number>
    VolumeType: Value<string>

    constructor(properties: VolumeSpecification) {
        Object.assign(this, properties)
    }
}

export class AutoScalingPolicy {
    Constraints: ScalingConstraints
    Rules: List<ScalingRule>

    constructor(properties: AutoScalingPolicy) {
        Object.assign(this, properties)
    }
}

export class EbsConfiguration {
    EbsBlockDeviceConfigs?: List<EbsBlockDeviceConfig>
    EbsOptimized?: Value<boolean>

    constructor(properties: EbsConfiguration) {
        Object.assign(this, properties)
    }
}

export interface InstanceGroupConfigProperties {
    AutoScalingPolicy?: AutoScalingPolicy
    BidPrice?: Value<string>
    Configurations?: List<Configuration>
    EbsConfiguration?: EbsConfiguration
    InstanceCount: Value<number>
    InstanceRole: Value<string>
    InstanceType: Value<string>
    JobFlowId: Value<string>
    Market?: Value<string>
    Name?: Value<string>
}

export default class InstanceGroupConfig extends ResourceBase {
    static EbsBlockDeviceConfig = EbsBlockDeviceConfig
    static Configuration = Configuration
    static MetricDimension = MetricDimension
    static SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration
    static ScalingRule = ScalingRule
    static ScalingAction = ScalingAction
    static ScalingTrigger = ScalingTrigger
    static ScalingConstraints = ScalingConstraints
    static CloudWatchAlarmDefinition = CloudWatchAlarmDefinition
    static VolumeSpecification = VolumeSpecification
    static AutoScalingPolicy = AutoScalingPolicy
    static EbsConfiguration = EbsConfiguration

    constructor(properties?: InstanceGroupConfigProperties) {
        super('AWS::EMR::InstanceGroupConfig', properties)
    }
}
