/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class IamInstanceProfileSpecification {
    Arn?: Value<string>

    constructor(properties: IamInstanceProfileSpecification) {
        Object.assign(this, properties)
    }
}

export class InstanceNetworkInterfaceSpecification {
    AssociatePublicIpAddress?: Value<boolean>
    DeleteOnTermination?: Value<boolean>
    Description?: Value<string>
    DeviceIndex?: Value<number>
    Groups?: List<Value<string>>
    Ipv6AddressCount?: Value<number>
    Ipv6Addresses?: List<InstanceIpv6Address>
    NetworkInterfaceId?: Value<string>
    PrivateIpAddresses?: List<PrivateIpAddressSpecification>
    SecondaryPrivateIpAddressCount?: Value<number>
    SubnetId?: Value<string>

    constructor(properties: InstanceNetworkInterfaceSpecification) {
        Object.assign(this, properties)
    }
}

export class SpotFleetTagSpecification {
    ResourceType?: Value<string>

    constructor(properties: SpotFleetTagSpecification) {
        Object.assign(this, properties)
    }
}

export class PrivateIpAddressSpecification {
    Primary?: Value<boolean>
    PrivateIpAddress: Value<string>

    constructor(properties: PrivateIpAddressSpecification) {
        Object.assign(this, properties)
    }
}

export class SpotFleetLaunchSpecification {
    BlockDeviceMappings?: List<BlockDeviceMapping>
    EbsOptimized?: Value<boolean>
    IamInstanceProfile?: IamInstanceProfileSpecification
    ImageId: Value<string>
    InstanceType: Value<string>
    KernelId?: Value<string>
    KeyName?: Value<string>
    Monitoring?: SpotFleetMonitoring
    NetworkInterfaces?: List<InstanceNetworkInterfaceSpecification>
    Placement?: SpotPlacement
    RamdiskId?: Value<string>
    SecurityGroups?: List<GroupIdentifier>
    SpotPrice?: Value<string>
    SubnetId?: Value<string>
    TagSpecifications?: List<SpotFleetTagSpecification>
    UserData?: Value<string>
    WeightedCapacity?: Value<number>

    constructor(properties: SpotFleetLaunchSpecification) {
        Object.assign(this, properties)
    }
}

export class SpotPlacement {
    AvailabilityZone?: Value<string>
    GroupName?: Value<string>

    constructor(properties: SpotPlacement) {
        Object.assign(this, properties)
    }
}

export class SpotFleetRequestConfigData {
    AllocationStrategy?: Value<string>
    ExcessCapacityTerminationPolicy?: Value<string>
    IamFleetRole: Value<string>
    LaunchSpecifications?: List<SpotFleetLaunchSpecification>
    ReplaceUnhealthyInstances?: Value<boolean>
    SpotPrice?: Value<string>
    TargetCapacity: Value<number>
    TerminateInstancesWithExpiration?: Value<boolean>
    Type?: Value<string>
    ValidFrom?: Value<string>
    ValidUntil?: Value<string>

    constructor(properties: SpotFleetRequestConfigData) {
        Object.assign(this, properties)
    }
}

export class EbsBlockDevice {
    DeleteOnTermination?: Value<boolean>
    Encrypted?: Value<boolean>
    Iops?: Value<number>
    SnapshotId?: Value<string>
    VolumeSize?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: EbsBlockDevice) {
        Object.assign(this, properties)
    }
}

export class InstanceIpv6Address {
    Ipv6Address: Value<string>

    constructor(properties: InstanceIpv6Address) {
        Object.assign(this, properties)
    }
}

export class GroupIdentifier {
    GroupId: Value<string>

    constructor(properties: GroupIdentifier) {
        Object.assign(this, properties)
    }
}

export class SpotFleetMonitoring {
    Enabled?: Value<boolean>

    constructor(properties: SpotFleetMonitoring) {
        Object.assign(this, properties)
    }
}

export class BlockDeviceMapping {
    DeviceName: Value<string>
    Ebs?: EbsBlockDevice
    NoDevice?: Value<string>
    VirtualName?: Value<string>

    constructor(properties: BlockDeviceMapping) {
        Object.assign(this, properties)
    }
}

export interface SpotFleetProperties {
    SpotFleetRequestConfigData: SpotFleetRequestConfigData
}

export default class SpotFleet extends ResourceBase {
    static IamInstanceProfileSpecification = IamInstanceProfileSpecification
    static InstanceNetworkInterfaceSpecification = InstanceNetworkInterfaceSpecification
    static SpotFleetTagSpecification = SpotFleetTagSpecification
    static PrivateIpAddressSpecification = PrivateIpAddressSpecification
    static SpotFleetLaunchSpecification = SpotFleetLaunchSpecification
    static SpotPlacement = SpotPlacement
    static SpotFleetRequestConfigData = SpotFleetRequestConfigData
    static EbsBlockDevice = EbsBlockDevice
    static InstanceIpv6Address = InstanceIpv6Address
    static GroupIdentifier = GroupIdentifier
    static SpotFleetMonitoring = SpotFleetMonitoring
    static BlockDeviceMapping = BlockDeviceMapping

    constructor(properties?: SpotFleetProperties) {
        super('AWS::EC2::SpotFleet', properties)
    }
}
