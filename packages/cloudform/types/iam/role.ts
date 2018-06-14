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

export interface RoleProperties {
    AssumeRolePolicyDocument: any
    ManagedPolicyArns?: List<Value<string>>
    MaxSessionDuration?: Value<number>
    Path?: Value<string>
    Policies?: List<Policy>
    RoleName?: Value<string>
}

export default class Role extends ResourceBase {
    static Policy = Policy

    constructor(properties?: RoleProperties) {
        super('AWS::IAM::Role', properties)
    }
}
