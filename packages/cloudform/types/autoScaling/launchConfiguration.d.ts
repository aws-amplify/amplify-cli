import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class BlockDeviceMapping {
    DeviceName: Value<string>;
    Ebs?: BlockDevice;
    NoDevice?: Value<boolean>;
    VirtualName?: Value<string>;
    constructor(properties: BlockDeviceMapping);
}
export declare class BlockDevice {
    DeleteOnTermination?: Value<boolean>;
    Encrypted?: Value<boolean>;
    Iops?: Value<number>;
    SnapshotId?: Value<string>;
    VolumeSize?: Value<number>;
    VolumeType?: Value<string>;
    constructor(properties: BlockDevice);
}
export interface LaunchConfigurationProperties {
    AssociatePublicIpAddress?: Value<boolean>;
    BlockDeviceMappings?: List<BlockDeviceMapping>;
    ClassicLinkVPCId?: Value<string>;
    ClassicLinkVPCSecurityGroups?: List<Value<string>>;
    EbsOptimized?: Value<boolean>;
    IamInstanceProfile?: Value<string>;
    ImageId: Value<string>;
    InstanceId?: Value<string>;
    InstanceMonitoring?: Value<boolean>;
    InstanceType: Value<string>;
    KernelId?: Value<string>;
    KeyName?: Value<string>;
    PlacementTenancy?: Value<string>;
    RamDiskId?: Value<string>;
    SecurityGroups?: List<Value<string>>;
    SpotPrice?: Value<string>;
    UserData?: Value<string>;
}
export default class LaunchConfiguration extends ResourceBase {
    static BlockDeviceMapping: typeof BlockDeviceMapping;
    static BlockDevice: typeof BlockDevice;
    constructor(properties?: LaunchConfigurationProperties);
}
