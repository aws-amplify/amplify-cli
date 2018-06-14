/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ComputeEnvironmentOrder {
    ComputeEnvironment: Value<string>
    Order: Value<number>

    constructor(properties: ComputeEnvironmentOrder) {
        Object.assign(this, properties)
    }
}

export interface JobQueueProperties {
    ComputeEnvironmentOrder: List<ComputeEnvironmentOrder>
    Priority: Value<number>
    State?: Value<string>
    JobQueueName?: Value<string>
}

export default class JobQueue extends ResourceBase {
    static ComputeEnvironmentOrder = ComputeEnvironmentOrder

    constructor(properties?: JobQueueProperties) {
        super('AWS::Batch::JobQueue', properties)
    }
}
