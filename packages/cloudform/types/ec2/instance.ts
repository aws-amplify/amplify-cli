/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class ElasticGpuSpecification {
    Type: Value<string>

    constructor(properties: ElasticGpuSpecification) {
        Object.assign(this, properties)
    }
}

export class NetworkInterface {
    AssociatePublicIpAddress?: Value<boolean>
    DeleteOnTermination?: Value<boolean>
    Description?: Value<string>
    DeviceIndex: Value<string>
    GroupSet?: List<Value<string>>
    Ipv6AddressCount?: Value<number>
    Ipv6Addresses?: List<InstanceIpv6Address>
    NetworkInterfaceId?: Value<string>
    PrivateIpAddress?: Value<string>
    PrivateIpAddresses?: List<PrivateIpAddressSpecification>
    SecondaryPrivateIpAddressCount?: Value<number>
    SubnetId?: Value<string>

    constructor(properties: NetworkInterface) {
        Object.assign(this, properties)
    }
}

export class InstanceIpv6Address {
    Ipv6Address: Value<string>

    constructor(properties: InstanceIpv6Address) {
        Object.assign(this, properties)
    }
}

export class Volume {
    Device: Value<string>
    VolumeId: Value<string>

    constructor(properties: Volume) {
        Object.assign(this, properties)
    }
}

export class AssociationParameter {
    Key: Value<string>
    Value: List<Value<string>>

    constructor(properties: AssociationParameter) {
        Object.assign(this, properties)
    }
}

export class LaunchTemplateSpecification {
    LaunchTemplateId?: Value<string>
    LaunchTemplateName?: Value<string>
    Version: Value<string>

    constructor(properties: LaunchTemplateSpecification) {
        Object.assign(this, properties)
    }
}

export class Ebs {
    DeleteOnTermination?: Value<boolean>
    Encrypted?: Value<boolean>
    Iops?: Value<number>
    SnapshotId?: Value<string>
    VolumeSize?: Value<number>
    VolumeType?: Value<string>

    constructor(properties: Ebs) {
        Object.assign(this, properties)
    }
}

export class NoDevice {


    constructor(properties: NoDevice) {
        Object.assign(this, properties)
    }
}

export class SsmAssociation {
    AssociationParameters?: List<AssociationParameter>
    DocumentName: Value<string>

    constructor(properties: SsmAssociation) {
        Object.assign(this, properties)
    }
}

export class CreditSpecification {
    CPUCredits?: Value<string>

    constructor(properties: CreditSpecification) {
        Object.assign(this, properties)
    }
}

export class BlockDeviceMapping {
    DeviceName: Value<string>
    Ebs?: Ebs
    NoDevice?: NoDevice
    VirtualName?: Value<string>

    constructor(properties: BlockDeviceMapping) {
        Object.assign(this, properties)
    }
}

export class PrivateIpAddressSpecification {
    Primary: Value<boolean>
    PrivateIpAddress: Value<string>

    constructor(properties: PrivateIpAddressSpecification) {
        Object.assign(this, properties)
    }
}

export interface InstanceProperties {
    AdditionalInfo?: Value<string>
    Affinity?: Value<string>
    AvailabilityZone?: Value<string>
    BlockDeviceMappings?: List<BlockDeviceMapping>
    CreditSpecification?: CreditSpecification
    DisableApiTermination?: Value<boolean>
    EbsOptimized?: Value<boolean>
    ElasticGpuSpecifications?: List<ElasticGpuSpecification>
    HostId?: Value<string>
    IamInstanceProfile?: Value<string>
    ImageId?: Value<string>
    InstanceInitiatedShutdownBehavior?: Value<string>
    InstanceType?: Value<string>
    Ipv6AddressCount?: Value<number>
    Ipv6Addresses?: List<InstanceIpv6Address>
    KernelId?: Value<string>
    KeyName?: Value<string>
    LaunchTemplate?: LaunchTemplateSpecification
    Monitoring?: Value<boolean>
    NetworkInterfaces?: List<NetworkInterface>
    PlacementGroupName?: Value<string>
    PrivateIpAddress?: Value<string>
    RamdiskId?: Value<string>
    SecurityGroupIds?: List<Value<string>>
    SecurityGroups?: List<Value<string>>
    SourceDestCheck?: Value<boolean>
    SsmAssociations?: List<SsmAssociation>
    SubnetId?: Value<string>
    Tags?: ResourceTag[]
    Tenancy?: Value<string>
    UserData?: Value<string>
    Volumes?: List<Volume>
}

export default class Instance extends ResourceBase {
    static ElasticGpuSpecification = ElasticGpuSpecification
    static NetworkInterface = NetworkInterface
    static InstanceIpv6Address = InstanceIpv6Address
    static Volume = Volume
    static AssociationParameter = AssociationParameter
    static LaunchTemplateSpecification = LaunchTemplateSpecification
    static Ebs = Ebs
    static NoDevice = NoDevice
    static SsmAssociation = SsmAssociation
    static CreditSpecification = CreditSpecification
    static BlockDeviceMapping = BlockDeviceMapping
    static PrivateIpAddressSpecification = PrivateIpAddressSpecification

    constructor(properties?: InstanceProperties) {
        super('AWS::EC2::Instance', properties)
    }
}
