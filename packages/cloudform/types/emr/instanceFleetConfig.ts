/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class VolumeSpecification {
    Iops?: Value<number>
    SizeInGB: Value<number>
    VolumeType: Value<string>

    constructor(properties: VolumeSpecification) {
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

export class Configuration {
    Classification?: Value<string>
    ConfigurationProperties?: {[key: string]: Value<string>}
    Configurations?: List<Configuration>

    constructor(properties: Configuration) {
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

export class InstanceFleetProvisioningSpecifications {
    SpotSpecification: SpotProvisioningSpecification

    constructor(properties: InstanceFleetProvisioningSpecifications) {
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

export interface InstanceFleetConfigProperties {
    ClusterId: Value<string>
    InstanceFleetType: Value<string>
    InstanceTypeConfigs?: List<InstanceTypeConfig>
    LaunchSpecifications?: InstanceFleetProvisioningSpecifications
    Name?: Value<string>
    TargetOnDemandCapacity?: Value<number>
    TargetSpotCapacity?: Value<number>
}

export default class InstanceFleetConfig extends ResourceBase {
    static VolumeSpecification = VolumeSpecification
    static SpotProvisioningSpecification = SpotProvisioningSpecification
    static Configuration = Configuration
    static EbsConfiguration = EbsConfiguration
    static InstanceTypeConfig = InstanceTypeConfig
    static InstanceFleetProvisioningSpecifications = InstanceFleetProvisioningSpecifications
    static EbsBlockDeviceConfig = EbsBlockDeviceConfig

    constructor(properties?: InstanceFleetConfigProperties) {
        super('AWS::EMR::InstanceFleetConfig', properties)
    }
}
