/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class BlockDeviceMapping {
    DeviceName?: Value<string>
    Ebs?: EbsBlockDevice
    NoDevice?: Value<string>
    VirtualName?: Value<string>

    constructor(properties: BlockDeviceMapping) {
        Object.assign(this, properties)
    }
}

export class EbsBlockDevice {
    DeleteOnTermination?: Value<boolean>
    Iops?: Value<number>
    SnapshotId?: Value<string>
    VolumeSize?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: EbsBlockDevice) {
        Object.assign(this, properties)
    }
}

export class TimeBasedAutoScaling {
    Friday?: {[key: string]: Value<string>}
    Monday?: {[key: string]: Value<string>}
    Saturday?: {[key: string]: Value<string>}
    Sunday?: {[key: string]: Value<string>}
    Thursday?: {[key: string]: Value<string>}
    Tuesday?: {[key: string]: Value<string>}
    Wednesday?: {[key: string]: Value<string>}

    constructor(properties: TimeBasedAutoScaling) {
        Object.assign(this, properties)
    }
}

export interface InstanceProperties {
    AgentVersion?: Value<string>
    AmiId?: Value<string>
    Architecture?: Value<string>
    AutoScalingType?: Value<string>
    AvailabilityZone?: Value<string>
    BlockDeviceMappings?: List<BlockDeviceMapping>
    EbsOptimized?: Value<boolean>
    ElasticIps?: List<Value<string>>
    Hostname?: Value<string>
    InstallUpdatesOnBoot?: Value<boolean>
    InstanceType: Value<string>
    LayerIds: List<Value<string>>
    Os?: Value<string>
    RootDeviceType?: Value<string>
    SshKeyName?: Value<string>
    StackId: Value<string>
    SubnetId?: Value<string>
    Tenancy?: Value<string>
    TimeBasedAutoScaling?: TimeBasedAutoScaling
    VirtualizationType?: Value<string>
    Volumes?: List<Value<string>>
}

export default class Instance extends ResourceBase {
    static BlockDeviceMapping = BlockDeviceMapping
    static EbsBlockDevice = EbsBlockDevice
    static TimeBasedAutoScaling = TimeBasedAutoScaling

    constructor(properties?: InstanceProperties) {
        super('AWS::OpsWorks::Instance', properties)
    }
}
