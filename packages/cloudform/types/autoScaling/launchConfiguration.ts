/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class BlockDeviceMapping {
    DeviceName: Value<string>
    Ebs?: BlockDevice
    NoDevice?: Value<boolean>
    VirtualName?: Value<string>

    constructor(properties: BlockDeviceMapping) {
        Object.assign(this, properties)
    }
}

export class BlockDevice {
    DeleteOnTermination?: Value<boolean>
    Encrypted?: Value<boolean>
    Iops?: Value<number>
    SnapshotId?: Value<string>
    VolumeSize?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: BlockDevice) {
        Object.assign(this, properties)
    }
}

export interface LaunchConfigurationProperties {
    AssociatePublicIpAddress?: Value<boolean>
    BlockDeviceMappings?: List<BlockDeviceMapping>
    ClassicLinkVPCId?: Value<string>
    ClassicLinkVPCSecurityGroups?: List<Value<string>>
    EbsOptimized?: Value<boolean>
    IamInstanceProfile?: Value<string>
    ImageId: Value<string>
    InstanceId?: Value<string>
    InstanceMonitoring?: Value<boolean>
    InstanceType: Value<string>
    KernelId?: Value<string>
    KeyName?: Value<string>
    LaunchConfigurationName?: Value<string>
    PlacementTenancy?: Value<string>
    RamDiskId?: Value<string>
    SecurityGroups?: List<Value<string>>
    SpotPrice?: Value<string>
    UserData?: Value<string>
}

export default class LaunchConfiguration extends ResourceBase {
    static BlockDeviceMapping = BlockDeviceMapping
    static BlockDevice = BlockDevice

    constructor(properties?: LaunchConfigurationProperties) {
        super('AWS::AutoScaling::LaunchConfiguration', properties)
    }
}
