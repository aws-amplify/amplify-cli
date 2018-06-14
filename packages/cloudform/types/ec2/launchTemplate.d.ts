import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class PrivateIpAdd {
    PrivateIpAddress?: Value<string>;
    Primary?: Value<boolean>;
    constructor(properties: PrivateIpAdd);
}
export declare class LaunchTemplateData {
    SecurityGroups?: List<Value<string>>;
    TagSpecifications?: List<TagSpecification>;
    UserData?: Value<string>;
    InstanceInitiatedShutdownBehavior?: Value<string>;
    BlockDeviceMappings?: List<BlockDeviceMapping>;
    IamInstanceProfile?: IamInstanceProfile;
    KernelId?: Value<string>;
    SecurityGroupIds?: List<Value<string>>;
    EbsOptimized?: Value<boolean>;
    KeyName?: Value<string>;
    DisableApiTermination?: Value<boolean>;
    ElasticGpuSpecifications?: List<ElasticGpuSpecification>;
    Placement?: Placement;
    InstanceMarketOptions?: InstanceMarketOptions;
    NetworkInterfaces?: List<NetworkInterface>;
    ImageId?: Value<string>;
    InstanceType?: Value<string>;
    RamDiskId?: Value<string>;
    Monitoring?: Monitoring;
    CreditSpecification?: CreditSpecification;
    constructor(properties: LaunchTemplateData);
}
export declare class InstanceMarketOptions {
    SpotOptions?: SpotOptions;
    MarketType?: Value<string>;
    constructor(properties: InstanceMarketOptions);
}
export declare class CreditSpecification {
    CpuCredits?: Value<string>;
    constructor(properties: CreditSpecification);
}
export declare class Monitoring {
    Enabled?: Value<boolean>;
    constructor(properties: Monitoring);
}
export declare class Placement {
    GroupName?: Value<string>;
    Tenancy?: Value<string>;
    AvailabilityZone?: Value<string>;
    Affinity?: Value<string>;
    HostId?: Value<string>;
    constructor(properties: Placement);
}
export declare class BlockDeviceMapping {
    Ebs?: Ebs;
    NoDevice?: Value<string>;
    VirtualName?: Value<string>;
    DeviceName?: Value<string>;
    constructor(properties: BlockDeviceMapping);
}
export declare class SpotOptions {
    SpotInstanceType?: Value<string>;
    InstanceInterruptionBehavior?: Value<string>;
    MaxPrice?: Value<string>;
    constructor(properties: SpotOptions);
}
export declare class ElasticGpuSpecification {
    Type?: Value<string>;
    constructor(properties: ElasticGpuSpecification);
}
export declare class TagSpecification {
    ResourceType?: Value<string>;
    Tags?: ResourceTag[];
    constructor(properties: TagSpecification);
}
export declare class Ipv6Add {
    Ipv6Address?: Value<string>;
    constructor(properties: Ipv6Add);
}
export declare class IamInstanceProfile {
    Arn?: Value<string>;
    Name?: Value<string>;
    constructor(properties: IamInstanceProfile);
}
export declare class NetworkInterface {
    Description?: Value<string>;
    PrivateIpAddress?: Value<string>;
    PrivateIpAddresses?: List<PrivateIpAdd>;
    SecondaryPrivateIpAddressCount?: Value<number>;
    Ipv6AddressCount?: Value<number>;
    Groups?: List<Value<string>>;
    DeviceIndex?: Value<number>;
    SubnetId?: Value<string>;
    Ipv6Addresses?: List<Ipv6Add>;
    AssociatePublicIpAddress?: Value<boolean>;
    NetworkInterfaceId?: Value<string>;
    DeleteOnTermination?: Value<boolean>;
    constructor(properties: NetworkInterface);
}
export declare class Ebs {
    SnapshotId?: Value<string>;
    VolumeType?: Value<string>;
    KmsKeyId?: Value<string>;
    Encrypted?: Value<boolean>;
    Iops?: Value<number>;
    VolumeSize?: Value<number>;
    DeleteOnTermination?: Value<boolean>;
    constructor(properties: Ebs);
}
export interface LaunchTemplateProperties {
    LaunchTemplateName?: Value<string>;
    LaunchTemplateData?: LaunchTemplateData;
}
export default class LaunchTemplate extends ResourceBase {
    static PrivateIpAdd: typeof PrivateIpAdd;
    static LaunchTemplateData: typeof LaunchTemplateData;
    static InstanceMarketOptions: typeof InstanceMarketOptions;
    static CreditSpecification: typeof CreditSpecification;
    static Monitoring: typeof Monitoring;
    static Placement: typeof Placement;
    static BlockDeviceMapping: typeof BlockDeviceMapping;
    static SpotOptions: typeof SpotOptions;
    static ElasticGpuSpecification: typeof ElasticGpuSpecification;
    static TagSpecification: typeof TagSpecification;
    static Ipv6Add: typeof Ipv6Add;
    static IamInstanceProfile: typeof IamInstanceProfile;
    static NetworkInterface: typeof NetworkInterface;
    static Ebs: typeof Ebs;
    constructor(properties?: LaunchTemplateProperties);
}
