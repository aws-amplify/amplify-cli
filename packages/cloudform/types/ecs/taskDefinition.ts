/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ContainerDefinition {
    Command?: List<Value<string>>
    Cpu?: Value<number>
    DisableNetworking?: Value<boolean>
    DnsSearchDomains?: List<Value<string>>
    DnsServers?: List<Value<string>>
    DockerLabels?: {[key: string]: Value<string>}
    DockerSecurityOptions?: List<Value<string>>
    EntryPoint?: List<Value<string>>
    Environment?: List<KeyValuePair>
    Essential?: Value<boolean>
    ExtraHosts?: List<HostEntry>
    HealthCheck?: HealthCheck
    Hostname?: Value<string>
    Image?: Value<string>
    Links?: List<Value<string>>
    LinuxParameters?: LinuxParameters
    LogConfiguration?: LogConfiguration
    Memory?: Value<number>
    MemoryReservation?: Value<number>
    MountPoints?: List<MountPoint>
    Name?: Value<string>
    PortMappings?: List<PortMapping>
    Privileged?: Value<boolean>
    ReadonlyRootFilesystem?: Value<boolean>
    Ulimits?: List<Ulimit>
    User?: Value<string>
    VolumesFrom?: List<VolumeFrom>
    WorkingDirectory?: Value<string>

    constructor(properties: ContainerDefinition) {
        Object.assign(this, properties)
    }
}

export class LogConfiguration {
    LogDriver: Value<string>
    Options?: {[key: string]: Value<string>}

    constructor(properties: LogConfiguration) {
        Object.assign(this, properties)
    }
}

export class Device {
    ContainerPath?: Value<string>
    HostPath: Value<string>
    Permissions?: List<Value<string>>

    constructor(properties: Device) {
        Object.assign(this, properties)
    }
}

export class KeyValuePair {
    Name?: Value<string>
    Value?: Value<string>

    constructor(properties: KeyValuePair) {
        Object.assign(this, properties)
    }
}

export class MountPoint {
    ContainerPath?: Value<string>
    ReadOnly?: Value<boolean>
    SourceVolume?: Value<string>

    constructor(properties: MountPoint) {
        Object.assign(this, properties)
    }
}

export class VolumeFrom {
    ReadOnly?: Value<boolean>
    SourceContainer?: Value<string>

    constructor(properties: VolumeFrom) {
        Object.assign(this, properties)
    }
}

export class HostEntry {
    Hostname: Value<string>
    IpAddress: Value<string>

    constructor(properties: HostEntry) {
        Object.assign(this, properties)
    }
}

export class KernelCapabilities {
    Add?: List<Value<string>>
    Drop?: List<Value<string>>

    constructor(properties: KernelCapabilities) {
        Object.assign(this, properties)
    }
}

export class TaskDefinitionPlacementConstraint {
    Expression?: Value<string>
    Type: Value<string>

    constructor(properties: TaskDefinitionPlacementConstraint) {
        Object.assign(this, properties)
    }
}

export class Volume {
    Host?: HostVolumeProperties
    Name?: Value<string>

    constructor(properties: Volume) {
        Object.assign(this, properties)
    }
}

export class HealthCheck {
    Command: List<Value<string>>
    Interval?: Value<number>
    Retries?: Value<number>
    StartPeriod?: Value<number>
    Timeout?: Value<number>

    constructor(properties: HealthCheck) {
        Object.assign(this, properties)
    }
}

export class PortMapping {
    ContainerPort?: Value<number>
    HostPort?: Value<number>
    Protocol?: Value<string>

    constructor(properties: PortMapping) {
        Object.assign(this, properties)
    }
}

export class Ulimit {
    HardLimit: Value<number>
    Name: Value<string>
    SoftLimit: Value<number>

    constructor(properties: Ulimit) {
        Object.assign(this, properties)
    }
}

export class LinuxParameters {
    Capabilities?: KernelCapabilities
    Devices?: List<Device>
    InitProcessEnabled?: Value<boolean>

    constructor(properties: LinuxParameters) {
        Object.assign(this, properties)
    }
}

export class HostVolumeProperties {
    SourcePath?: Value<string>

    constructor(properties: HostVolumeProperties) {
        Object.assign(this, properties)
    }
}

export interface TaskDefinitionProperties {
    ContainerDefinitions?: List<ContainerDefinition>
    Cpu?: Value<string>
    ExecutionRoleArn?: Value<string>
    Family?: Value<string>
    Memory?: Value<string>
    NetworkMode?: Value<string>
    PlacementConstraints?: List<TaskDefinitionPlacementConstraint>
    RequiresCompatibilities?: List<Value<string>>
    TaskRoleArn?: Value<string>
    Volumes?: List<Volume>
}

export default class TaskDefinition extends ResourceBase {
    static ContainerDefinition = ContainerDefinition
    static LogConfiguration = LogConfiguration
    static Device = Device
    static KeyValuePair = KeyValuePair
    static MountPoint = MountPoint
    static VolumeFrom = VolumeFrom
    static HostEntry = HostEntry
    static KernelCapabilities = KernelCapabilities
    static TaskDefinitionPlacementConstraint = TaskDefinitionPlacementConstraint
    static Volume = Volume
    static HealthCheck = HealthCheck
    static PortMapping = PortMapping
    static Ulimit = Ulimit
    static LinuxParameters = LinuxParameters
    static HostVolumeProperties = HostVolumeProperties

    constructor(properties?: TaskDefinitionProperties) {
        super('AWS::ECS::TaskDefinition', properties)
    }
}
