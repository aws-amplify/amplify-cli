import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class LaunchTemplateConfig {
    LaunchTemplateSpecification?: FleetLaunchTemplateSpecification;
    Overrides?: List<LaunchTemplateOverrides>;
    constructor(properties: LaunchTemplateConfig);
}
export declare class IamInstanceProfileSpecification {
    Arn?: Value<string>;
    constructor(properties: IamInstanceProfileSpecification);
}
export declare class InstanceNetworkInterfaceSpecification {
    AssociatePublicIpAddress?: Value<boolean>;
    DeleteOnTermination?: Value<boolean>;
    Description?: Value<string>;
    DeviceIndex?: Value<number>;
    Groups?: List<Value<string>>;
    Ipv6AddressCount?: Value<number>;
    Ipv6Addresses?: List<InstanceIpv6Address>;
    NetworkInterfaceId?: Value<string>;
    PrivateIpAddresses?: List<PrivateIpAddressSpecification>;
    SecondaryPrivateIpAddressCount?: Value<number>;
    SubnetId?: Value<string>;
    constructor(properties: InstanceNetworkInterfaceSpecification);
}
export declare class SpotFleetTagSpecification {
    ResourceType?: Value<string>;
    constructor(properties: SpotFleetTagSpecification);
}
export declare class PrivateIpAddressSpecification {
    Primary?: Value<boolean>;
    PrivateIpAddress: Value<string>;
    constructor(properties: PrivateIpAddressSpecification);
}
export declare class SpotFleetLaunchSpecification {
    BlockDeviceMappings?: List<BlockDeviceMapping>;
    EbsOptimized?: Value<boolean>;
    IamInstanceProfile?: IamInstanceProfileSpecification;
    ImageId: Value<string>;
    InstanceType: Value<string>;
    KernelId?: Value<string>;
    KeyName?: Value<string>;
    Monitoring?: SpotFleetMonitoring;
    NetworkInterfaces?: List<InstanceNetworkInterfaceSpecification>;
    Placement?: SpotPlacement;
    RamdiskId?: Value<string>;
    SecurityGroups?: List<GroupIdentifier>;
    SpotPrice?: Value<string>;
    SubnetId?: Value<string>;
    TagSpecifications?: List<SpotFleetTagSpecification>;
    UserData?: Value<string>;
    WeightedCapacity?: Value<number>;
    constructor(properties: SpotFleetLaunchSpecification);
}
export declare class SpotPlacement {
    AvailabilityZone?: Value<string>;
    GroupName?: Value<string>;
    constructor(properties: SpotPlacement);
}
export declare class SpotFleetRequestConfigData {
    AllocationStrategy?: Value<string>;
    ExcessCapacityTerminationPolicy?: Value<string>;
    IamFleetRole: Value<string>;
    LaunchSpecifications?: List<SpotFleetLaunchSpecification>;
    LaunchTemplateConfigs?: List<LaunchTemplateConfig>;
    ReplaceUnhealthyInstances?: Value<boolean>;
    SpotPrice?: Value<string>;
    TargetCapacity: Value<number>;
    TerminateInstancesWithExpiration?: Value<boolean>;
    Type?: Value<string>;
    ValidFrom?: Value<string>;
    ValidUntil?: Value<string>;
    constructor(properties: SpotFleetRequestConfigData);
}
export declare class EbsBlockDevice {
    DeleteOnTermination?: Value<boolean>;
    Encrypted?: Value<boolean>;
    Iops?: Value<number>;
    SnapshotId?: Value<string>;
    VolumeSize?: Value<number>;
    VolumeType?: Value<string>;
    constructor(properties: EbsBlockDevice);
}
export declare class FleetLaunchTemplateSpecification {
    LaunchTemplateId?: Value<string>;
    LaunchTemplateName?: Value<string>;
    Version?: Value<string>;
    constructor(properties: FleetLaunchTemplateSpecification);
}
export declare class InstanceIpv6Address {
    Ipv6Address: Value<string>;
    constructor(properties: InstanceIpv6Address);
}
export declare class GroupIdentifier {
    GroupId: Value<string>;
    constructor(properties: GroupIdentifier);
}
export declare class LaunchTemplateOverrides {
    AvailabilityZone?: Value<string>;
    InstanceType?: Value<string>;
    SpotPrice?: Value<string>;
    SubnetId?: Value<string>;
    WeightedCapacity?: Value<number>;
    constructor(properties: LaunchTemplateOverrides);
}
export declare class SpotFleetMonitoring {
    Enabled?: Value<boolean>;
    constructor(properties: SpotFleetMonitoring);
}
export declare class BlockDeviceMapping {
    DeviceName: Value<string>;
    Ebs?: EbsBlockDevice;
    NoDevice?: Value<string>;
    VirtualName?: Value<string>;
    constructor(properties: BlockDeviceMapping);
}
export interface SpotFleetProperties {
    SpotFleetRequestConfigData: SpotFleetRequestConfigData;
}
export default class SpotFleet extends ResourceBase {
    static LaunchTemplateConfig: typeof LaunchTemplateConfig;
    static IamInstanceProfileSpecification: typeof IamInstanceProfileSpecification;
    static InstanceNetworkInterfaceSpecification: typeof InstanceNetworkInterfaceSpecification;
    static SpotFleetTagSpecification: typeof SpotFleetTagSpecification;
    static PrivateIpAddressSpecification: typeof PrivateIpAddressSpecification;
    static SpotFleetLaunchSpecification: typeof SpotFleetLaunchSpecification;
    static SpotPlacement: typeof SpotPlacement;
    static SpotFleetRequestConfigData: typeof SpotFleetRequestConfigData;
    static EbsBlockDevice: typeof EbsBlockDevice;
    static FleetLaunchTemplateSpecification: typeof FleetLaunchTemplateSpecification;
    static InstanceIpv6Address: typeof InstanceIpv6Address;
    static GroupIdentifier: typeof GroupIdentifier;
    static LaunchTemplateOverrides: typeof LaunchTemplateOverrides;
    static SpotFleetMonitoring: typeof SpotFleetMonitoring;
    static BlockDeviceMapping: typeof BlockDeviceMapping;
    constructor(properties?: SpotFleetProperties);
}
