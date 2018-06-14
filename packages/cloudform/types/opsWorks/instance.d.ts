import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class BlockDeviceMapping {
    DeviceName?: Value<string>;
    Ebs?: EbsBlockDevice;
    NoDevice?: Value<string>;
    VirtualName?: Value<string>;
    constructor(properties: BlockDeviceMapping);
}
export declare class EbsBlockDevice {
    DeleteOnTermination?: Value<boolean>;
    Iops?: Value<number>;
    SnapshotId?: Value<string>;
    VolumeSize?: Value<number>;
    VolumeType?: Value<string>;
    constructor(properties: EbsBlockDevice);
}
export declare class TimeBasedAutoScaling {
    Friday?: {
        [key: string]: Value<string>;
    };
    Monday?: {
        [key: string]: Value<string>;
    };
    Saturday?: {
        [key: string]: Value<string>;
    };
    Sunday?: {
        [key: string]: Value<string>;
    };
    Thursday?: {
        [key: string]: Value<string>;
    };
    Tuesday?: {
        [key: string]: Value<string>;
    };
    Wednesday?: {
        [key: string]: Value<string>;
    };
    constructor(properties: TimeBasedAutoScaling);
}
export interface InstanceProperties {
    AgentVersion?: Value<string>;
    AmiId?: Value<string>;
    Architecture?: Value<string>;
    AutoScalingType?: Value<string>;
    AvailabilityZone?: Value<string>;
    BlockDeviceMappings?: List<BlockDeviceMapping>;
    EbsOptimized?: Value<boolean>;
    ElasticIps?: List<Value<string>>;
    Hostname?: Value<string>;
    InstallUpdatesOnBoot?: Value<boolean>;
    InstanceType: Value<string>;
    LayerIds: List<Value<string>>;
    Os?: Value<string>;
    RootDeviceType?: Value<string>;
    SshKeyName?: Value<string>;
    StackId: Value<string>;
    SubnetId?: Value<string>;
    Tenancy?: Value<string>;
    TimeBasedAutoScaling?: TimeBasedAutoScaling;
    VirtualizationType?: Value<string>;
    Volumes?: List<Value<string>>;
}
export default class Instance extends ResourceBase {
    static BlockDeviceMapping: typeof BlockDeviceMapping;
    static EbsBlockDevice: typeof EbsBlockDevice;
    static TimeBasedAutoScaling: typeof TimeBasedAutoScaling;
    constructor(properties?: InstanceProperties);
}
