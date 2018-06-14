/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class JobCommand {
    ScriptLocation?: Value<string>
    Name?: Value<string>

    constructor(properties: JobCommand) {
        Object.assign(this, properties)
    }
}

export class ConnectionsList {
    Connections?: List<Value<string>>

    constructor(properties: ConnectionsList) {
        Object.assign(this, properties)
    }
}

export class ExecutionProperty {
    MaxConcurrentRuns?: Value<number>

    constructor(properties: ExecutionProperty) {
        Object.assign(this, properties)
    }
}

export interface JobProperties {
    Role: Value<string>
    DefaultArguments?: any
    Connections?: ConnectionsList
    MaxRetries?: Value<number>
    Description?: Value<string>
    LogUri?: Value<string>
    Command: JobCommand
    AllocatedCapacity?: Value<number>
    ExecutionProperty?: ExecutionProperty
    Name?: Value<string>
}

export default class Job extends ResourceBase {
    static JobCommand = JobCommand
    static ConnectionsList = ConnectionsList
    static ExecutionProperty = ExecutionProperty

    constructor(properties?: JobProperties) {
        super('AWS::Glue::Job', properties)
    }
}
