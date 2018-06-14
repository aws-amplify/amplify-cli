/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class RunCommandParameters {
    RunCommandTargets: List<RunCommandTarget>

    constructor(properties: RunCommandParameters) {
        Object.assign(this, properties)
    }
}

export class Target {
    Arn: Value<string>
    EcsParameters?: EcsParameters
    Id: Value<string>
    Input?: Value<string>
    InputPath?: Value<string>
    InputTransformer?: InputTransformer
    KinesisParameters?: KinesisParameters
    RoleArn?: Value<string>
    RunCommandParameters?: RunCommandParameters

    constructor(properties: Target) {
        Object.assign(this, properties)
    }
}

export class RunCommandTarget {
    Key: Value<string>
    Values: List<Value<string>>

    constructor(properties: RunCommandTarget) {
        Object.assign(this, properties)
    }
}

export class InputTransformer {
    InputPathsMap?: {[key: string]: Value<string>}
    InputTemplate: Value<string>

    constructor(properties: InputTransformer) {
        Object.assign(this, properties)
    }
}

export class KinesisParameters {
    PartitionKeyPath: Value<string>

    constructor(properties: KinesisParameters) {
        Object.assign(this, properties)
    }
}

export class EcsParameters {
    TaskCount?: Value<number>
    TaskDefinitionArn: Value<string>

    constructor(properties: EcsParameters) {
        Object.assign(this, properties)
    }
}

export interface RuleProperties {
    Description?: Value<string>
    EventPattern?: any
    Name?: Value<string>
    RoleArn?: Value<string>
    ScheduleExpression?: Value<string>
    State?: Value<string>
    Targets?: List<Target>
}

export default class Rule extends ResourceBase {
    static RunCommandParameters = RunCommandParameters
    static Target = Target
    static RunCommandTarget = RunCommandTarget
    static InputTransformer = InputTransformer
    static KinesisParameters = KinesisParameters
    static EcsParameters = EcsParameters

    constructor(properties?: RuleProperties) {
        super('AWS::Events::Rule', properties)
    }
}
