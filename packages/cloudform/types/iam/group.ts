/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Policy {
    PolicyDocument: any
    PolicyName: Value<string>

    constructor(properties: Policy) {
        Object.assign(this, properties)
    }
}

export interface GroupProperties {
    GroupName?: Value<string>
    ManagedPolicyArns?: List<Value<string>>
    Path?: Value<string>
    Policies?: List<Policy>
}

export default class Group extends ResourceBase {
    static Policy = Policy

    constructor(properties?: GroupProperties) {
        super('AWS::IAM::Group', properties)
    }
}
