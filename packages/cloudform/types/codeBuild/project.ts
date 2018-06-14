/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Artifacts {
    Path?: Value<string>
    Type: Value<string>
    Packaging?: Value<string>
    Location?: Value<string>
    Name?: Value<string>
    NamespaceType?: Value<string>

    constructor(properties: Artifacts) {
        Object.assign(this, properties)
    }
}

export class SourceAuth {
    Type: Value<string>
    Resource?: Value<string>

    constructor(properties: SourceAuth) {
        Object.assign(this, properties)
    }
}

export class Environment {
    Type: Value<string>
    EnvironmentVariables?: List<EnvironmentVariable>
    PrivilegedMode?: Value<boolean>
    Image: Value<string>
    ComputeType: Value<string>

    constructor(properties: Environment) {
        Object.assign(this, properties)
    }
}

export class ProjectCache {
    Type: Value<string>
    Location?: Value<string>

    constructor(properties: ProjectCache) {
        Object.assign(this, properties)
    }
}

export class VpcConfig {
    Subnets: List<Value<string>>
    VpcId: Value<string>
    SecurityGroupIds: List<Value<string>>

    constructor(properties: VpcConfig) {
        Object.assign(this, properties)
    }
}

export class ProjectTriggers {
    Webhook?: Value<boolean>

    constructor(properties: ProjectTriggers) {
        Object.assign(this, properties)
    }
}

export class EnvironmentVariable {
    Type?: Value<string>
    Value: Value<string>
    Name: Value<string>

    constructor(properties: EnvironmentVariable) {
        Object.assign(this, properties)
    }
}

export class Source {
    Type: Value<string>
    Auth?: SourceAuth
    BuildSpec?: Value<string>
    GitCloneDepth?: Value<number>
    InsecureSsl?: Value<boolean>
    Location?: Value<string>

    constructor(properties: Source) {
        Object.assign(this, properties)
    }
}

export interface ProjectProperties {
    Description?: Value<string>
    VpcConfig?: VpcConfig
    EncryptionKey?: Value<string>
    Triggers?: ProjectTriggers
    Source: Source
    Name?: Value<string>
    Artifacts: Artifacts
    BadgeEnabled?: Value<boolean>
    ServiceRole: Value<string>
    Environment: Environment
    Tags?: ResourceTag[]
    TimeoutInMinutes?: Value<number>
    Cache?: ProjectCache
}

export default class Project extends ResourceBase {
    static Artifacts = Artifacts
    static SourceAuth = SourceAuth
    static Environment = Environment
    static ProjectCache = ProjectCache
    static VpcConfig = VpcConfig
    static ProjectTriggers = ProjectTriggers
    static EnvironmentVariable = EnvironmentVariable
    static Source = Source

    constructor(properties?: ProjectProperties) {
        super('AWS::CodeBuild::Project', properties)
    }
}
