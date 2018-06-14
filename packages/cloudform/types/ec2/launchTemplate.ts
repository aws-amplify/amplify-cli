/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class PrivateIpAdd {
    PrivateIpAddress?: Value<string>
    Primary?: Value<boolean>

    constructor(properties: PrivateIpAdd) {
        Object.assign(this, properties)
    }
}

export class LaunchTemplateData {
    SecurityGroups?: List<Value<string>>
    TagSpecifications?: List<TagSpecification>
    UserData?: Value<string>
    InstanceInitiatedShutdownBehavior?: Value<string>
    BlockDeviceMappings?: List<BlockDeviceMapping>
    IamInstanceProfile?: IamInstanceProfile
    KernelId?: Value<string>
    SecurityGroupIds?: List<Value<string>>
    EbsOptimized?: Value<boolean>
    KeyName?: Value<string>
    DisableApiTermination?: Value<boolean>
    ElasticGpuSpecifications?: List<ElasticGpuSpecification>
    Placement?: Placement
    InstanceMarketOptions?: InstanceMarketOptions
    NetworkInterfaces?: List<NetworkInterface>
    ImageId?: Value<string>
    InstanceType?: Value<string>
    RamDiskId?: Value<string>
    Monitoring?: Monitoring
    CreditSpecification?: CreditSpecification

    constructor(properties: LaunchTemplateData) {
        Object.assign(this, properties)
    }
}

export class InstanceMarketOptions {
    SpotOptions?: SpotOptions
    MarketType?: Value<string>

    constructor(properties: InstanceMarketOptions) {
        Object.assign(this, properties)
    }
}

export class CreditSpecification {
    CpuCredits?: Value<string>

    constructor(properties: CreditSpecification) {
        Object.assign(this, properties)
    }
}

export class Monitoring {
    Enabled?: Value<boolean>

    constructor(properties: Monitoring) {
        Object.assign(this, properties)
    }
}

export class Placement {
    GroupName?: Value<string>
    Tenancy?: Value<string>
    AvailabilityZone?: Value<string>
    Affinity?: Value<string>
    HostId?: Value<string>

    constructor(properties: Placement) {
        Object.assign(this, properties)
    }
}

export class BlockDeviceMapping {
    Ebs?: Ebs
    NoDevice?: Value<string>
    VirtualName?: Value<string>
    DeviceName?: Value<string>

    constructor(properties: BlockDeviceMapping) {
        Object.assign(this, properties)
    }
}

export class SpotOptions {
    SpotInstanceType?: Value<string>
    InstanceInterruptionBehavior?: Value<string>
    MaxPrice?: Value<string>

    constructor(properties: SpotOptions) {
        Object.assign(this, properties)
    }
}

export class ElasticGpuSpecification {
    Type?: Value<string>

    constructor(properties: ElasticGpuSpecification) {
        Object.assign(this, properties)
    }
}

export class TagSpecification {
    ResourceType?: Value<string>
    Tags?: ResourceTag[]

    constructor(properties: TagSpecification) {
        Object.assign(this, properties)
    }
}

export class Ipv6Add {
    Ipv6Address?: Value<string>

    constructor(properties: Ipv6Add) {
        Object.assign(this, properties)
    }
}

export class IamInstanceProfile {
    Arn?: Value<string>
    Name?: Value<string>

    constructor(properties: IamInstanceProfile) {
        Object.assign(this, properties)
    }
}

export class NetworkInterface {
    Description?: Value<string>
    PrivateIpAddress?: Value<string>
    PrivateIpAddresses?: List<PrivateIpAdd>
    SecondaryPrivateIpAddressCount?: Value<number>
    Ipv6AddressCount?: Value<number>
    Groups?: List<Value<string>>
    DeviceIndex?: Value<number>
    SubnetId?: Value<string>
    Ipv6Addresses?: List<Ipv6Add>
    AssociatePublicIpAddress?: Value<boolean>
    NetworkInterfaceId?: Value<string>
    DeleteOnTermination?: Value<boolean>

    constructor(properties: NetworkInterface) {
        Object.assign(this, properties)
    }
}

export class Ebs {
    SnapshotId?: Value<string>
    VolumeType?: Value<string>
    KmsKeyId?: Value<string>
    Encrypted?: Value<boolean>
    Iops?: Value<number>
    VolumeSize?: Value<number>
    DeleteOnTermination?: Value<boolean>

    constructor(properties: Ebs) {
        Object.assign(this, properties)
    }
}

export interface LaunchTemplateProperties {
    LaunchTemplateName?: Value<string>
    LaunchTemplateData?: LaunchTemplateData
}

export default class LaunchTemplate extends ResourceBase {
    static PrivateIpAdd = PrivateIpAdd
    static LaunchTemplateData = LaunchTemplateData
    static InstanceMarketOptions = InstanceMarketOptions
    static CreditSpecification = CreditSpecification
    static Monitoring = Monitoring
    static Placement = Placement
    static BlockDeviceMapping = BlockDeviceMapping
    static SpotOptions = SpotOptions
    static ElasticGpuSpecification = ElasticGpuSpecification
    static TagSpecification = TagSpecification
    static Ipv6Add = Ipv6Add
    static IamInstanceProfile = IamInstanceProfile
    static NetworkInterface = NetworkInterface
    static Ebs = Ebs

    constructor(properties?: LaunchTemplateProperties) {
        super('AWS::EC2::LaunchTemplate', properties)
    }
}
