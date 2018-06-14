/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class RepositoryTrigger {
    Events?: List<Value<string>>
    Branches?: List<Value<string>>
    CustomData?: Value<string>
    DestinationArn?: Value<string>
    Name?: Value<string>

    constructor(properties: RepositoryTrigger) {
        Object.assign(this, properties)
    }
}

export interface RepositoryProperties {
    RepositoryName: Value<string>
    Triggers?: List<RepositoryTrigger>
    RepositoryDescription?: Value<string>
}

export default class Repository extends ResourceBase {
    static RepositoryTrigger = RepositoryTrigger

    constructor(properties?: RepositoryProperties) {
        super('AWS::CodeCommit::Repository', properties)
    }
}
