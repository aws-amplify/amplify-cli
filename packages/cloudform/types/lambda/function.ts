/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class VpcConfig {
    SecurityGroupIds: List<Value<string>>
    SubnetIds: List<Value<string>>

    constructor(properties: VpcConfig) {
        Object.assign(this, properties)
    }
}

export class DeadLetterConfig {
    TargetArn?: Value<string>

    constructor(properties: DeadLetterConfig) {
        Object.assign(this, properties)
    }
}

export class TracingConfig {
    Mode?: Value<string>

    constructor(properties: TracingConfig) {
        Object.assign(this, properties)
    }
}

export class Code {
    S3Bucket?: Value<string>
    S3Key?: Value<string>
    S3ObjectVersion?: Value<string>
    ZipFile?: Value<string>

    constructor(properties: Code) {
        Object.assign(this, properties)
    }
}

export class Environment {
    Variables?: {[key: string]: Value<string>}

    constructor(properties: Environment) {
        Object.assign(this, properties)
    }
}

export interface FunctionProperties {
    Code: Code
    DeadLetterConfig?: DeadLetterConfig
    Description?: Value<string>
    Environment?: Environment
    FunctionName?: Value<string>
    Handler: Value<string>
    KmsKeyArn?: Value<string>
    MemorySize?: Value<number>
    ReservedConcurrentExecutions?: Value<number>
    Role: Value<string>
    Runtime: Value<string>
    Tags?: ResourceTag[]
    Timeout?: Value<number>
    TracingConfig?: TracingConfig
    VpcConfig?: VpcConfig
}

export default class Function extends ResourceBase {
    static VpcConfig = VpcConfig
    static DeadLetterConfig = DeadLetterConfig
    static TracingConfig = TracingConfig
    static Code = Code
    static Environment = Environment

    constructor(properties?: FunctionProperties) {
        super('AWS::Lambda::Function', properties)
    }
}
