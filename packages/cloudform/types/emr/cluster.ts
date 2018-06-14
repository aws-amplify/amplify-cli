/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class InstanceGroupConfig {
    AutoScalingPolicy?: AutoScalingPolicy
    BidPrice?: Value<string>
    Configurations?: List<Configuration>
    EbsConfiguration?: EbsConfiguration
    InstanceCount: Value<number>
    InstanceType: Value<string>
    Market?: Value<string>
    Name?: Value<string>

    constructor(properties: InstanceGroupConfig) {
        Object.assign(this, properties)
    }
}

export class SpotProvisioningSpecification {
    BlockDurationMinutes?: Value<number>
    TimeoutAction: Value<string>
    TimeoutDurationMinutes: Value<number>

    constructor(properties: SpotProvisioningSpecification) {
        Object.assign(this, properties)
    }
}

export class BootstrapActionConfig {
    Name: Value<string>
    ScriptBootstrapAction: ScriptBootstrapActionConfig

    constructor(properties: BootstrapActionConfig) {
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

export class InstanceFleetConfig {
    InstanceTypeConfigs?: List<InstanceTypeConfig>
    LaunchSpecifications?: InstanceFleetProvisioningSpecifications
    Name?: Value<string>
    TargetOnDemandCapacity?: Value<number>
    TargetSpotCapacity?: Value<number>

    constructor(properties: InstanceFleetConfig) {
        Object.assign(this, properties)
    }
}

export class JobFlowInstancesConfig {
    AdditionalMasterSecurityGroups?: List<Value<string>>
    AdditionalSlaveSecurityGroups?: List<Value<string>>
    CoreInstanceFleet?: InstanceFleetConfig
    CoreInstanceGroup?: InstanceGroupConfig
    Ec2KeyName?: Value<string>
    Ec2SubnetId?: Value<string>
    EmrManagedMasterSecurityGroup?: Value<string>
    EmrManagedSlaveSecurityGroup?: Value<string>
    HadoopVersion?: Value<string>
    MasterInstanceFleet?: InstanceFleetConfig
    MasterInstanceGroup?: InstanceGroupConfig
    Placement?: PlacementType
    ServiceAccessSecurityGroup?: Value<string>
    TerminationProtected?: Value<boolean>

    constructor(properties: JobFlowInstancesConfig) {
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

export class SimpleScalingPolicyConfiguration {
    AdjustmentType?: Value<string>
    CoolDown?: Value<number>
    ScalingAdjustment: Value<number>

    constructor(properties: SimpleScalingPolicyConfiguration) {
        Object.assign(this, properties)
    }
}

export class Application {
    AdditionalInfo?: {[key: string]: Value<string>}
    Args?: List<Value<string>>
    Name?: Value<string>
    Version?: Value<string>

    constructor(properties: Application) {
        Object.assign(this, properties)
    }
}

export class EbsBlockDeviceConfig {
    VolumeSpecification: VolumeSpecification
    VolumesPerInstance?: Value<number>

    constructor(properties: EbsBlockDeviceConfig) {
        Object.assign(this, properties)
    }
}

export class PlacementType {
    AvailabilityZone: Value<string>

    constructor(properties: PlacementType) {
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

export class ScriptBootstrapActionConfig {
    Args?: List<Value<string>>
    Path: Value<string>

    constructor(properties: ScriptBootstrapActionConfig) {
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

export class EbsConfiguration {
    EbsBlockDeviceConfigs?: List<EbsBlockDeviceConfig>
    EbsOptimized?: Value<boolean>

    constructor(properties: EbsConfiguration) {
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

export class InstanceTypeConfig {
    BidPrice?: Value<string>
    BidPriceAsPercentageOfOnDemandPrice?: Value<number>
    Configurations?: List<Configuration>
    EbsConfiguration?: EbsConfiguration
    InstanceType: Value<string>
    WeightedCapacity?: Value<number>

    constructor(properties: InstanceTypeConfig) {
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

export class InstanceFleetProvisioningSpecifications {
    SpotSpecification: SpotProvisioningSpecification

    constructor(properties: InstanceFleetProvisioningSpecifications) {
        Object.assign(this, properties)
    }
}

export class ScalingTrigger {
    CloudWatchAlarmDefinition: CloudWatchAlarmDefinition

    constructor(properties: ScalingTrigger) {
        Object.assign(this, properties)
    }
}

export interface ClusterProperties {
    AdditionalInfo?: any
    Applications?: List<Application>
    AutoScalingRole?: Value<string>
    BootstrapActions?: List<BootstrapActionConfig>
    Configurations?: List<Configuration>
    CustomAmiId?: Value<string>
    EbsRootVolumeSize?: Value<number>
    Instances: JobFlowInstancesConfig
    JobFlowRole: Value<string>
    LogUri?: Value<string>
    Name: Value<string>
    ReleaseLabel?: Value<string>
    ScaleDownBehavior?: Value<string>
    SecurityConfiguration?: Value<string>
    ServiceRole: Value<string>
    Tags?: ResourceTag[]
    VisibleToAllUsers?: Value<boolean>
}

export default class Cluster extends ResourceBase {
    static InstanceGroupConfig = InstanceGroupConfig
    static SpotProvisioningSpecification = SpotProvisioningSpecification
    static BootstrapActionConfig = BootstrapActionConfig
    static ScalingConstraints = ScalingConstraints
    static InstanceFleetConfig = InstanceFleetConfig
    static JobFlowInstancesConfig = JobFlowInstancesConfig
    static ScalingAction = ScalingAction
    static SimpleScalingPolicyConfiguration = SimpleScalingPolicyConfiguration
    static Application = Application
    static EbsBlockDeviceConfig = EbsBlockDeviceConfig
    static PlacementType = PlacementType
    static Configuration = Configuration
    static ScriptBootstrapActionConfig = ScriptBootstrapActionConfig
    static CloudWatchAlarmDefinition = CloudWatchAlarmDefinition
    static EbsConfiguration = EbsConfiguration
    static ScalingRule = ScalingRule
    static InstanceTypeConfig = InstanceTypeConfig
    static MetricDimension = MetricDimension
    static VolumeSpecification = VolumeSpecification
    static AutoScalingPolicy = AutoScalingPolicy
    static InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications
    static ScalingTrigger = ScalingTrigger

    constructor(properties?: ClusterProperties) {
        super('AWS::EMR::Cluster', properties)
    }
}
