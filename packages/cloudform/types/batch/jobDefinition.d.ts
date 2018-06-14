import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Volumes {
    Host?: VolumesHost;
    Name?: Value<string>;
    constructor(properties: Volumes);
}
export declare class RetryStrategy {
    Attempts?: Value<number>;
    constructor(properties: RetryStrategy);
}
export declare class ContainerProperties {
    MountPoints?: List<MountPoints>;
    User?: Value<string>;
    Volumes?: List<Volumes>;
    Command?: List<Value<string>>;
    Memory: Value<number>;
    Privileged?: Value<boolean>;
    Environment?: List<Environment>;
    JobRoleArn?: Value<string>;
    ReadonlyRootFilesystem?: Value<boolean>;
    Ulimits?: List<Ulimit>;
    Vcpus: Value<number>;
    Image: Value<string>;
    constructor(properties: ContainerProperties);
}
export declare class MountPoints {
    ReadOnly?: Value<boolean>;
    SourceVolume?: Value<string>;
    ContainerPath?: Value<string>;
    constructor(properties: MountPoints);
}
export declare class Environment {
    Value?: Value<string>;
    Name?: Value<string>;
    constructor(properties: Environment);
}
export declare class Ulimit {
    SoftLimit: Value<number>;
    HardLimit: Value<number>;
    Name: Value<string>;
    constructor(properties: Ulimit);
}
export declare class VolumesHost {
    SourcePath?: Value<string>;
    constructor(properties: VolumesHost);
}
export interface JobDefinitionProperties {
    Type: Value<string>;
    Parameters?: any;
    ContainerProperties: ContainerProperties;
    JobDefinitionName?: Value<string>;
    RetryStrategy?: RetryStrategy;
}
export default class JobDefinition extends ResourceBase {
    static Volumes: typeof Volumes;
    static RetryStrategy: typeof RetryStrategy;
    static ContainerProperties: typeof ContainerProperties;
    static MountPoints: typeof MountPoints;
    static Environment: typeof Environment;
    static Ulimit: typeof Ulimit;
    static VolumesHost: typeof VolumesHost;
    constructor(properties?: JobDefinitionProperties);
}
