import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ContainerDefinition {
    Command?: List<Value<string>>;
    Cpu?: Value<number>;
    DisableNetworking?: Value<boolean>;
    DnsSearchDomains?: List<Value<string>>;
    DnsServers?: List<Value<string>>;
    DockerLabels?: {
        [key: string]: Value<string>;
    };
    DockerSecurityOptions?: List<Value<string>>;
    EntryPoint?: List<Value<string>>;
    Environment?: List<KeyValuePair>;
    Essential?: Value<boolean>;
    ExtraHosts?: List<HostEntry>;
    Hostname?: Value<string>;
    Image?: Value<string>;
    Links?: List<Value<string>>;
    LinuxParameters?: LinuxParameters;
    LogConfiguration?: LogConfiguration;
    Memory?: Value<number>;
    MemoryReservation?: Value<number>;
    MountPoints?: List<MountPoint>;
    Name?: Value<string>;
    PortMappings?: List<PortMapping>;
    Privileged?: Value<boolean>;
    ReadonlyRootFilesystem?: Value<boolean>;
    Ulimits?: List<Ulimit>;
    User?: Value<string>;
    VolumesFrom?: List<VolumeFrom>;
    WorkingDirectory?: Value<string>;
    constructor(properties: ContainerDefinition);
}
export declare class LogConfiguration {
    LogDriver: Value<string>;
    Options?: {
        [key: string]: Value<string>;
    };
    constructor(properties: LogConfiguration);
}
export declare class Device {
    ContainerPath?: Value<string>;
    HostPath: Value<string>;
    Permissions?: List<Value<string>>;
    constructor(properties: Device);
}
export declare class KeyValuePair {
    Name?: Value<string>;
    Value?: Value<string>;
    constructor(properties: KeyValuePair);
}
export declare class MountPoint {
    ContainerPath?: Value<string>;
    ReadOnly?: Value<boolean>;
    SourceVolume?: Value<string>;
    constructor(properties: MountPoint);
}
export declare class VolumeFrom {
    ReadOnly?: Value<boolean>;
    SourceContainer?: Value<string>;
    constructor(properties: VolumeFrom);
}
export declare class HostEntry {
    Hostname: Value<string>;
    IpAddress: Value<string>;
    constructor(properties: HostEntry);
}
export declare class KernelCapabilities {
    Add?: List<Value<string>>;
    Drop?: List<Value<string>>;
    constructor(properties: KernelCapabilities);
}
export declare class TaskDefinitionPlacementConstraint {
    Expression?: Value<string>;
    Type: Value<string>;
    constructor(properties: TaskDefinitionPlacementConstraint);
}
export declare class Volume {
    Host?: HostVolumeProperties;
    Name?: Value<string>;
    constructor(properties: Volume);
}
export declare class PortMapping {
    ContainerPort?: Value<number>;
    HostPort?: Value<number>;
    Protocol?: Value<string>;
    constructor(properties: PortMapping);
}
export declare class Ulimit {
    HardLimit: Value<number>;
    Name: Value<string>;
    SoftLimit: Value<number>;
    constructor(properties: Ulimit);
}
export declare class LinuxParameters {
    Capabilities?: KernelCapabilities;
    Devices?: List<Device>;
    InitProcessEnabled?: Value<boolean>;
    constructor(properties: LinuxParameters);
}
export declare class HostVolumeProperties {
    SourcePath?: Value<string>;
    constructor(properties: HostVolumeProperties);
}
export interface TaskDefinitionProperties {
    ContainerDefinitions?: List<ContainerDefinition>;
    Cpu?: Value<string>;
    ExecutionRoleArn?: Value<string>;
    Family?: Value<string>;
    Memory?: Value<string>;
    NetworkMode?: Value<string>;
    PlacementConstraints?: List<TaskDefinitionPlacementConstraint>;
    RequiresCompatibilities?: List<Value<string>>;
    TaskRoleArn?: Value<string>;
    Volumes?: List<Volume>;
}
export default class TaskDefinition extends ResourceBase {
    static ContainerDefinition: typeof ContainerDefinition;
    static LogConfiguration: typeof LogConfiguration;
    static Device: typeof Device;
    static KeyValuePair: typeof KeyValuePair;
    static MountPoint: typeof MountPoint;
    static VolumeFrom: typeof VolumeFrom;
    static HostEntry: typeof HostEntry;
    static KernelCapabilities: typeof KernelCapabilities;
    static TaskDefinitionPlacementConstraint: typeof TaskDefinitionPlacementConstraint;
    static Volume: typeof Volume;
    static PortMapping: typeof PortMapping;
    static Ulimit: typeof Ulimit;
    static LinuxParameters: typeof LinuxParameters;
    static HostVolumeProperties: typeof HostVolumeProperties;
    constructor(properties?: TaskDefinitionProperties);
}
