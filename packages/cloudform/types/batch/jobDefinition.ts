/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Volumes {
    Host?: VolumesHost
    Name?: Value<string>

    constructor(properties: Volumes) {
        Object.assign(this, properties)
    }
}

export class RetryStrategy {
    Attempts?: Value<number>

    constructor(properties: RetryStrategy) {
        Object.assign(this, properties)
    }
}

export class ContainerProperties {
    MountPoints?: List<MountPoints>
    User?: Value<string>
    Volumes?: List<Volumes>
    Command?: List<Value<string>>
    Memory: Value<number>
    Privileged?: Value<boolean>
    Environment?: List<Environment>
    JobRoleArn?: Value<string>
    ReadonlyRootFilesystem?: Value<boolean>
    Ulimits?: List<Ulimit>
    Vcpus: Value<number>
    Image: Value<string>

    constructor(properties: ContainerProperties) {
        Object.assign(this, properties)
    }
}

export class MountPoints {
    ReadOnly?: Value<boolean>
    SourceVolume?: Value<string>
    ContainerPath?: Value<string>

    constructor(properties: MountPoints) {
        Object.assign(this, properties)
    }
}

export class Environment {
    Value?: Value<string>
    Name?: Value<string>

    constructor(properties: Environment) {
        Object.assign(this, properties)
    }
}

export class Ulimit {
    SoftLimit: Value<number>
    HardLimit: Value<number>
    Name: Value<string>

    constructor(properties: Ulimit) {
        Object.assign(this, properties)
    }
}

export class VolumesHost {
    SourcePath?: Value<string>

    constructor(properties: VolumesHost) {
        Object.assign(this, properties)
    }
}

export interface JobDefinitionProperties {
    Type: Value<string>
    Parameters?: any
    ContainerProperties: ContainerProperties
    JobDefinitionName?: Value<string>
    RetryStrategy?: RetryStrategy
}

export default class JobDefinition extends ResourceBase {
    static Volumes = Volumes
    static RetryStrategy = RetryStrategy
    static ContainerProperties = ContainerProperties
    static MountPoints = MountPoints
    static Environment = Environment
    static Ulimit = Ulimit
    static VolumesHost = VolumesHost

    constructor(properties?: JobDefinitionProperties) {
        super('AWS::Batch::JobDefinition', properties)
    }
}
